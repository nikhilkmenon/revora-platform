import {
  Injectable, NotFoundException, UnauthorizedException,
  InternalServerErrorException, Logger, ConflictException, BadRequestException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private razorpay: Razorpay;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.razorpay = new Razorpay({
      key_id: this.config.get('RAZORPAY_KEY_ID'),
      key_secret: this.config.get('RAZORPAY_KEY_SECRET'),
    });
  }

  // ── Create Razorpay order (With Idempotency & Transaction) ───────────
  async createOrder(dto: CreateOrderDto, userId: string, idempotencyKey?: string) {
    if (idempotencyKey) {
      const existing = await this.prisma.order.findUnique({ where: { idempotencyKey } });
      if (existing) return existing;
    }

    // Wrap in a transaction to safely handle inventory locking
    return await this.prisma.$transaction(async (prisma) => {
      const products = await Promise.all(
        dto.items.map(async item => {
          if (item.productId) {
            const product = await prisma.product.findUnique({ where: { id: item.productId } });
            if (!product) throw new NotFoundException(`Product ${item.productId} not found`);
            if (product.stock < item.quantity) throw new BadRequestException(`Insufficient stock for ${product.name}`);
            
            // Inventory locking (decrement stock)
            await prisma.product.update({
              where: { id: product.id },
              data: { stock: { decrement: item.quantity } },
            });
            return { type: 'product', data: product, item };
          } else if (item.fabricId) {
            const fabric = await prisma.fabric.findUnique({ where: { id: item.fabricId } });
            if (!fabric) throw new NotFoundException(`Fabric ${item.fabricId} not found`);
            if (fabric.stock < item.quantity) throw new BadRequestException(`Insufficient stock for ${fabric.name}`);
            
            // Inventory locking (decrement stock)
            await prisma.fabric.update({
              where: { id: fabric.id },
              data: { stock: { decrement: item.quantity } },
            });
            return { type: 'fabric', data: fabric, item };
          } else {
            throw new BadRequestException("Item must have either productId or fabricId");
          }
        }),
      );

      const total = products.reduce((sum, p) => {
        const price = p.type === 'product' ? (p.data as any).price : (p.data as any).pricePerYard;
        return sum + Number(price) * p.item.quantity;
      }, 0);

      // Order expiry set to 15 minutes
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      const order = await prisma.order.create({
        data: {
          userId,
          idempotencyKey,
          total,
          address: dto.address,
          status: 'PENDING',
          expiresAt,
          items: {
            create: products.map((p) => ({
              ...(p.type === 'product' ? { productId: p.data.id } : { fabricId: p.data.id }),
              quantity: p.item.quantity,
              price: p.type === 'product' ? (p.data as any).price : (p.data as any).pricePerYard,
            })),
          },
          payment: {
            create: { amount: total, currency: 'INR', status: 'PENDING' },
          },
        },
        include: { items: true, payment: true },
      });

      const amountInPaise = Math.max(100, Math.round(total * 100)); // Minimum 100 paise
      const razorpayOrder = await this.razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: order.id,
      });

      await prisma.order.update({
        where: { id: order.id },
        data: { razorpayOrderId: razorpayOrder.id }
      });

      return {
        order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        internalOrderId: order.id,
        message: 'Order created',
      };
    });
  }

  // ── Verify Payment Signature ──────────────────────────────────────────
  async verifyPayment(orderId: string, paymentId: string, signature: string, internalOrderId: string) {
    const secret = this.config.get('RAZORPAY_KEY_SECRET');
    if (!secret) throw new InternalServerErrorException('Razorpay secret not configured');

    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(orderId + '|' + paymentId)
      .digest('hex');

    if (generatedSignature !== signature) {
      throw new BadRequestException('Invalid payment signature');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: internalOrderId },
      include: { payment: true, items: { include: { product: true } } },
    });

    if (!order) throw new NotFoundException('Order not found');

    if (order.status === 'CONFIRMED') {
      return { success: true, message: 'Payment verified successfully (already processed)' };
    }

    await this.prisma.$transaction(async (prisma) => {
      await prisma.order.update({ where: { id: order.id }, data: { status: 'CONFIRMED' } });

      await prisma.payment.update({
        where: { orderId: order.id },
        data: { razorpayPayId: paymentId, status: 'CAPTURED', webhookVerified: true, eventId: paymentId },
      });

      // Calculate payouts to the designers (90% goes to designer, 10% platform fee)
      if (order.items.length > 0) {
        const designerTotals = new Map<string, number>();
        for (const item of order.items) {
          const prev = designerTotals.get(item.product.designerId) || 0;
          designerTotals.set(item.product.designerId, prev + Number(item.price) * item.quantity);
        }

        for (const [designerId, subtotal] of designerTotals) {
          await prisma.payout.create({
            data: {
              designerId,
              orderId: order.id,
              amount: subtotal * 0.90,
              status: 'PENDING',
            },
          });
        }
      }

      await prisma.orderTracking.create({
        data: { orderId: order.id, status: 'CONFIRMED', message: 'Payment confirmed via verification. Escrow created.' },
      });
    });

    return { success: true, message: 'Payment verified successfully' };
  }

  // ── Handle Razorpay webhook (With Replay Prevention) ─────────────────
  async handleWebhook(rawBody: string, signature: string) {
    if (!this.verifyWebhookSignature(rawBody, signature)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const eventId = payload.headers && payload.headers['x-razorpay-event-id'] ? payload.headers['x-razorpay-event-id'] : payload.account_id + event; // Simple fallback
    
    // Check if event was already processed
    const existingPayment = await this.prisma.payment.findFirst({ where: { eventId } });
    if (existingPayment) {
      this.logger.warn(`⚠️ Replay attack prevented. Event ID: ${eventId}`);
      return { ok: true, message: 'Already processed' };
    }

    this.logger.log(`📦 Razorpay webhook event: ${event}`);

    const rzpPayment = payload.payload.payment.entity;

    if (event === 'payment.captured') {
      await this.handlePaymentCaptured(rzpPayment, eventId);
    } else if (event === 'payment.failed') {
      await this.handlePaymentFailed(rzpPayment, eventId);
    }

    return { ok: true };
  }

  // ── Verify HMAC signature ────────────────────────────────────────────
  private verifyWebhookSignature(body: string, signature: string): boolean {
    const secret = this.config.get('RAZORPAY_WEBHOOK_SECRET');
    if (!secret || !signature) return false;

    try {
      const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(signature, 'utf8'));
    } catch {
      return false;
    }
  }

  // ── Payment captured (Escrow/Payout Creation) ────────────────────────
  private async handlePaymentCaptured(rzpPayment: any, eventId: string) {
    const order = await this.prisma.order.findFirst({
      where: { razorpayOrderId: rzpPayment.order_id },
      include: { payment: true, items: { include: { product: true } } },
    });

    if (!order) return;
    if (order.status === 'CONFIRMED') return;

    await this.prisma.$transaction(async (prisma) => {
      await prisma.order.update({ where: { id: order.id }, data: { status: 'CONFIRMED' } });

      await prisma.payment.update({
        where: { orderId: order.id },
        data: { razorpayPayId: rzpPayment.id, status: 'CAPTURED', webhookVerified: true, eventId },
      });

      // Calculate payouts to the designers (90% goes to designer, 10% platform fee)
      if (order.items.length > 0) {
        const designerTotals = new Map<string, number>();
        for (const item of order.items) {
          const prev = designerTotals.get(item.product.designerId) || 0;
          designerTotals.set(item.product.designerId, prev + Number(item.price) * item.quantity);
        }

        for (const [designerId, subtotal] of designerTotals) {
          await prisma.payout.create({
            data: {
              designerId,
              orderId: order.id,
              amount: subtotal * 0.90,
              status: 'PENDING',
            },
          });
        }
      }

      await prisma.orderTracking.create({
        data: { orderId: order.id, status: 'CONFIRMED', message: 'Payment confirmed. Escrow created.' },
      });
    });
    this.logger.log(`✅ Order ${order.id} CONFIRMED — Escrow Payout Created`);
  }

  // ── Payment failed (Inventory Unlock) ────────────────────────────────
  private async handlePaymentFailed(rzpPayment: any, eventId: string) {
    const order = await this.prisma.order.findFirst({
      where: { razorpayOrderId: rzpPayment.order_id },
      include: { items: true },
    });

    if (!order) return;

    await this.prisma.$transaction(async (prisma) => {
      await prisma.order.update({ where: { id: order.id }, data: { status: 'CANCELLED' } });
      await prisma.payment.update({
        where: { orderId: order.id },
        data: { status: 'FAILED', webhookVerified: true, eventId },
      });

      // Release inventory locks
      await Promise.all(
        order.items.map(item =>
          prisma.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          }),
        ),
      );
    });
    this.logger.warn(`❌ Payment failed for order ${order.id}. Inventory unlocked.`);
  }

  // ── Refund order ─────────────────────────────────────────────────────
  async refundOrder(orderId: string, user: any) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true, items: true },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== user.id && user.role !== 'ADMIN') {
      throw new UnauthorizedException('You do not have permission to refund this order');
    }
    if (order.status !== 'CONFIRMED' || !order.payment?.razorpayPayId) {
      throw new BadRequestException('Order cannot be refunded');
    }

    try {
      const refund = await this.razorpay.payments.refund(order.payment.razorpayPayId, {
        amount: Math.round(Number(order.payment.amount) * 100), // Amount in paise
      });

      await this.prisma.$transaction(async (prisma) => {
        await prisma.order.update({ where: { id: orderId }, data: { status: 'RETURNED' } });
        await prisma.payment.update({ where: { orderId }, data: { status: 'REFUNDED' } });
        
        // Cancel payout if pending
        await prisma.payout.updateMany({
          where: { orderId, status: 'PENDING' },
          data: { status: 'CANCELLED' }
        });

        // Restock items
        await Promise.all(
          order.items.map(item =>
            prisma.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            }),
          ),
        );
      });

      return { ok: true, refundId: refund.id };
    } catch (error) {
      this.logger.error('Refund failed', error);
      throw new InternalServerErrorException('Failed to process refund');
    }
  }
}

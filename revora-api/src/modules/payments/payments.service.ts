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
          const product = await prisma.product.findUnique({ where: { id: item.productId } });
          if (!product) throw new NotFoundException(`Product ${item.productId} not found`);
          if (product.stock < item.quantity) throw new BadRequestException(`Insufficient stock for ${product.name}`);
          
          // Inventory locking (decrement stock)
          await prisma.product.update({
            where: { id: product.id },
            data: { stock: { decrement: item.quantity } },
          });
          return product;
        }),
      );

      const total = products.reduce((sum, product, i) => sum + Number(product.price) * dto.items[i].quantity, 0);

      // Order expiry set to 15 minutes
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      let rzpOrder: any;
      try {
        rzpOrder = await this.razorpay.orders.create({
          amount: Math.round(Number(total) * 100),
          currency: 'INR',
          receipt: `rcpt_${Date.now()}`,
          notes: { userId },
        });
      } catch (err) {
        this.logger.error('Razorpay order creation failed', err);
        throw new InternalServerErrorException('Payment gateway error');
      }

      const order = await prisma.order.create({
        data: {
          userId,
          razorpayOrderId: rzpOrder.id,
          idempotencyKey,
          total,
          address: dto.address,
          status: 'PENDING',
          expiresAt,
          items: {
            create: dto.items.map((item, i) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: products[i].price,
            })),
          },
          payment: {
            create: { amount: total, currency: 'INR', status: 'PENDING' },
          },
        },
        include: { items: true, payment: true },
      });

      return {
        orderId: order.id,
        razorpayOrderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        key: this.config.get('RAZORPAY_KEY_ID'),
      };
    });
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
  async refundOrder(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true, items: true },
    });

    if (!order || order.userId !== userId) throw new NotFoundException('Order not found');
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

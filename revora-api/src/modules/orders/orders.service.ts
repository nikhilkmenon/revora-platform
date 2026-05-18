import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async findByUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: { include: { product: true } }, payment: true, tracking: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // BUG #23 FIX: Fetch a single order (with ownership check)
  async getOrderById(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } }, payment: true, tracking: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new ForbiddenException('Access denied');
    return order;
  }

  // BUG #23 FIX: Cancel a PENDING order
  async cancelOrder(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new ForbiddenException('Access denied');
    if (!['PENDING'].includes(order.status)) {
      throw new BadRequestException(`Cannot cancel an order with status ${order.status}`);
    }

    return this.prisma.$transaction(async (prisma) => {
      await prisma.order.update({ where: { id: orderId }, data: { status: 'CANCELLED' } });

      // Restore inventory
      await Promise.all(
        order.items.map(item =>
          prisma.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          }),
        ),
      );

      await prisma.orderTracking.create({
        data: { orderId, status: 'CANCELLED', message: 'Order cancelled by buyer.' },
      });

      return { message: 'Order cancelled' };
    });
  }

  // BUG #23 FIX: Get tracking timeline for an order
  async trackOrder(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { tracking: { orderBy: { createdAt: 'asc' } } },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new ForbiddenException('Access denied');
    return { status: order.status, timeline: order.tracking };
  }

  // BUG #23 FIX: Request a return for a DELIVERED order
  async requestReturn(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) throw new ForbiddenException('Access denied');
    if (order.status !== 'DELIVERED') {
      throw new BadRequestException('Only delivered orders can be returned');
    }

    await this.prisma.order.update({ where: { id: orderId }, data: { status: 'RETURNED' } });
    await this.prisma.orderTracking.create({
      data: { orderId, status: 'RETURN_REQUESTED', message: 'Return requested by buyer.' },
    });

    return { message: 'Return requested' };
  }
}


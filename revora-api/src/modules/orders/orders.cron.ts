import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class OrdersCron {
  private readonly logger = new Logger(OrdersCron.name);

  constructor(
    private prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  // BUG #11 FIX: every 5 min (not every 1 min) + Redis distributed lock
  @Cron('*/5 * * * *')
  async handleExpiredOrders() {
    const lockKey   = 'cron:expired_orders:lock';
    const lockValue = process.env.RAILWAY_REPLICA_ID || 'primary';
    const acquired  = await this.redis.set(lockKey, lockValue, 'EX', 240, 'NX');
    if (!acquired) {
      this.logger.debug('Cron lock held by another replica — skipping');
      return;
    }

    try {
      this.logger.debug('Running expired orders check...');

      const expiredOrders = await this.prisma.order.findMany({
        where: {
          status: 'PENDING',
          expiresAt: { lt: new Date() },
        },
        include: { items: true },
      });

      if (expiredOrders.length === 0) return;

      this.logger.log(`Found ${expiredOrders.length} expired orders. Processing cancellations...`);

      for (const order of expiredOrders) {
        await this.prisma.$transaction(async (prisma) => {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: 'CANCELLED' },
          });

          await Promise.all(
            order.items.map(item =>
              prisma.product.update({
                where: { id: item.productId },
                data: { stock: { increment: item.quantity } },
              }),
            ),
          );

          await prisma.orderTracking.create({
            data: {
              orderId: order.id,
              status: 'CANCELLED',
              message: 'Order expired due to non-payment.',
            },
          });

          await prisma.payment.updateMany({
            where: { orderId: order.id, status: 'PENDING' },
            data: { status: 'FAILED' },
          });
        });
        this.logger.log(`Cancelled expired order ${order.id} and released inventory.`);
      }
    } finally {
      await this.redis.del(lockKey);
    }
  }
}

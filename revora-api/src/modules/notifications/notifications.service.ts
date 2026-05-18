import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findByUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) throw new NotFoundException('Notification not found');

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  // BUG #22 FIX: Notifications table was always empty — no method to create them
  async send(userId: string, title: string, body: string, type: string, data?: any) {
    return this.prisma.notification.create({
      data: { userId, title, body, type, data: data ?? undefined },
    });
    // TODO: fire-and-forget WebSocket push + FCM push
  }
}


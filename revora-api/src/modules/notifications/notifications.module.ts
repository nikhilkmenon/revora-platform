import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsProcessor } from './notifications.processor'; // BUG #25 FIX

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsProcessor], // BUG #25 FIX: processor registered
  exports: [NotificationsService],
})
export class NotificationsModule {}


import { Controller, Get, UseGuards, Put, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  myNotifications(@GetUser('id') userId: string) {
    return this.notificationsService.findByUser(userId);
  }

  @Put(':id/read')
  markAsRead(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.notificationsService.markAsRead(id, userId);
  }
}

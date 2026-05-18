import { Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  myOrders(@GetUser('id') userId: string) {
    return this.ordersService.findByUser(userId);
  }

  // BUG #23 FIX: GET single order
  @Get(':id')
  getOrder(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.ordersService.getOrderById(id, userId);
  }

  // BUG #23 FIX: Cancel order
  @Delete(':id')
  cancelOrder(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.ordersService.cancelOrder(id, userId);
  }

  // BUG #23 FIX: Track order
  @Get(':id/track')
  trackOrder(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.ordersService.trackOrder(id, userId);
  }

  // BUG #23 FIX: Request return
  @Post(':id/return')
  requestReturn(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.ordersService.requestReturn(id, userId);
  }
}


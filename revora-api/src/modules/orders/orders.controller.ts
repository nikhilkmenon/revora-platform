import { Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  myOrders(@GetUser() user: any) {
    if (user.role === 'ADMIN') {
      return this.ordersService.findAll();
    } else if (user.role === 'DESIGNER') {
      return this.ordersService.findForDesigner(user.id);
    }
    return this.ordersService.findByUser(user.id);
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


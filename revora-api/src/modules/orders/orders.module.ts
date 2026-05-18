import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersCron } from './orders.cron';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, OrdersCron],
})
export class OrdersModule {}

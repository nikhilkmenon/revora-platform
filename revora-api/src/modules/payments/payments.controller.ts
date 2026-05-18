import {
  Controller, Post, Body, Headers, Req, Param,
  UseGuards, HttpCode, RawBodyRequest,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { PaymentsService } from './payments.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // ── Create Razorpay order ────────────────────────────────────────────
  @Post('create-order')
  @UseGuards(JwtAuthGuard)
  async createOrder(
    @Body() dto: CreateOrderDto,
    @GetUser('id') userId: string,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ) {
    return this.paymentsService.createOrder(dto, userId, idempotencyKey);
  }

  // ── Refund order ─────────────────────────────────────────────────────
  @Post(':id/refund')
  @UseGuards(JwtAuthGuard)
  async refundOrder(
    @Param('id') orderId: string,
    @GetUser('id') userId: string,
  ) {
    return this.paymentsService.refundOrder(orderId, userId);
  }

  // ── Razorpay webhook ─────────────────────────────────────────────────
  // Must be raw body to verify HMAC signature
  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    const rawBody = req.rawBody?.toString() || JSON.stringify(req.body);
    return this.paymentsService.handleWebhook(rawBody, signature);
  }
}

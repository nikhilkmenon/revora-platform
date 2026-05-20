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

  // ── Verify Razorpay payment ──────────────────────────────────────────
  @Post('verify-payment')
  @UseGuards(JwtAuthGuard)
  async verifyPayment(
    @Body() body: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; internalOrderId: string }
  ) {
    return this.paymentsService.verifyPayment(
      body.razorpay_order_id,
      body.razorpay_payment_id,
      body.razorpay_signature,
      body.internalOrderId
    );
  }

  // ── Refund order ─────────────────────────────────────────────────────
  @Post(':id/refund')
  @UseGuards(JwtAuthGuard)
  async refundOrder(
    @Param('id') orderId: string,
    @GetUser() user: any,
  ) {
    return this.paymentsService.refundOrder(orderId, user);
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

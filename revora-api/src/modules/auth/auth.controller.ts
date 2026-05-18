import {
  Controller, Post, Body, Req, Res, Get,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import * as crypto from 'crypto';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  // ── Sign up ─────────────────────────────────────────────────────────
  @Post('signup')
  @Throttle({ short: { limit: 3, ttl: 60000 } })
  async signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  // ── Log in ──────────────────────────────────────────────────────────
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const result = await this.authService.login(dto, req.ip, req.headers['user-agent']);

    // Refresh token → httpOnly cookie (SameSite=Strict, path scoped)
    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth/refresh',
    });

    return { accessToken: result.accessToken, user: result.user };
  }

  // ── Refresh ─────────────────────────────────────────────────────────
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const oldToken = req.cookies?.refresh_token;
    const result = await this.authService.refresh(oldToken);

    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth/refresh',
    });

    return { accessToken: result.accessToken };
  }

  // ── Logout ───────────────────────────────────────────────────────────
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @GetUser('id') userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(userId);
    res.clearCookie('refresh_token', { path: '/api/v1/auth/refresh' });
    return { message: 'Logged out' };
  }

  // ── Me ───────────────────────────────────────────────────────────────
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@GetUser() user: any) {
    return user;
  }

  // ── Google OAuth ─────────────────────────────────────────────────────
  @Get('google')
  googleAuth() {
    // Handled by Passport GoogleStrategy — redirect to Google
    return { message: 'Redirect to Google' };
  }

  // BUG #16 FIX: Store token in Redis with a short-lived one-time code,
  // redirect only the code (NOT the token) to prevent token leakage via
  // URL logs, browser history, and Referer headers.
  @Get('google/callback')
  async googleCallback(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.googleLogin(req.user);
    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth/refresh',
    });

    // Store access token in Redis with a 30-second one-time code
    const code = crypto.randomBytes(16).toString('hex');
    await this.redis.setex(`oauth:code:${code}`, 30, result.accessToken);

    // Redirect with only the code — frontend exchanges it immediately
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?code=${code}`);
  }

  // ── Google OAuth code exchange ────────────────────────────────────────
  // Frontend calls POST /auth/google/exchange { code } → { accessToken }
  @Post('google/exchange')
  @HttpCode(HttpStatus.OK)
  async googleExchange(@Body() body: { code: string }) {
    const { code } = body;
    if (!code) return { error: 'Missing code' };
    const accessToken = await this.redis.get(`oauth:code:${code}`);
    if (!accessToken) return { error: 'Invalid or expired code' };
    await this.redis.del(`oauth:code:${code}`); // One-time use
    return { accessToken };
  }
}

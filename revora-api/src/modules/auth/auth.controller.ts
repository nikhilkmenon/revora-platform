import {
  Controller, Post, Body, Req, Res, Get, Put,
  UseGuards, HttpCode, HttpStatus, UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import * as crypto from 'crypto';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';

// Seed secret — must match ADMIN_SEED_SECRET env var
const SEED_SECRET = process.env.ADMIN_SEED_SECRET || 'REVORA_SEED_2026_SECURE';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService
  ) {}

  // ── One-time admin seed ─────────────────────────────────────────────
  @Post('seed-admin')
  @HttpCode(HttpStatus.OK)
  async seedAdmin(
    @Body() body: { secret: string; email: string; password: string; name: string },
  ) {
    if (body.secret !== SEED_SECRET) throw new UnauthorizedException('Invalid seed secret');
    return this.authService.seedAdmin(body.email, body.password, body.name);
  }

  // ── Sign up ─────────────────────────────────────────────────────────
  @Post('signup')
  @Throttle({ short: { limit: 3, ttl: 60000 } })
  async signup(
    @Body() dto: SignupDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.signup(dto);

    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth/refresh',
    });

    return { accessToken: result.accessToken, user: result.user };
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

  // ── Update Role (For new Google users) ──────────────────────────────
  @Put('role')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateRole(@GetUser('id') userId: string, @Body('role') role: string) {
    return this.authService.updateRole(userId, role);
  }

  // ── Me ───────────────────────────────────────────────────────────────
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@GetUser() user: any) {
    return user;
  }

  // ── Google OAuth ─────────────────────────────────────────────────────
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Handled by Passport GoogleStrategy — redirect to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any, @Res() res: Response) {
    const result = await this.authService.googleLogin(req.user);
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?code=${result.code}`);
  }

  // ── Google OAuth code exchange ────────────────────────────────────────
  // Frontend calls POST /auth/google/exchange { code } → { accessToken }
  @Post('google/exchange')
  @HttpCode(HttpStatus.OK)
  async googleExchange(
    @Body() body: { code: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { code } = body;
    if (!code) throw new UnauthorizedException('Missing authentication code');
    
    const result = await this.authService.exchangeGoogleCode(code);
    
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
}

import {
  Injectable, ConflictException, UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { v4 as uuid } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  // ── Sign up ─────────────────────────────────────────────────────────
  async signup(dto: SignupDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already registered');

    // Argon2id — production-grade hashing
    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,
      parallelism: 4,
    });

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: dto.role || 'BUYER',
      },
      select: { id: true, email: true, name: true, role: true },
    });

    // Log activity
    await this.prisma.activityLog.create({
      data: { userId: user.id, action: 'SIGNUP' },
    });

    return { message: 'Account created', user };
  }

  // ── Log in ──────────────────────────────────────────────────────────
  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new ForbiddenException('Account suspended');

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) {
      await this.prisma.activityLog.create({
        data: { userId: user.id, action: 'LOGIN_FAILED', ip },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Store hashed refresh token in DB
    const hashedRefresh = await argon2.hash(tokens.refreshToken);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefresh },
    });

    // Activity log
    await this.prisma.activityLog.create({
      data: { userId: user.id, action: 'LOGIN_SUCCESS', ip, userAgent },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  // ── Refresh token rotation ──────────────────────────────────────────
  async refresh(oldRefreshToken: string) {
    if (!oldRefreshToken) throw new UnauthorizedException('No refresh token');

    let payload: any;
    try {
      payload = this.jwtService.verify(oldRefreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user?.refreshToken) throw new UnauthorizedException('Session expired');

    const valid = await argon2.verify(user.refreshToken, oldRefreshToken);
    if (!valid) {
      // Reuse detected — invalidate all sessions
      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: null },
      });
      throw new UnauthorizedException('Refresh token reuse detected — all sessions terminated');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    const hashedRefresh = await argon2.hash(tokens.refreshToken);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefresh },
    });

    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
  }

  // ── Logout ───────────────────────────────────────────────────────────
  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    await this.prisma.activityLog.create({
      data: { userId, action: 'LOGOUT' },
    });
  }

  // ── Google OAuth login ────────────────────────────────────────────────
  async googleLogin(googleUser: any) {
    let user = await this.prisma.user.findUnique({ where: { email: googleUser.email } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          googleId: googleUser.googleId,
          avatar: googleUser.avatar,
          role: 'BUYER',
        },
      });
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    const hashedRefresh = await argon2.hash(tokens.refreshToken);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefresh },
    });

    return { ...tokens, user };
  }

  // ── Token generation ─────────────────────────────────────────────────
  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get('JWT_ACCESS_EXPIRY') || '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRY') || '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }
}

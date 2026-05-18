import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async findAll({ category, search, page, limit }: any) {
    // BUG #15 FIX: hard-cap pagination to prevent DoS via limit=999999
    const safePage  = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));

    const cacheKey = `products:${JSON.stringify({ category, search, safePage, safeLimit })}`;

    // BUG #12 FIX: Redis cache with 2-minute TTL
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const where: any = { status: 'APPROVED' };
    if (category) where.category = category;
    // TODO: Route through Meilisearch when MEILISEARCH_HOST is configured (BUG #10)
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        include: { designer: { select: { brandName: true } } },
      }),
      this.prisma.product.count({ where }),
    ]);

    const result = { data, total, page: safePage, limit: safeLimit, pages: Math.ceil(total / safeLimit) };
    await this.redis.setex(cacheKey, 120, JSON.stringify(result)); // 2-minute TTL
    return result;
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { designer: { select: { brandName: true, bio: true } } },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(dto: CreateProductDto, userId: string) {
    const designer = await this.prisma.designer.findUnique({ where: { userId } });
    if (!designer) throw new ForbiddenException('Designer profile required');
    if (!designer.isApproved) throw new ForbiddenException('KYC approval required');

    return this.prisma.product.create({
      data: {
        ...dto,
        designerId: designer.id,
        status: 'PENDING_APPROVAL',
        sku: `SKU-${Date.now()}`,
      },
    });
  }

  async approve(id: string, adminId: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');

    await this.prisma.auditLog.create({
      data: { userId: adminId, action: 'PRODUCT_APPROVED', entity: 'Product', entityId: id },
    });

    // BUG #12: Invalidate product cache on approval
    const keys = await this.redis.keys('products:*');
    if (keys.length > 0) await this.redis.del(...keys);

    return this.prisma.product.update({
      where: { id },
      data: { status: 'APPROVED' },
    });
  }
}

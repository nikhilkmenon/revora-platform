import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService
  ) {}

  async findAll({ category, search, page, limit, status }: any) {
    const safePage  = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));

    const where: any = {};
    if (status) {
      where.status = status;
    } else {
      where.status = 'APPROVED';
    }
    if (category) where.category = category;
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

    return { data, total, page: safePage, limit: safeLimit, pages: Math.ceil(total / safeLimit) };
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
    // Find or auto-create a designer profile for this user
    let designer = await this.prisma.designer.findUnique({ where: { userId } });
    if (!designer) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      designer = await this.prisma.designer.create({
        data: {
          userId,
          brandName: user?.name || 'Unnamed Brand',
          bio: '',
          isApproved: false,
        },
      });
    }

    return this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        category: dto.category,
        images: dto.images ?? [],
        stock: dto.stock ?? 0,
        tags: [],
        aiTags: [],
        designerId: designer.id,
        status: 'PENDING_APPROVAL',
        sku: `SKU-${Date.now()}`,
      },
    });
  }

  async update(id: string, dto: Partial<CreateProductDto>, user: any) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) throw new NotFoundException('Product not found');

    if (user.role === 'DESIGNER') {
      const designer = await this.prisma.designer.findUnique({ where: { userId: user.id } });
      if (!designer || product.designerId !== designer.id) {
        throw new ForbiddenException('You can only edit your own products');
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.stock !== undefined && { stock: dto.stock }),
        ...(dto.images !== undefined && { images: dto.images }),
      },
    });
  }

  async approve(id: string, adminId: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');

    try {
      await this.prisma.auditLog.create({
        data: { userId: adminId, action: 'PRODUCT_APPROVED', entity: 'Product', entityId: id },
      });
    } catch (_) {
      // auditLog may not exist in all envs
    }

    return this.prisma.product.update({
      where: { id },
      data: { status: 'APPROVED' },
    });
  }

  async reject(id: string, adminId: string, reason: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');

    return this.prisma.product.update({
      where: { id },
      data: { status: 'REJECTED' },
    });
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    try {
      return await this.prisma.product.delete({ where: { id } });
    } catch (error) {
      // If it's attached to an order, soft-delete it by rejecting
      return await this.prisma.product.update({
        where: { id },
        data: { status: 'REJECTED' }
      });
    }
  }
}

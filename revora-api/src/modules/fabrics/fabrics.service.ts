import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFabricDto } from './dto/create-fabric.dto';

const REVORA_SUPPLIER_ID = process.env.REVORA_SUPPLIER_ID || 'revora-default-supplier';

@Injectable()
export class FabricsService {
  constructor(private prisma: PrismaService) {}

  async findAll(category?: string) {
    const where: any = {
      supplier: { isApproved: true }
    };
    if (category) {
      where.category = category;
    }
    return this.prisma.fabric.findMany({
      where,
      include: { supplier: { select: { companyName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const fabric = await this.prisma.fabric.findUnique({
      where: { id },
      include: { supplier: { select: { companyName: true } } },
    });
    if (!fabric) throw new NotFoundException('Fabric not found');
    return fabric;
  }

  async create(dto: CreateFabricDto, userId: string) {
    // Find or create a supplier profile for this user
    let supplier = await this.prisma.supplier.findUnique({ where: { userId } });

    if (!supplier) {
      // Auto-create a supplier profile for the admin
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      supplier = await this.prisma.supplier.create({
        data: {
          userId,
          companyName: user?.name ? `${user.name} (Revora Admin)` : 'Revora Admin Sourcing',
          isApproved: true,
        },
      });
    }

    return this.prisma.fabric.create({
      data: {
        name: dto.name,
        description: dto.description,
        pricePerYard: dto.pricePerYard,
        moq: dto.moq ?? 1,
        stock: dto.stock,
        images: dto.images ?? [],
        category: dto.category,
        supplierId: supplier.id,
      },
      include: { supplier: { select: { companyName: true } } },
    });
  }

  async remove(id: string) {
    const fabric = await this.prisma.fabric.findUnique({ where: { id } });
    if (!fabric) {
      throw new NotFoundException('Fabric not found');
    }
    return this.prisma.fabric.delete({ where: { id } });
  }
}

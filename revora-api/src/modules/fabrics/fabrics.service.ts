import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FabricsService {
  constructor(private prisma: PrismaService) {}

  async findAll(category?: string) {
    const where = category ? { category } : {};
    return this.prisma.fabric.findMany({
      where,
      include: { supplier: { select: { companyName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}

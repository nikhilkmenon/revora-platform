import { Controller, Get, Post, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Public — browse approved products
  @Get()
  findAll(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
  ) {
    return this.productsService.findAll({ category, search, page: +page, limit: +limit, status });
  }

  // Public — single product
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  // Designer only — create product
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DESIGNER')
  create(
    @Body() dto: CreateProductDto,
    @GetUser('id') userId: string,
  ) {
    return this.productsService.create(dto, userId);
  }

  // Admin only — approve
  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  approve(@Param('id') id: string, @GetUser('id') adminId: string) {
    return this.productsService.approve(id, adminId);
  }

  // Admin only — reject
  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  reject(
    @Param('id') id: string,
    @GetUser('id') adminId: string,
    @Body('reason') reason: string,
  ) {
    return this.productsService.reject(id, adminId, reason);
  }

  // Admin only — delete product
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}

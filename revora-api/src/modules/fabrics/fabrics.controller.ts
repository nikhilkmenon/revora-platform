import { Controller, Get, Query } from '@nestjs/common';
import { FabricsService } from './fabrics.service';

@Controller('fabrics')
export class FabricsController {
  constructor(private readonly fabricsService: FabricsService) {}

  @Get()
  findAll(@Query('category') category?: string) {
    return this.fabricsService.findAll(category);
  }
}

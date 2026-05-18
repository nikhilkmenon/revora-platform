import { Module } from '@nestjs/common';
import { FabricsController } from './fabrics.controller';
import { FabricsService } from './fabrics.service';

@Module({
  controllers: [FabricsController],
  providers: [FabricsService],
})
export class FabricsModule {}

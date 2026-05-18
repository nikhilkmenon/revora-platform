import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { KycService, SubmitKycDto } from './kyc.service';

@Controller('kyc')
@UseGuards(JwtAuthGuard)
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Get('status')
  @Roles('DESIGNER')
  @UseGuards(RolesGuard)
  myStatus(@GetUser('id') userId: string) {
    return this.kycService.getStatus(userId);
  }

  // BUG #21 FIX: Designer can now submit KYC
  @Post('submit')
  @Roles('DESIGNER')
  @UseGuards(RolesGuard)
  submit(@GetUser('id') userId: string, @Body() dto: SubmitKycDto) {
    return this.kycService.submit(userId, dto);
  }

  @Get('queue')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @UseGuards(RolesGuard)
  queue() {
    return this.kycService.getQueue();
  }

  // BUG #21 FIX: Admin can approve KYC
  @Patch(':designerId/approve')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @UseGuards(RolesGuard)
  approve(@Param('designerId') designerId: string, @GetUser('id') adminId: string) {
    return this.kycService.approve(designerId, adminId);
  }

  // BUG #21 FIX: Admin can reject KYC with reason
  @Patch(':designerId/reject')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @UseGuards(RolesGuard)
  reject(
    @Param('designerId') designerId: string,
    @GetUser('id') adminId: string,
    @Body('reason') reason: string,
  ) {
    return this.kycService.reject(designerId, adminId, reason);
  }
}

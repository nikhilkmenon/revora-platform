import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v2 as cloudinary } from 'cloudinary';

// Initialize Cloudinary with secure keys from environment
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export class SubmitKycDto {
  gstDoc?: string;
  panDoc?: string;
  portfolio?: string;
}

@Injectable()
export class KycService {
  constructor(private prisma: PrismaService) {}

  private signDocUrl(url: string | null): string | null {
    if (!url) return null;
    try {
      // Extract Cloudinary public ID if a full URL is passed
      const match = url.match(/\/v\d+\/([^\s]+)\.[a-z0-9]+$/i);
      const publicId = match ? match[1] : url;

      // Generate a signed download URL with 1 hour expiration
      return cloudinary.utils.private_download_url(publicId, 'pdf', {
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour
        attachment: false,
      });
    } catch {
      return url; // fallback to raw url
    }
  }

  async getStatus(userId: string) {
    const designer = await this.prisma.designer.findUnique({
      where: { userId },
      include: { kyc: true },
    });
    if (!designer) throw new NotFoundException('Designer profile not found');
    
    if (designer.kyc) {
      designer.kyc.gstDoc = this.signDocUrl(designer.kyc.gstDoc);
      designer.kyc.panDoc = this.signDocUrl(designer.kyc.panDoc);
    }
    
    return { kycStatus: designer.kycStatus, kyc: designer.kyc };
  }

  async getQueue() {
    const queue = await this.prisma.kycVerification.findMany({
      where: { status: 'SUBMITTED' },
      include: { designer: { include: { user: { select: { name: true, email: true } } } } },
      orderBy: { createdAt: 'asc' },
    });

    return queue.map((kyc) => ({
      ...kyc,
      gstDoc: this.signDocUrl(kyc.gstDoc),
      panDoc: this.signDocUrl(kyc.panDoc),
    }));
  }

  // BUG #21 FIX: Designer submits KYC documents
  async submit(userId: string, dto: SubmitKycDto) {
    const designer = await this.prisma.designer.findUnique({ where: { userId } });
    if (!designer) throw new NotFoundException('Designer profile not found');

    const kyc = await this.prisma.kycVerification.upsert({
      where: { designerId: designer.id },
      create: {
        designerId: designer.id,
        gstDoc: dto.gstDoc,
        panDoc: dto.panDoc,
        portfolio: dto.portfolio,
        status: 'SUBMITTED',
      },
      update: {
        gstDoc: dto.gstDoc,
        panDoc: dto.panDoc,
        portfolio: dto.portfolio,
        status: 'SUBMITTED',
      },
    });

    await this.prisma.designer.update({
      where: { id: designer.id },
      data: { kycStatus: 'SUBMITTED' },
    });

    return kyc;
  }

  // BUG #21 FIX: Admin approves KYC
  async approve(designerId: string, adminId: string) {
    const kyc = await this.prisma.kycVerification.findUnique({ where: { designerId } });
    if (!kyc) throw new NotFoundException('KYC record not found');
    if (kyc.status !== 'SUBMITTED') throw new BadRequestException('KYC is not in SUBMITTED state');

    await this.prisma.$transaction([
      this.prisma.kycVerification.update({
        where: { designerId },
        data: { status: 'APPROVED', reviewedAt: new Date() },
      }),
      this.prisma.designer.update({
        where: { id: designerId },
        data: { kycStatus: 'APPROVED', isApproved: true },
      }),
      this.prisma.auditLog.create({
        data: { userId: adminId, action: 'KYC_APPROVED', entity: 'KycVerification', entityId: kyc.id },
      }),
    ]);

    return { message: 'KYC approved' };
  }

  // BUG #21 FIX: Admin rejects KYC with reason
  async reject(designerId: string, adminId: string, reason: string) {
    const kyc = await this.prisma.kycVerification.findUnique({ where: { designerId } });
    if (!kyc) throw new NotFoundException('KYC record not found');

    await this.prisma.$transaction([
      this.prisma.kycVerification.update({
        where: { designerId },
        data: { status: 'REJECTED', reviewNotes: reason, reviewedAt: new Date() },
      }),
      this.prisma.designer.update({
        where: { id: designerId },
        data: { kycStatus: 'REJECTED', isApproved: false },
      }),
      this.prisma.auditLog.create({
        data: { userId: adminId, action: 'KYC_REJECTED', entity: 'KycVerification', entityId: kyc.id },
      }),
    ]);

    return { message: 'KYC rejected', reason };
  }
}

import { api } from "@/lib/api-client";
import type { KycVerification, SubmitKycDto, KycStatus } from "@/types";

export type { KycVerification, SubmitKycDto };

export interface KycStatusResponse {
  kycStatus: KycStatus;
  kyc: KycVerification | null;
}

export const kycService = {
  async getStatus(): Promise<KycStatusResponse> {
    return api.get<KycStatusResponse>("kyc/status");
  },

  async submit(dto: SubmitKycDto): Promise<KycVerification> {
    return api.post<KycVerification>("kyc/submit", dto);
  },

  async getQueue(): Promise<KycVerification[]> {
    return api.get<KycVerification[]>("kyc/queue");
  },

  async approve(designerId: string): Promise<{ message: string }> {
    return api.patch<{ message: string }>(`kyc/${designerId}/approve`);
  },

  async reject(designerId: string, reason: string): Promise<{ message: string }> {
    return api.patch<{ message: string }>(`kyc/${designerId}/reject`, { reason });
  },
};

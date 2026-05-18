import { api } from "@/lib/api-client";
import type { Fabric } from "@/types";

export type { Fabric };

export interface FabricFilter {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateFabricDto {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image: string;
}

export const fabricsService = {
  async getAll(filters?: FabricFilter): Promise<Fabric[]> {
    return api.get<Fabric[]>("fabrics", { params: filters as any });
  },

  async getOne(id: string): Promise<Fabric> {
    return api.get<Fabric>(`fabrics/${id}`);
  },

  // Admin only
  async create(data: CreateFabricDto): Promise<Fabric> {
    return api.post<Fabric>("fabrics", data);
  },

  async update(id: string, data: Partial<CreateFabricDto>): Promise<Fabric> {
    return api.patch<Fabric>(`fabrics/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return api.delete(`fabrics/${id}`);
  },
};

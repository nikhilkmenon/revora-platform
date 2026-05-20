import { api } from "@/lib/api-client";
import type { Fabric } from "@/types";

export type { Fabric };

const DEFAULT_FABRIC_IMAGE = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=400&q=80";

// Map raw API response (images[]) to frontend shape (image)
function normalizeFabric(f: any): Fabric {
  const price = f.pricePerYard ?? f.price ?? 0;
  return {
    ...f,
    pricePerYard: typeof f.pricePerYard === "string" ? parseFloat(f.pricePerYard) : (f.pricePerYard ?? 0),
    price: typeof price === "string" ? parseFloat(price) : price,
    image: (f.images && f.images.length > 0) ? f.images[0] : DEFAULT_FABRIC_IMAGE,
  };
}

export interface FabricFilter {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateFabricDto {
  name: string;
  description: string;
  pricePerYard: number;
  moq?: number;
  category: string;
  stock: number;
  images?: string[];
}

export const fabricsService = {
  async getAll(filters?: FabricFilter): Promise<Fabric[]> {
    const raw = await api.get<any[]>("fabrics", { params: filters as any });
    return Array.isArray(raw) ? raw.map(normalizeFabric) : [];
  },

  async getOne(id: string): Promise<Fabric> {
    const raw = await api.get<any>(`fabrics/${id}`);
    return normalizeFabric(raw);
  },

  // Admin only
  async create(data: CreateFabricDto): Promise<Fabric> {
    const raw = await api.post<any>("fabrics", data);
    return normalizeFabric(raw);
  },

  async remove(id: string): Promise<void> {
    await api.delete(`fabrics/${id}`);
  },
};

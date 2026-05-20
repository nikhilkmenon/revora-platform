import { api } from "@/lib/api-client";
import type { Product, ProductsResponse, FetchProductsFilter } from "@/types";

export type { Product, ProductsResponse, FetchProductsFilter };

const DEFAULT_PRODUCT_IMAGE = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80";

function normalizeProduct(p: any): Product {
  return {
    ...p,
    price: typeof p.price === "string" ? parseFloat(p.price) : (p.price ?? 0),
    stock: p.stock ?? 0,
    image: (p.images && p.images.length > 0) ? p.images[0] : DEFAULT_PRODUCT_IMAGE,
  };
}

export interface CreateProductPayload {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image?: string; // convenience single image
  images?: string[]; // optional array
}

export const productsService = {
  async getAll(filters: FetchProductsFilter = {}): Promise<ProductsResponse> {
    const raw = await api.get<any>("products", { params: filters as any });
    if (!raw || !raw.data) return { data: [], total: 0, page: 1, limit: 20, pages: 0 };
    return {
      ...raw,
      data: Array.isArray(raw.data) ? raw.data.map(normalizeProduct) : [],
    };
  },

  async getOne(id: string): Promise<Product> {
    const raw = await api.get<any>(`products/${id}`);
    return normalizeProduct(raw);
  },

  async create(data: CreateProductPayload): Promise<Product> {
    const images = data.images ?? (data.image ? [data.image] : []);
    const raw = await api.post<any>("products", {
      name: data.name,
      description: data.description,
      price: data.price,
      category: data.category,
      stock: data.stock,
      images,
    });
    return normalizeProduct(raw);
  },

  async approve(id: string): Promise<Product> {
    const raw = await api.post<any>(`products/${id}/approve`);
    return normalizeProduct(raw);
  },

  async reject(id: string, reason?: string): Promise<Product> {
    const raw = await api.post<any>(`products/${id}/reject`, { reason });
    return normalizeProduct(raw);
  },

  async remove(id: string): Promise<void> {
    await api.delete(`products/${id}`);
  }
};

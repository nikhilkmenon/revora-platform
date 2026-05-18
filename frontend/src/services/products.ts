import { api } from "@/lib/api-client";
import type { Product, ProductsResponse, FetchProductsFilter } from "@/types";

export type { Product, ProductsResponse, FetchProductsFilter };

export const productsService = {
  async getAll(filters: FetchProductsFilter = {}): Promise<ProductsResponse> {
    return api.get<ProductsResponse>("products", { params: filters as any });
  },

  async getOne(id: string): Promise<Product> {
    return api.get<Product>(`products/${id}`);
  },

  async create(data: Omit<Product, "id" | "status" | "sku" | "designerId" | "createdAt">): Promise<Product> {
    return api.post<Product>("products", data);
  },

  async approve(id: string): Promise<Product> {
    return api.post<Product>(`products/${id}/approve`);
  },

  async reject(id: string, reason?: string): Promise<Product> {
    return api.patch<Product>(`products/${id}/reject`, { reason });
  },

  async update(id: string, data: Partial<Pick<Product, "name" | "description" | "price" | "stock" | "category" | "image">>): Promise<Product> {
    return api.patch<Product>(`products/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return api.delete(`products/${id}`);
  },
};

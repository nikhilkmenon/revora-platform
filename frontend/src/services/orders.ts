import { api } from "@/lib/api-client";

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  product?: {
    name: string;
    image: string;
    designer?: {
      brandName: string;
    };
  };
}

export interface Order {
  id: string;
  userId: string;
  razorpayOrderId: string;
  total: number;
  address: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "RETURNED" | "COMPLETED";
  expiresAt: string;
  createdAt: string;
  items?: OrderItem[];
  payment?: {
    id: string;
    amount: number;
    currency: string;
    status: "PENDING" | "CAPTURED" | "FAILED" | "REFUNDED";
  };
}

export interface CreateOrderDto {
  address: string;
  items: {
    productId: string;
    quantity: number;
  }[];
}

export interface RazorpayOrderResponse {
  orderId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  key: string;
}

export const ordersService = {
  async create(dto: CreateOrderDto): Promise<RazorpayOrderResponse> {
    return api.post<RazorpayOrderResponse>("payments/create-order", dto);
  },

  async getAll(): Promise<Order[]> {
    return api.get<Order[]>("orders");
  },

  async getOne(id: string): Promise<Order> {
    return api.get<Order>(`orders/${id}`);
  },

  async cancel(id: string): Promise<void> {
    return api.delete(`orders/${id}`);
  },

  async track(id: string): Promise<any> {
    return api.get<any>(`orders/${id}/track`);
  },

  async refund(orderId: string): Promise<any> {
    return api.post<any>(`payments/${orderId}/refund`);
  },

  async returnOrder(id: string): Promise<any> {
    return api.post<any>(`orders/${id}/return`);
  }
};

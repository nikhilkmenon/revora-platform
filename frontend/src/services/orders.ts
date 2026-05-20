import { api } from "@/lib/api-client";

import type { Order, OrderItem, CreateOrderDto, RazorpayOrderResponse } from "@/types";

export type { Order, OrderItem, CreateOrderDto, RazorpayOrderResponse };

function normalizeOrder(order: any): Order {
  if (!order) return order;
  return {
    ...order,
    total: typeof order.total === "string" ? parseFloat(order.total) : (order.total ?? 0),
    items: Array.isArray(order.items)
      ? order.items.map((item: any) => ({
          ...item,
          price: typeof item.price === "string" ? parseFloat(item.price) : (item.price ?? 0),
        }))
      : [],
    payment: order.payment
      ? {
          ...order.payment,
          amount: typeof order.payment.amount === "string" ? parseFloat(order.payment.amount) : (order.payment.amount ?? 0),
        }
      : undefined,
  };
}

export const ordersService = {
  async create(dto: CreateOrderDto): Promise<any> {
    return api.post<any>("payments/create-order", dto);
  },

  async verifyPayment(data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; internalOrderId: string }): Promise<any> {
    return api.post<any>("payments/verify-payment", data);
  },

  async getAll(): Promise<Order[]> {
    const raw = await api.get<any[]>("orders");
    return Array.isArray(raw) ? raw.map(normalizeOrder) : [];
  },

  async getOne(id: string): Promise<Order> {
    const raw = await api.get<any>(`orders/${id}`);
    return normalizeOrder(raw);
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

// Centralized type definitions for the REVORA platform.
// Import from here, not from individual service files.

export type UserRole = "BUYER" | "DESIGNER" | "ADMIN" | "SUPPLIER";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export type ProductStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image: string;
  status: ProductStatus;
  sku: string;
  designerId: string;
  designer?: { brandName: string };
  createdAt: string;
}

export interface ProductsResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface FetchProductsFilter {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  status?: ProductStatus;
}

export interface Fabric {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image: string;
  supplierId: string;
  supplier?: { companyName: string };
  createdAt: string;
}

export type KycStatus = "NOT_SUBMITTED" | "SUBMITTED" | "APPROVED" | "REJECTED";

export interface KycVerification {
  id: string;
  designerId: string;
  gstDoc?: string;
  panDoc?: string;
  portfolio?: string;
  status: KycStatus;
  reviewNotes?: string;
  reviewedAt?: string;
  createdAt: string;
  designer?: {
    brandName: string;
    user?: { name: string; email: string };
  };
}

export type OrderStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "RETURNED" | "COMPLETED";
export type PaymentStatus = "PENDING" | "CAPTURED" | "FAILED" | "REFUNDED";

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  product?: {
    name: string;
    image: string;
    designer?: { brandName: string };
  };
}

export interface Order {
  id: string;
  userId: string;
  razorpayOrderId: string;
  total: number;
  address: string;
  status: OrderStatus;
  expiresAt: string;
  createdAt: string;
  items?: OrderItem[];
  payment?: {
    id: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
  };
}

export interface CreateOrderDto {
  address: string;
  items: { productId: string; quantity: number }[];
}

export interface RazorpayOrderResponse {
  orderId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  key: string;
}

export interface SubmitKycDto {
  gstDoc?: string;
  panDoc?: string;
  portfolio?: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  designer?: string;
}

export interface AdminStats {
  totalOrders: number;
  totalRevenue: number;
  pendingKycs: number;
  pendingProducts: number;
  totalUsers?: number;
}

import React from "react";
import type { OrderStatus, PaymentStatus, ProductStatus, KycStatus } from "@/types";

type StatusVariant = "success" | "warning" | "error" | "info" | "neutral";

const VARIANT_STYLES: Record<StatusVariant, string> = {
  success: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  error: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
  neutral: "bg-[#e8e0ee] text-[#4a4455]",
};

function getOrderVariant(status: OrderStatus): StatusVariant {
  const map: Record<OrderStatus, StatusVariant> = {
    COMPLETED: "success", CONFIRMED: "info", PENDING: "warning",
    CANCELLED: "error", RETURNED: "neutral",
  };
  return map[status] ?? "neutral";
}

function getPaymentVariant(status: PaymentStatus): StatusVariant {
  const map: Record<PaymentStatus, StatusVariant> = {
    CAPTURED: "success", REFUNDED: "info", PENDING: "warning", FAILED: "error",
  };
  return map[status] ?? "neutral";
}

function getProductVariant(status: ProductStatus): StatusVariant {
  const map: Record<ProductStatus, StatusVariant> = {
    APPROVED: "success", PENDING_APPROVAL: "warning", REJECTED: "error",
  };
  return map[status] ?? "neutral";
}

function getKycVariant(status: KycStatus): StatusVariant {
  const map: Record<KycStatus, StatusVariant> = {
    APPROVED: "success", SUBMITTED: "warning", NOT_SUBMITTED: "neutral", REJECTED: "error",
  };
  return map[status] ?? "neutral";
}

interface StatusBadgeProps {
  type: "order" | "payment" | "product" | "kyc";
  status: string;
}

/**
 * Unified status badge — consistent styling for all status strings across the app.
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, status }) => {
  let variant: StatusVariant = "neutral";
  if (type === "order") variant = getOrderVariant(status as OrderStatus);
  else if (type === "payment") variant = getPaymentVariant(status as PaymentStatus);
  else if (type === "product") variant = getProductVariant(status as ProductStatus);
  else if (type === "kyc") variant = getKycVariant(status as KycStatus);

  const label = status.replace(/_/g, " ");

  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${VARIANT_STYLES[variant]}`}>
      {label}
    </span>
  );
};

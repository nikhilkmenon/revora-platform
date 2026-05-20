"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Navbar, Footer } from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { StatusBadge } from "@/components/StatusBadge";
import { ordersService } from "@/services/orders";
import { useApi } from "@/hooks/useApi";
import type { Order } from "@/types";

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;

  const { data: order, loading, error, execute } = useApi<Order>(ordersService.getOne);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [returnLoading, setReturnLoading] = useState(false);

  useEffect(() => {
    if (orderId) {
      execute(orderId);
    }
  }, [orderId]);

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setCancelLoading(true);
    try {
      await ordersService.cancel(orderId);
      execute(orderId); // Refresh
      alert("Order cancelled successfully.");
    } catch (err: any) {
      alert(`Cancel failed: ${err.message}`);
    } finally {
      setCancelLoading(false);
    }
  };

  const handleReturn = async () => {
    if (!confirm("Are you sure you want to return this order?")) return;
    setReturnLoading(true);
    try {
      await ordersService.returnOrder(orderId);
      execute(orderId); // Refresh
      alert("Return requested successfully.");
    } catch (err: any) {
      alert(`Return failed: ${err.message}`);
    } finally {
      setReturnLoading(false);
    }
  };

  const formatAddress = (address: any): string => {
    if (!address) return "";
    if (typeof address === "string") {
      try {
        const parsed = JSON.parse(address);
        return formatAddress(parsed);
      } catch {
        return address;
      }
    }
    const parts = [];
    if (address.area) parts.push(address.area);
    if (address.district) parts.push(address.district);
    if (address.state) parts.push(address.state);
    if (address.country) parts.push(address.country);
    return parts.join(", ");
  };

  return (
    <ProtectedRoute allowedRoles={["BUYER", "DESIGNER", "ADMIN"]}>
      <Navbar />
      <main className="flex-grow w-full max-w-[1280px] mx-auto px-5 md:px-16 pt-32 pb-20">
        <div className="mb-8">
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#5300b7] uppercase tracking-widest hover:underline mb-4"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to My Orders
          </Link>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-[#1d1a24] mb-2">
                Order details
              </h1>
              <p className="text-sm text-[#4a4455]">
                Order ID: <span className="font-mono font-medium text-[#5300b7]">{orderId}</span>
              </p>
            </div>
            {order && (
              <div className="flex items-center gap-3">
                <StatusBadge type="order" status={order.status} />
                {order.payment && <StatusBadge type="payment" status={order.payment.status} />}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-sm border border-red-200 mb-8">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl border border-[#ccc3d7]/20 p-8 flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-8 h-8 border-4 border-[#5300b7] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-[#7b7486]">Loading order details...</p>
          </div>
        ) : !order ? (
          <div className="bg-white rounded-2xl border border-[#ccc3d7]/20 p-8 text-center">
            <p className="text-sm text-[#7b7486]">Order not found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Col: Order Items & Delivery */}
            <div className="lg:col-span-2 space-y-6">
              {/* Items Card */}
              <div className="bg-white rounded-2xl border border-[#ccc3d7]/20 p-6">
                <h3 className="font-display text-lg font-semibold text-[#1d1a24] mb-4">Items Ordered</h3>
                <div className="divide-y divide-[#ccc3d7]/10">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                      <div className="w-16 h-20 rounded-xl overflow-hidden bg-[#f9f1ff] flex-shrink-0">
                        {item.product?.image ? (
                          <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-[#dfd7e5]" />
                        )}
                      </div>
                      <div className="flex-grow">
                        <p className="text-sm font-semibold text-[#1d1a24]">{item.product?.name ?? "Product"}</p>
                        {item.product?.designer && (
                          <p className="text-[10px] text-[#7b7486] uppercase tracking-wider mb-2">
                            {item.product.designer.brandName}
                          </p>
                        )}
                        <div className="flex justify-between items-center text-xs text-[#4a4455]">
                          <p>Qty: {item.quantity} · Price: ₹{item.price}</p>
                          <p className="font-semibold text-[#1d1a24]">₹{(item.price * item.quantity).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Details Card */}
              <div className="bg-white rounded-2xl border border-[#ccc3d7]/20 p-6">
                <h3 className="font-display text-lg font-semibold text-[#1d1a24] mb-4">Shipping & Delivery</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <p className="text-xs text-[#7b7486] uppercase tracking-wider font-semibold mb-1">Shipping Address</p>
                    <p className="text-[#1d1a24] leading-relaxed">{formatAddress(order.address)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#7b7486] uppercase tracking-wider font-semibold mb-1">Estimated Delivery</p>
                    <p className="text-[#1d1a24]">
                      {typeof order.address === "object" && order.address?.deliveryTime
                        ? order.address.deliveryTime
                        : "5-7 Business Days"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Timeline & Summary */}
            <div className="space-y-6">
              {/* Order Summary Card */}
              <div className="bg-white rounded-2xl border border-[#ccc3d7]/20 p-6">
                <h3 className="font-display text-lg font-semibold text-[#1d1a24] mb-4">Summary</h3>
                <div className="space-y-3 text-sm border-b border-[#ccc3d7]/10 pb-4 mb-4">
                  <div className="flex justify-between text-[#4a4455]">
                    <span>Subtotal</span>
                    <span>₹{order.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[#4a4455]">
                    <span>Shipping</span>
                    <span className="text-[#00875a] font-semibold">Free</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-base font-bold text-[#1d1a24] mb-6">
                  <span>Total</span>
                  <span className="text-[#5300b7]">₹{order.total.toLocaleString()}</span>
                </div>

                <div className="space-y-3">
                  {order.status === "PENDING" && (
                    <button
                      onClick={handleCancel}
                      disabled={cancelLoading}
                      className="w-full py-3 border border-red-200 text-red-600 font-semibold rounded-full hover:bg-red-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {cancelLoading ? "Cancelling..." : "Cancel Order"}
                    </button>
                  )}
                  {order.status === "DELIVERED" && (
                    <button
                      onClick={handleReturn}
                      disabled={returnLoading}
                      className="w-full py-3 bg-red-600 text-white font-semibold rounded-full hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {returnLoading ? "Requesting..." : "Request Return"}
                    </button>
                  )}
                </div>
              </div>

              {/* Order Tracking / Timeline Card */}
              <div className="bg-white rounded-2xl border border-[#ccc3d7]/20 p-6">
                <h3 className="font-display text-lg font-semibold text-[#1d1a24] mb-4">Tracking Timeline</h3>
                {order.tracking && order.tracking.length > 0 ? (
                  <div className="relative border-l-2 border-[#5300b7]/20 ml-2.5 pl-5 space-y-6">
                    {order.tracking.map((track: any) => (
                      <div key={track.id} className="relative">
                        {/* Dot */}
                        <div className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-[#5300b7] border-2 border-white"></div>
                        <div>
                          <p className="text-xs text-[#7b7486] font-semibold mb-0.5">
                            {new Date(track.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <p className="text-sm font-semibold text-[#1d1a24] mb-0.5">{track.status}</p>
                          <p className="text-xs text-[#4a4455]">{track.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#7b7486]">No tracking details available yet.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </ProtectedRoute>
  );
}

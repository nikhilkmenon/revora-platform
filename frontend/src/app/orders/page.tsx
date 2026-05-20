"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import { Navbar, Footer } from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { OrderSkeleton } from "@/components/LoadingSkeleton";
import { useApi } from "@/hooks/useApi";
import { ordersService } from "@/services/orders";
import type { Order } from "@/types";
import { useRouter } from "next/navigation";

export default function OrdersPage() {
  const { data: orders, loading, error, execute } = useApi<Order[]>(ordersService.getAll);
  const router = useRouter();

  useEffect(() => { execute(); }, []);

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    try {
      await ordersService.cancel(id);
      execute(); // Refresh
    } catch (err: any) {
      alert(`Cancel failed: ${err.message}`);
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

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
          <div>
            <span className="text-xs font-semibold text-[#5300b7] uppercase tracking-widest block mb-2">Account</span>
            <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-[#1d1a24]">My Orders</h1>
          </div>
          <Link href="/shop" className="px-5 py-2.5 bg-[#5300b7] text-white rounded-full text-sm font-semibold hover:scale-105 transition-all">
            Continue Shopping
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-sm border border-red-200 mb-8">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => <OrderSkeleton key={i} />)}
          </div>
        ) : !orders || orders.length === 0 ? (
          <EmptyState
            icon="shopping_bag"
            title="No orders yet"
            description="Your order history will appear here once you make a purchase."
            action={{ label: "Browse Collections", onClick: () => router.push("/shop") }}
          />
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-2xl border border-[#ccc3d7]/20 p-6 hover:shadow-md transition-shadow">
                {/* Order Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 pb-5 border-b border-[#ccc3d7]/10">
                  <div>
                    <p className="font-display text-sm font-semibold text-[#1d1a24] mb-1">
                      Order #{order.id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-xs text-[#4a4455]">
                      Placed {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge type="order" status={order.status} />
                    {order.payment && <StatusBadge type="payment" status={order.payment.status} />}
                    <span className="font-display text-lg font-semibold text-[#1d1a24]">
                      ₹{order.total.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                {order.items && order.items.length > 0 && (
                  <div className="flex flex-wrap gap-4 mb-5">
                    {order.items.map(item => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="w-14 h-16 rounded-xl overflow-hidden bg-[#f9f1ff] flex-shrink-0">
                          {item.product?.image ? (
                            <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-[#dfd7e5]" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#1d1a24] line-clamp-1">{item.product?.name ?? "Product"}</p>
                          <p className="text-xs text-[#4a4455]">Qty: {item.quantity} · ₹{item.price}</p>
                          {item.product?.designer && (
                            <p className="text-[10px] text-[#7b7486] uppercase tracking-wider">{item.product.designer.brandName}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pt-4 border-t border-[#ccc3d7]/10">
                  <div className="text-xs text-[#4a4455]">
                    <span className="font-semibold">Ship to:</span> {formatAddress(order.address)}
                  </div>
                  <div className="flex gap-3">
                    {order.status === "PENDING" && (
                      <button
                        onClick={() => handleCancel(order.id)}
                        className="px-4 py-2 border border-red-300 text-red-600 text-xs font-semibold rounded-full hover:bg-red-50 transition-all"
                      >
                        Cancel Order
                      </button>
                    )}
                    <Link
                      href={`/orders/${order.id}`}
                      className="px-4 py-2 bg-[#5300b7]/10 text-[#5300b7] text-xs font-semibold rounded-full hover:bg-[#5300b7]/20 transition-all"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </ProtectedRoute>
  );
}

"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthContext";
import { Navbar, Footer } from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Link from "next/link";

export default function DashboardRouter() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "ADMIN") {
        router.push("/admin");
      } else if (user.role === "DESIGNER") {
        router.push("/designer");
      }
    }
  }, [user, loading, router]);

  if (loading || (user && (user.role === "ADMIN" || user.role === "DESIGNER"))) {
    return (
      <div className="min-h-screen bg-[#fef7ff] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#5300b7] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-display text-sm tracking-widest text-[#5300b7] animate-pulse uppercase">Configuring Workspace…</p>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["BUYER", "SUPPLIER"]}>
      <Navbar />
      <main className="flex-grow w-full max-w-[1280px] mx-auto px-5 md:px-16 pt-32 pb-20 min-h-screen">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 border-b border-[#ccc3d7]/20 pb-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-[#e8e0ee] flex items-center justify-center text-3xl font-display text-[#5300b7]">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <h1 className="font-display text-3xl font-semibold text-[#1d1a24] mb-1">Welcome back, {user?.name?.split(' ')[0] || "User"}</h1>
              <p className="text-sm text-[#4a4455]">{user?.email}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/shop" className="px-6 py-3 bg-[#5300b7] text-white rounded-full text-sm font-semibold hover:scale-105 transition-all shadow-md">
              Explore Collections
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/orders" className="bg-white p-6 rounded-2xl border border-[#ccc3d7]/20 hover:-translate-y-1 hover:shadow-lg transition-all group flex flex-col justify-between min-h-[160px]">
            <div>
              <span className="material-symbols-outlined text-[#5300b7] text-3xl mb-4 group-hover:scale-110 transition-transform">shopping_bag</span>
              <h3 className="font-display text-xl font-medium text-[#1d1a24]">My Orders</h3>
              <p className="text-sm text-[#4a4455] mt-1">Track your recent purchases and returns.</p>
            </div>
            <span className="text-xs font-semibold text-[#5300b7] uppercase tracking-wider mt-4">View History →</span>
          </Link>

          <Link href="/shop" className="bg-white p-6 rounded-2xl border border-[#ccc3d7]/20 hover:-translate-y-1 hover:shadow-lg transition-all group flex flex-col justify-between min-h-[160px]">
            <div>
              <span className="material-symbols-outlined text-[#0051d5] text-3xl mb-4 group-hover:scale-110 transition-transform">favorite</span>
              <h3 className="font-display text-xl font-medium text-[#1d1a24]">Wishlist</h3>
              <p className="text-sm text-[#4a4455] mt-1">View items you've saved for later.</p>
            </div>
            <span className="text-xs font-semibold text-[#0051d5] uppercase tracking-wider mt-4">Browse Saved →</span>
          </Link>

          <div className="bg-white p-6 rounded-2xl border border-[#ccc3d7]/20 hover:-translate-y-1 hover:shadow-lg transition-all group flex flex-col justify-between min-h-[160px] cursor-pointer">
            <div>
              <span className="material-symbols-outlined text-[#1d1a24] text-3xl mb-4 group-hover:scale-110 transition-transform">manage_accounts</span>
              <h3 className="font-display text-xl font-medium text-[#1d1a24]">Account Settings</h3>
              <p className="text-sm text-[#4a4455] mt-1">Update your password, address, and billing.</p>
            </div>
            <span className="text-xs font-semibold text-[#1d1a24] uppercase tracking-wider mt-4">Edit Profile →</span>
          </div>
        </div>
      </main>
      <Footer />
    </ProtectedRoute>
  );
}

"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { useRouter } from "next/navigation";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<"BUYER" | "DESIGNER" | "ADMIN" | "SUPPLIER">;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading, isAuthenticated, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (allowedRoles && !hasRole(allowedRoles)) {
        // Redirect unauthorized users to their correct workspace
        if (user?.role === "ADMIN") {
          router.push("/admin");
        } else if (user?.role === "DESIGNER") {
          router.push("/designer");
        } else {
          router.push("/shop");
        }
      }
    }
  }, [loading, isAuthenticated, allowedRoles, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-display text-headline-sm text-primary uppercase tracking-widest animate-pulse">
          REVORA Secure Load
        </p>
      </div>
    );
  }

  if (!isAuthenticated || (allowedRoles && !hasRole(allowedRoles))) {
    return null; // Prevents flashing content before redirect completes
  }

  return <>{children}</>;
};

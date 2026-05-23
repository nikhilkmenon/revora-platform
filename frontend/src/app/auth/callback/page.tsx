"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/AuthContext";
import { authService } from "@/services/auth";
import { env } from "@/lib/env";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const [loadingRole, setLoadingRole] = useState(false);
  const [tempData, setTempData] = useState<any>(null);
  const [error, setError] = useState("");
  const exchangeStarted = React.useRef(false);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setError("No authentication code provided.");
      return;
    }

    const exchangeCode = async () => {
      try {
        const response = await fetch(`${env.apiUrl}/auth/google/exchange`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        
        const data = await response.json();
        
        if (!response.ok || data.error) {
          throw new Error(data.error || "Failed to exchange code.");
        }

        // If the user was created in the last 60 seconds, it's a new signup
        const isNewUser = data.user?.createdAt && (Date.now() - new Date(data.user.createdAt).getTime()) < 60000;
        
        if (isNewUser) {
          authService.persistSession(data); // Save temporary session so API calls work
          setTempData(data);
          setShowRoleSelect(true);
        } else {
          authService.persistSession(data);
          window.location.href = "/dashboard";
        }
      } catch (err: any) {
        setError(err.message || "An error occurred during authentication.");
      }
    };

    if (!showRoleSelect && !exchangeStarted.current) {
      exchangeStarted.current = true;
      exchangeCode();
    }
  }, [searchParams, router]);

  const handleRoleSelect = async (role: "BUYER" | "DESIGNER") => {
    setLoadingRole(true);
    try {
      const response = await fetch(`${env.apiUrl}/auth/role`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${tempData.accessToken}`
        },
        body: JSON.stringify({ role }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error("Failed to set role");
      authService.persistSession(data);
      window.location.href = "/dashboard";
    } catch (err) {
      setError("Failed to save your role. Please try again or contact support.");
    } finally {
      setLoadingRole(false);
    }
  };

  if (showRoleSelect) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fef7ff] text-[#1d1a24] p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-[#ccc3d7] shadow-xl text-center">
          <h2 className="text-2xl font-display font-bold text-[#5300b7] mb-2">Welcome to REVORA!</h2>
          <p className="text-sm text-[#4a4455] mb-8">To give you the best experience, please tell us how you plan to use REVORA.</p>
          
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => handleRoleSelect("BUYER")}
              disabled={loadingRole}
              className="w-full h-16 border-2 border-[#ccc3d7] rounded-2xl flex items-center px-6 hover:border-[#5300b7] hover:bg-[#f9f1ff] transition-all text-left group disabled:opacity-50"
            >
              <div className="flex-1">
                <p className="font-bold text-[#1d1a24] group-hover:text-[#5300b7]">I'm a Buyer</p>
                <p className="text-xs text-[#7b7486]">I want to shop for luxury textiles & fashion</p>
              </div>
              <span className="material-symbols-outlined text-[#7b7486] group-hover:text-[#5300b7]">arrow_forward</span>
            </button>

            <button 
              onClick={() => handleRoleSelect("DESIGNER")}
              disabled={loadingRole}
              className="w-full h-16 border-2 border-[#ccc3d7] rounded-2xl flex items-center px-6 hover:border-[#5300b7] hover:bg-[#f9f1ff] transition-all text-left group disabled:opacity-50"
            >
              <div className="flex-1">
                <p className="font-bold text-[#1d1a24] group-hover:text-[#5300b7]">I'm a Designer</p>
                <p className="text-xs text-[#7b7486]">I want to source fabrics & sell my creations</p>
              </div>
              <span className="material-symbols-outlined text-[#7b7486] group-hover:text-[#5300b7]">arrow_forward</span>
            </button>
          </div>
          
          {loadingRole && <p className="text-xs text-[#5300b7] mt-6 animate-pulse">Setting up your workspace...</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fef7ff] text-[#1d1a24]">
      {error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
          <h2 className="font-bold mb-2">Authentication Failed</h2>
          <p>{error}</p>
          <button onClick={() => router.push("/login")} className="mt-4 text-[#5300b7] hover:underline">Return to Login</button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-[#5300b7] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-[#4a4455] uppercase tracking-wider">Authenticating with Google...</p>
        </div>
      )}
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#fef7ff] text-[#1d1a24]">
        <div className="w-8 h-8 border-4 border-[#5300b7] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}

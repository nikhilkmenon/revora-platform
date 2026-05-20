"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/AuthContext";
import { authService } from "@/services/auth";
import { env } from "@/lib/env";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

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

        localStorage.setItem("revora_token", data.accessToken);
        window.location.href = "/dashboard";
      } catch (err: any) {
        setError(err.message || "An error occurred during authentication.");
      }
    };

    exchangeCode();
  }, [searchParams, router]);

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

import { Suspense } from "react";

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

"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/features/auth/AuthContext";
import { env } from "@/lib/env";

type Role = "BUYER" | "DESIGNER" | "SUPPLIER";

export default function AuthPage() {
  const { login, signup } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("BUYER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters long.");
      }
      if (isSignUp) await signup({ name, email, password, role });
      else await login({ email, password });
    } catch (err: any) { setError(err.message || "Authentication failed."); }
    finally { setLoading(false); }
  };

  const ROLES: Role[] = ["BUYER", "DESIGNER", "SUPPLIER"];

  return (
    <div className="bg-[#fef7ff] text-[#1d1a24] min-h-screen flex items-center justify-center relative overflow-hidden antialiased py-12">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img
          alt="Luxury background"
          className="w-full h-full object-cover opacity-40"
          src="/luxury-bg.jpg"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#fef7ff]/85 to-[#dfd7e5]/60" />
      </div>

      <div className="relative z-10 w-full max-w-[480px] px-5 md:px-0">
        {/* Glass Panel */}
        <div className="glass-card rounded-2xl p-8 md:p-10 flex flex-col gap-6">
          {/* Brand Header */}
          <div className="text-center">
            <Link href="/" className="font-display text-5xl font-bold tracking-tighter text-[#5300b7] uppercase block mb-2">REVORA</Link>
            <p className="text-sm text-[#4a4455]">Enter the luxury digital ecosystem.</p>
          </div>

          {/* Sign In / Sign Up Toggle */}
          <div className="flex p-1 bg-[#e8e0ee] rounded-full w-full">
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setError(""); }}
              className={`flex-1 py-2 px-4 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${!isSignUp ? "bg-[#5300b7] text-white" : "text-[#4a4455] hover:text-[#5300b7]"}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(true); setError(""); }}
              className={`flex-1 py-2 px-4 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${isSignUp ? "bg-[#5300b7] text-white" : "text-[#4a4455] hover:text-[#5300b7]"}`}
            >
              Create Account
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm border border-red-200">{error}</div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
            {isSignUp && (
              <>
                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#1d1a24] uppercase tracking-wider" htmlFor="name">Full Name</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#7b7486]">person</span>
                    <input id="name" required type="text" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} className="input-revora w-full h-12 pl-12 pr-4 rounded-2xl text-sm text-[#1d1a24] placeholder:text-[#ccc3d7]" />
                  </div>
                </div>

                {/* Role */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#1d1a24] uppercase tracking-wider">Account Type</label>
                  <div className="flex p-1 bg-[#e8e0ee] rounded-full w-full">
                    {ROLES.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`flex-1 py-2 px-4 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${role === r ? "bg-[#5300b7] text-white" : "text-[#4a4455] hover:text-[#5300b7]"}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#1d1a24] uppercase tracking-wider" htmlFor="email">Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#7b7486]">mail</span>
                <input id="email" required type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="input-revora w-full h-12 pl-12 pr-4 rounded-2xl text-sm text-[#1d1a24] placeholder:text-[#ccc3d7]" />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-[#1d1a24] uppercase tracking-wider" htmlFor="password">Password</label>
                {!isSignUp && <a href="#" className="text-xs font-semibold text-[#0051d5] hover:text-[#5300b7] transition-colors">Forgot?</a>}
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#7b7486]">lock</span>
                <input id="password" required type={showPw ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="input-revora w-full h-12 pl-12 pr-12 rounded-2xl text-sm text-[#1d1a24] placeholder:text-[#ccc3d7]" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7b7486] hover:text-[#5300b7] transition-colors">
                  <span className="material-symbols-outlined text-sm">{showPw ? "visibility" : "visibility_off"}</span>
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 mt-1 bg-[#5300b7] text-white rounded-full font-semibold text-sm uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_8px_20px_rgba(83,0,183,0.15)] flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isSignUp ? "Create Account" : "Access Workspace"}
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="h-px bg-[#ccc3d7] flex-1" />
            <span className="text-xs font-semibold text-[#7b7486] uppercase tracking-wider">or continue with</span>
            <div className="h-px bg-[#ccc3d7] flex-1" />
          </div>

          {/* Social */}
          <div className="flex gap-4">
            <button type="button" onClick={() => window.location.href = `${env.apiUrl}/auth/google`} className="flex-1 h-12 flex items-center justify-center border border-[#ccc3d7] rounded-2xl hover:border-[#5300b7] hover:bg-[#f9f1ff] transition-all bg-white">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            </button>
            <button type="button" disabled className="flex-1 h-12 flex items-center justify-center border border-[#ccc3d7] rounded-2xl hover:border-[#5300b7] hover:bg-[#f9f1ff] transition-all bg-gray-100 opacity-50 cursor-not-allowed">
              <svg className="w-5 h-5 text-[#1d1a24]" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/></svg>
            </button>
          </div>

          {/* Footer Link */}
          <p className="text-center text-sm text-[#4a4455]">
            {isSignUp ? "Already have an account?" : "New to REVORA?"}{" "}
            <button type="button" onClick={() => { setIsSignUp(!isSignUp); setError(""); }} className="text-[#5300b7] font-semibold hover:underline underline-offset-4">{isSignUp ? "Sign in" : "Create an account"}</button>
          </p>
        </div>

        {/* Trust Indicators */}
        <div className="flex justify-center items-center gap-8 mt-8 opacity-60">
          <span className="text-[10px] text-[#1d1a24] uppercase tracking-widest flex items-center gap-1 font-semibold">
            <span className="material-symbols-outlined text-xs">verified_user</span> Secure
          </span>
          <span className="text-[10px] text-[#1d1a24] uppercase tracking-widest flex items-center gap-1 font-semibold">
            <span className="material-symbols-outlined text-xs">diamond</span> Premium
          </span>
          <span className="text-[10px] text-[#1d1a24] uppercase tracking-widest flex items-center gap-1 font-semibold">
            <span className="material-symbols-outlined text-xs">speed</span> Fast
          </span>
        </div>
      </div>
    </div>
  );
}

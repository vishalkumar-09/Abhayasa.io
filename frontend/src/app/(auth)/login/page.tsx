"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Mail, Lock, ArrowRight, Loader2, AlertCircle } from "lucide-react";

function LoginForm() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Parse redirect URL or check for special messages
  const redirect = searchParams.get("redirect") || "/dashboard";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.email.trim() || !formData.password) {
      setError("Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    try {
      await login(formData);
    } catch (err: any) {
      console.error("Login failed:", err);
      const backendMessage = err.response?.data?.message || err.response?.data || "Invalid email or password.";
      setError(backendMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center md:text-left">
        <h2 className="text-2xl font-semibold tracking-tight text-white">Sign In</h2>
        <p className="text-sm text-zinc-400 mt-1">Welcome back. Enter your credentials to access your simulator.</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Email Address */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs font-medium text-zinc-300">
            Email Address
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500 pointer-events-none">
              <Mail className="h-4 w-4" />
            </span>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950/50 border border-zinc-800 text-white placeholder-zinc-500 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
            />
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <label htmlFor="password" className="text-xs font-medium text-zinc-300">
              Password
            </label>
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500 pointer-events-none">
              <Lock className="h-4 w-4" />
            </span>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950/50 border border-zinc-800 text-white placeholder-zinc-500 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-violet-600/25"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing In...
            </>
          ) : (
            <>
              Sign In
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <div className="text-center text-sm text-zinc-400">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-violet-400 hover:text-violet-300 hover:underline font-medium transition-colors">
          Register
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-10">
        <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
        <p className="text-sm text-zinc-400 mt-2">Loading authentication form...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

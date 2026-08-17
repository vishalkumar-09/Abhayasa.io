"use client";

import React, { useState, Suspense } from "react";
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
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-50">Welcome back to Abhayasa</h2>
        <p className="text-sm text-slate-400 mt-2">Sign in to continue your interview preparation.</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            Email Address
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
              <Mail className="h-4 w-4" />
            </span>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="name@example.com"
              className="if-input !pl-10"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <label htmlFor="password" className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Password
            </label>
            <button type="button" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
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
              className="if-input !pl-10"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="if-btn-primary mt-2 w-full flex items-center justify-center gap-2"
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

      <div className="text-center text-sm text-slate-400">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
          Sign up
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-10">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

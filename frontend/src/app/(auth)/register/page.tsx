"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { User, Mail, Lock, ArrowRight, Loader2, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: "USER", // Default candidate role
      });
    } catch (err: any) {
      console.error("Registration failed:", err);
      const backendMessage = err.response?.data?.message || err.response?.data || "Registration failed. Email may already be in use.";
      setError(backendMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center md:text-left">
        <h2 className="text-2xl font-semibold tracking-tight text-white">Create an Account</h2>
        <p className="text-sm text-zinc-400 mt-1">Get started on your AI-powered interview preparation journey.</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Full Name */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-xs font-medium text-zinc-300">
            Full Name
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500 pointer-events-none">
              <User className="h-4 w-4" />
            </span>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950/50 border border-zinc-800 text-white placeholder-zinc-500 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
            />
          </div>
        </div>

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
          <label htmlFor="password" className="text-xs font-medium text-zinc-300">
            Password
          </label>
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

        {/* Confirm Password */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirmPassword" className="text-xs font-medium text-zinc-300">
            Confirm Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500 pointer-events-none">
              <Lock className="h-4 w-4" />
            </span>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950/50 border border-zinc-800 text-white placeholder-zinc-500 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
            />
          </div>
        </div>

        {/* Register Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-violet-600/25"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating Account...
            </>
          ) : (
            <>
              Register
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <div className="text-center text-sm text-zinc-400">
        Already have an account?{" "}
        <Link href="/login" className="text-violet-400 hover:text-violet-300 hover:underline font-medium transition-colors">
          Sign In
        </Link>
      </div>
    </div>
  );
}

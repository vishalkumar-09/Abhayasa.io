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

    setIsLoading(true);
    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: "USER",
      });
    } catch (err: any) {
      console.error("Registration failed:", err);
      const backendMessage = err.response?.data?.message || err.response?.data || "Registration failed. Email may already be in use.";
      setError(backendMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Password strength visual only
  const getPasswordStrength = (pass: string) => {
    if (pass.length === 0) return { score: 0, text: "", color: "" };
    if (pass.length < 6) return { score: 1, text: "Weak", color: "bg-red-500" };
    if (pass.length < 10) return { score: 2, text: "Good", color: "bg-amber-500" };
    return { score: 3, text: "Strong", color: "bg-emerald-500" };
  };
  
  const strength = getPasswordStrength(formData.password);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-50">Create your account</h2>
        <p className="text-sm text-slate-400 mt-2">Start preparing for your next technical interview.</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            Full Name
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
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
              className="if-input !pl-10"
            />
          </div>
        </div>

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
          <label htmlFor="password" className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            Password
          </label>
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
          
          {/* Password strength indicator */}
          {formData.password.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 flex gap-1 h-1.5">
                <div className={`h-full flex-1 rounded-full ${strength.score >= 1 ? strength.color : 'bg-slate-800'}`} />
                <div className={`h-full flex-1 rounded-full ${strength.score >= 2 ? strength.color : 'bg-slate-800'}`} />
                <div className={`h-full flex-1 rounded-full ${strength.score >= 3 ? strength.color : 'bg-slate-800'}`} />
              </div>
              <span className="text-xs text-slate-500 w-10 text-right">{strength.text}</span>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="if-btn-primary mt-2 w-full flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating Account...
            </>
          ) : (
            <>
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <div className="text-center text-sm text-slate-400">
        Already have an account?{" "}
        <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
          Sign In
        </Link>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center bg-[#09090b] overflow-hidden px-4">
      {/* Decorative ambient background glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-fuchsia-900/20 blur-[120px] pointer-events-none" />
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370a_1px,transparent_1px),linear-gradient(to_bottom,#1f29370a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* App Logo / Header */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-2.5 rounded-xl bg-violet-600/10 border border-violet-500/20 group-hover:border-violet-500/40 transition-all">
              <ShieldCheck className="h-6 w-6 text-violet-400 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              InterviewForge
            </span>
          </Link>
          <p className="text-sm text-zinc-400 mt-2">Forging Elite Technical Candidates</p>
        </div>

        {/* Auth Card Content */}
        <div className="glass-card rounded-2xl p-8 gradient-border">
          {children}
        </div>
      </div>
    </div>
  );
}

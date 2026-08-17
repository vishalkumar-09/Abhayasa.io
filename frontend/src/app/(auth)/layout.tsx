"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Target, MessageSquare, BarChart } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { AbhayasaLogo } from "@/components/AbhayasaLogo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-[#0a0f1e] text-slate-50 transition-colors duration-300">
      {/* Top Header Theme Toggle for mobile */}
      <div className="absolute top-6 right-6 z-20 md:hidden">
        <ThemeToggle />
      </div>

      {/* Left Panel - Branding (Hidden on mobile) */}
      <div className="hidden md:flex md:w-[40%] bg-[#0d1525] border-r border-slate-800 flex-col justify-between p-12 relative overflow-hidden">
        {/* Subtle background element */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[20%] w-[70%] h-[70%] rounded-full bg-indigo-500/5 blur-[120px]" />
        </div>

        <div className="relative z-10">
          <Link href="/" className="flex items-center mb-16">
            <AbhayasaLogo width={160} />
          </Link>

          <h1 className="text-3xl font-bold tracking-tight text-slate-50 mb-4">
            Prepare smarter.<br />Perform with confidence.
          </h1>
          <p className="text-slate-400 mb-12 max-w-md leading-relaxed">
            AI interview preparation tailored to your resume and target role. Get instant feedback, competency analysis, and actionable recommendations.
          </p>

          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-[#111827] border border-slate-800 text-indigo-400 mt-1 shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-200">Personalized Questions</h3>
                <p className="text-sm text-slate-400 mt-1">Questions generated from your unique resume and target role.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-[#111827] border border-slate-800 text-indigo-400 mt-1 shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-200">Adaptive Follow-ups</h3>
                <p className="text-sm text-slate-400 mt-1">AI probes deeper based on each of your answers.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-[#111827] border border-slate-800 text-indigo-400 mt-1 shrink-0">
                <BarChart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-200">Detailed Performance Report</h3>
                <p className="text-sm text-slate-400 mt-1">Scored on technical depth, communication, and accuracy.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-600 mt-12">
          &copy; {new Date().getFullYear()} Abhayasa. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full md:w-[60%] flex flex-col justify-center items-center p-6 sm:p-12 relative bg-[var(--background)]">
        <div className="hidden md:block absolute top-6 right-6 z-20">
          <ThemeToggle />
        </div>

        {/* Mobile Logo */}
        <div className="md:hidden flex flex-col items-center mb-8">
          <Link href="/">
            <AbhayasaLogo width={140} />
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md if-card p-8 shadow-xl"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}

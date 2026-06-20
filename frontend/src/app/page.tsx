"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Play,
  ArrowRight,
  Sparkles,
  Cpu,
  BookOpen,
  LineChart,
  UserCheck,
  CheckCircle
} from "lucide-react";

export default function LandingPage() {
  const features = [
    {
      title: "RAG-Based Question Generation",
      description: "Uses a Vector Database to match your resume skills against target job description requirements, generating highly customized interview questions.",
      icon: Cpu,
    },
    {
      title: "45-Question Simulator",
      description: "Covers all bases with exactly 20 Resume questions, 20 Tech questions, 3 DSA questions, and 2 HR/Behavioral questions tailored specifically to you.",
      icon: BookOpen,
    },
    {
      title: "Answer Evaluation Engine",
      description: "Gemini AI grades your submissions on Technical Accuracy, Communication, Depth, and Completeness from 0-10 with direct critical feedback.",
      icon: UserCheck,
    },
    {
      title: "Improvement Roadmap",
      description: "Get detailed strengths & weaknesses summaries alongside a missing concepts checklist and tailored resource roadmaps to plug your skills gaps.",
      icon: LineChart,
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#09090b] text-white overflow-hidden flex flex-col font-sans">
      {/* Decorative ambient gradients */}
      <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-violet-900/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-fuchsia-900/10 blur-[130px] pointer-events-none" />
      
      {/* Subtle grid layer */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293706_1px,transparent_1px),linear-gradient(to_bottom,#1f293706_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="w-full h-16 max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between border-b border-zinc-900/60 shrink-0 z-10">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="p-2 rounded-xl bg-violet-600/10 border border-violet-500/20 group-hover:border-violet-500/40 transition-all">
            <ShieldCheck className="h-5 w-5 text-violet-400 group-hover:scale-105 transition-transform" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            InterviewForge
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-medium text-sm transition-all shadow-md shadow-violet-600/10"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center max-w-5xl mx-auto px-6 md:px-12 py-16 md:py-24 z-10">
        <div className="text-center flex flex-col items-center gap-6 max-w-3xl">
          {/* AI pill badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-950/40 border border-violet-800/40 text-violet-400">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Mock Simulation Platform
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
            Forge your path to <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">elite technical roles</span>
          </h1>

          <p className="text-zinc-400 text-base md:text-lg max-w-2xl leading-relaxed">
            Upload your resume, configure your target job, and let our Gemini-powered simulator build personalized interview tracks. Get rated on technical accuracy, communication depth, and conceptual gaps.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 mt-6">
            <Link
              href="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-semibold text-sm transition-all shadow-lg shadow-violet-600/20"
            >
              Start Preparing Free
              <Play className="h-4 w-4 fill-current" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white font-semibold text-sm hover:bg-zinc-850 transition-colors"
            >
              Sign In to Account
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-20 md:mt-28">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="glass-card rounded-2xl p-6 border border-zinc-800/80 hover:border-zinc-700/60 transition-all flex gap-4"
              >
                <div className="p-3 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400 shrink-0 h-fit">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-white">{feature.title}</h3>
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-900/60 py-8 text-center text-xs text-zinc-500 shrink-0 z-10">
        <p>&copy; {new Date().getFullYear()} InterviewForge. All rights reserved.</p>
      </footer>
    </div>
  );
}

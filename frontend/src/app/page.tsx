"use client";

import React from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { AbhayasaLogo } from "@/components/AbhayasaLogo";
import {
  FileText,
  MessageSquare,
  BarChart,
  CheckCircle,
  FileSearch,
  Bot,
  LineChart
} from "lucide-react";

export default function LandingPage() {
  const features = [
    {
      title: "Resume-Personalized Questions",
      description: "AI reads your resume and generates questions specific to your experience.",
      icon: FileSearch,
    },
    {
      title: "Adaptive Follow-ups",
      description: "Follow-up questions probe deeper based on your answers.",
      icon: MessageSquare,
    },
    {
      title: "Answer Evaluation",
      description: "Instant scoring on Technical Accuracy, Communication, Depth, Completeness.",
      icon: CheckCircle,
    },
    {
      title: "Detailed Reports",
      description: "Competency breakdown, strengths, improvement areas, next steps.",
      icon: BarChart,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-50 font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="border-b border-slate-800/60 bg-[#0a0f1e]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <AbhayasaLogo width={148} />
          </Link>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/login"
              className="text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors hidden sm:block"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="if-btn-primary"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="pt-24 pb-16 md:pt-32 md:pb-24 px-6 max-w-7xl mx-auto text-center">
          
          
          <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-8">
            AI-Powered Interview Preparation
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-50 leading-[1.1] max-w-4xl mx-auto mb-6">
            Prepare smarter.<br className="hidden md:block" /> Get hired.
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Abhayasa conducts adaptive AI mock interviews tailored to your resume and target role — then delivers a detailed performance report to close your gaps.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto if-btn-primary px-8 py-3 text-base shadow-lg shadow-indigo-600/20"
            >
              Start Preparing Free
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto if-btn-secondary px-8 py-3 text-base"
            >
              Sign In
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-[#0d1525] border-y border-slate-800/60">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-50 mb-4">Everything you need to prepare</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                No fluff, just the tools to improve your technical communication and knowledge gaps.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {features.map((feature, idx) => (
                <div key={idx} className="if-card p-8 hover:border-indigo-500/30 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-6">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-100 mb-2">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works Section */}
        <section className="py-24 max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-50 mb-4">How it works</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Three simple steps to build your interview confidence.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-slate-800 z-0" />
            
            {[
              {
                step: 1,
                title: "Upload Resume + Add Job Description",
                desc: "Upload your resume and the job description you are targeting.",
                icon: FileText
              },
              {
                step: 2,
                title: "AI Conducts Interview",
                desc: "Answer dynamic technical and behavioral questions generated just for you.",
                icon: Bot
              },
              {
                step: 3,
                title: "Review Performance Report",
                desc: "Read your detailed evaluation report and discover areas for improvement.",
                icon: LineChart
              }
            ].map((step, idx) => (
              <div key={idx} className="relative z-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#111827] border border-slate-700 flex items-center justify-center text-indigo-400 mb-6 shadow-lg">
                  <step.icon className="w-8 h-8" />
                </div>
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">
                  Step {step.step}
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#0a0f1e] py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between text-sm text-slate-500">
          <div className="flex items-center gap-2 mb-4 sm:mb-0">
            <AbhayasaLogo width={100} />
          </div>
          <p>&copy; {new Date().getFullYear()} Abhayasa. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

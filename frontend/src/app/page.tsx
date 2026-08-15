"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  ShieldCheck,
  Play,
  ArrowRight,
  Sparkles,
  Target,
  Mic,
  Zap,
  Rocket,
} from "lucide-react";

export default function LandingPage() {
  const features = [
    {
      title: "Personalized Interview Practice",
      description: "Customized to your exact resume and target job. Practice answering real-world questions crafted specifically for your experience level.",
      icon: Target,
    },
    {
      title: "Interactive Voice Agent",
      description: "Speak your answers naturally to a realistic AI interviewer. Handle real-time follow-up questions and master interview communication.",
      icon: Mic,
    },
    {
      title: "Instant Scoring & Feedback",
      description: "Get instant evaluation after every answer. Discover your communication clarity score, answer depth rating, and exact tips to stand out.",
      icon: Zap,
    },
    {
      title: "Targeted Placement Roadmap",
      description: "Spot your skill gaps before real recruiters do. Unlock custom learning roadmaps and study checklists to land your dream offer faster.",
      icon: Rocket,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)] overflow-hidden flex flex-col font-sans transition-colors duration-300">
      {/* Dynamic ambient floating gradients */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.15, 0.3, 0.15],
        }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/20 blur-[130px] pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.15, 0.35, 0.15],
        }}
        transition={{ duration: 12, repeat: Infinity }}
        className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-fuchsia-600/20 blur-[130px] pointer-events-none"
      />

      {/* Subtle background grid layer */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8b5cf608_1px,transparent_1px),linear-gradient(to_bottom,#8b5cf608_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="w-full h-16 max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between border-b border-[var(--border)] shrink-0 z-10">
        <Link href="/" className="flex items-center gap-2 group">
          <motion.div
            whileHover={{ rotate: 12, scale: 1.1 }}
            className="p-2 rounded-xl bg-violet-600/10 border border-violet-500/20 group-hover:border-violet-500/40 transition-all"
          >
            <ShieldCheck className="h-5 w-5 text-violet-400" />
          </motion.div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            InterviewForge
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link
            href="/login"
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/register"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-medium text-sm transition-all shadow-md shadow-violet-600/20"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center max-w-5xl mx-auto px-6 md:px-12 py-16 md:py-24 z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center flex flex-col items-center gap-6 max-w-3xl"
        >
          <motion.h1
            variants={itemVariants}
            className="text-4xl md:text-6xl font-extrabold tracking-tight text-[var(--foreground)] leading-[1.15]"
          >
            Forge your path to{" "}
            <span className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 bg-clip-text text-transparent">
              elite technical roles
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-[var(--muted-foreground)] font-medium text-base md:text-lg max-w-2xl leading-relaxed"
          >
            Upload your resume, configure your target job, and let our simulator build personalized interview tracks. Get rated on technical accuracy, communication depth, and conceptual gaps.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center gap-4 mt-4"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
              <Link
                href="/register"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all shadow-lg shadow-violet-600/30"
              >
                Start Preparing Free
                <Play className="h-4 w-4 fill-current" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
              <Link
                href="/login"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] font-semibold text-sm hover:bg-zinc-800/10 transition-colors shadow-sm"
              >
                Sign In to Account
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Feature Grid with Motion Stagger & Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-20 md:mt-28"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -6, scale: 1.02 }}
                className="glass-card rounded-2xl p-6 border border-[var(--border)] transition-all flex gap-4 cursor-default shadow-md"
              >
                <div className="p-3 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400 shrink-0 h-fit">
                  <Icon className="h-5.5 w-5.5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm text-[var(--foreground)]">{feature.title}</h3>
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[var(--border)] py-8 text-center text-xs text-zinc-500 shrink-0 z-10">
        <p>&copy; {new Date().getFullYear()} InterviewForge. All rights reserved.</p>
      </footer>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Brain, FileText, CheckCircle2, BarChart3, Loader2, ArrowRight } from "lucide-react";

interface ReportGeneratingLoaderProps {
  errorMsg?: string | null;
  onRetry?: () => void;
}

const GENERATION_STEPS = [
  {
    title: "Synthesizing Interview Transcript",
    description: "Compiling answered questions, audio transcriptions, and code submissions.",
    icon: FileText,
  },
  {
    title: "Evaluating Competencies & Technical Depth",
    description: "Analyzing accuracy, architectural decisions, and communication clarity.",
    icon: Brain,
  },
  {
    title: "Calculating Readiness & Role Alignment",
    description: "Comparing demonstrated candidate capabilities against target job criteria.",
    icon: BarChart3,
  },
  {
    title: "Formulating Personalized Growth Roadmap",
    description: "Generating actionable study plans, skill gaps, and interview recommendations.",
    icon: Sparkles,
  },
];

const PREP_TIPS = [
  "💡 Tip: Top candidates consistently review their competency breakdowns to target weak topics.",
  "⚡ Fun Fact: System design and architectural trade-offs carry the highest weighting in senior engineering evaluations.",
  "🚀 Almost ready: Your comprehensive performance summary is being prepared.",
];

export const ReportGeneratingLoader: React.FC<ReportGeneratingLoaderProps> = ({ errorMsg, onRetry }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setActiveStep((prev) => (prev < GENERATION_STEPS.length - 1 ? prev + 1 : prev));
    }, 2800);

    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % PREP_TIPS.length);
    }, 4500);

    return () => {
      clearInterval(stepInterval);
      clearInterval(tipInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle Background Radial Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-xl w-full relative z-10 flex flex-col items-center text-center">
        {/* Animated Central Pulse Badge */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-violet-600 to-indigo-500 p-0.5 shadow-2xl shadow-violet-500/20">
            <div className="w-full h-full bg-zinc-900/90 rounded-[22px] flex items-center justify-center">
              <Brain className="h-9 w-9 text-violet-400 animate-pulse" />
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 bg-violet-500 rounded-full p-1.5 shadow-lg border-2 border-zinc-950">
            <Loader2 className="h-4 w-4 text-white animate-spin" />
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
          Generating Interview Performance Report
        </h1>
        <p className="text-sm text-zinc-400 max-w-md mb-8">
          Our AI evaluation engine is analyzing your responses across technical depth, problem-solving, and role readiness.
        </p>

        {/* Step Progression Card */}
        <div className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl text-left space-y-4 mb-6 backdrop-blur-sm">
          {GENERATION_STEPS.map((step, idx) => {
            const StepIcon = step.icon;
            const isCompleted = idx < activeStep;
            const isCurrent = idx === activeStep;

            return (
              <div
                key={step.title}
                className={`flex items-start gap-4 p-3 rounded-xl transition-all duration-300 ${
                  isCurrent
                    ? "bg-violet-950/30 border border-violet-800/40"
                    : isCompleted
                    ? "opacity-80"
                    : "opacity-40"
                }`}
              >
                <div
                  className={`mt-0.5 p-2 rounded-lg shrink-0 ${
                    isCompleted
                      ? "bg-emerald-500/20 text-emerald-400"
                      : isCurrent
                      ? "bg-violet-600/20 text-violet-400"
                      : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : isCurrent ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <StepIcon className="h-4 w-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-semibold ${
                        isCurrent ? "text-violet-300" : isCompleted ? "text-zinc-200" : "text-zinc-400"
                      }`}
                    >
                      {step.title}
                    </span>
                    {isCompleted && (
                      <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        Complete
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-[11px] font-medium text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full animate-pulse">
                        In Progress
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Error Handling State */}
        {errorMsg && (
          <div className="w-full bg-red-950/40 border border-red-800/60 rounded-xl p-4 mb-6 text-left">
            <p className="text-xs font-semibold text-red-400 mb-2">{errorMsg}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-1.5 text-xs font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span>Retry Generation</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Dynamic Tip Box */}
        <div className="px-4 py-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800/60 text-xs text-zinc-400 transition-opacity duration-300">
          {PREP_TIPS[tipIndex]}
        </div>
      </div>
    </div>
  );
};

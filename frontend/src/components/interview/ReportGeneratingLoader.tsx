"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Brain, FileText, CheckCircle2, BarChart3, Loader2, ArrowRight } from "lucide-react";

interface ReportGeneratingLoaderProps {
  errorMsg?: string | null;
  onRetry?: () => void;
}

const GENERATION_STEPS = [
  {
    title: "Analyzing Responses",
    description: "Processing your answers, code, and transcriptions.",
    icon: FileText,
  },
  {
    title: "Evaluating Competencies",
    description: "Scoring technical depth and communication clarity.",
    icon: Brain,
  },
  {
    title: "Calculating Readiness",
    description: "Benchmarking against the target role requirements.",
    icon: BarChart3,
  },
  {
    title: "Generating Feedback",
    description: "Creating your personalized growth roadmap.",
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
    <div className="flex h-screen w-full flex-col items-center justify-center bg-[#0a0f1e] p-6 text-slate-100">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-50">Generating Report</h1>
          <p className="mt-2 text-sm text-slate-400">
            Our AI evaluation engine is analyzing your performance.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#111827] p-6 shadow-xl">
          <div className="space-y-6">
            {GENERATION_STEPS.map((step, idx) => {
              const StepIcon = step.icon;
              const isCompleted = idx < activeStep;
              const isCurrent = idx === activeStep;

              return (
                <div
                  key={step.title}
                  className={`flex items-start gap-4 transition-all duration-300 ${
                    isCurrent ? "opacity-100" : isCompleted ? "opacity-75" : "opacity-30"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      isCompleted
                        ? "bg-emerald-500/10 text-emerald-400"
                        : isCurrent
                        ? "bg-indigo-500/10 text-indigo-400"
                        : "bg-slate-800 text-slate-500"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : isCurrent ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <StepIcon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className={`text-sm font-semibold ${isCurrent ? "text-indigo-100" : isCompleted ? "text-slate-200" : "text-slate-400"}`}>
                      {step.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-sm text-red-400">{errorMsg}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-3 flex items-center gap-2 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-500/30 transition-colors"
              >
                Retry Generation <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        <div className="text-center">
          <p className="text-xs text-slate-500 italic transition-opacity duration-500">
            {PREP_TIPS[tipIndex]}
          </p>
        </div>
      </div>
    </div>
  );
};

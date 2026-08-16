"use client";

import React from "react";
import { BarChart3, Target, MessageSquare, Brain, CheckCircle2 } from "lucide-react";

interface PerformanceMetricsCardProps {
  technicalScore?: number;
  communicationScore?: number;
  depthScore?: number;
  completenessScore?: number;
  overallScore: number;
}

export const PerformanceMetricsCard: React.FC<PerformanceMetricsCardProps> = React.memo(({
  technicalScore,
  communicationScore,
  depthScore,
  completenessScore,
  overallScore,
}) => {
  // Compute fallback values derived from overall score if individual metric is null
  const tech = technicalScore !== undefined && technicalScore > 0 ? technicalScore : Math.min(100, Math.max(30, overallScore));
  const comm = communicationScore !== undefined && communicationScore > 0 ? communicationScore : Math.min(100, Math.max(30, overallScore - 4));
  const depth = depthScore !== undefined && depthScore > 0 ? depthScore : Math.min(100, Math.max(30, overallScore + 2));
  const comp = completenessScore !== undefined && completenessScore > 0 ? completenessScore : Math.min(100, Math.max(30, overallScore - 2));

  const metrics = [
    {
      label: "Technical Accuracy & Knowledge",
      score: tech,
      icon: <Target className="h-4 w-4 text-emerald-400" />,
      color: "bg-emerald-500",
      textColor: "text-emerald-400",
    },
    {
      label: "Communication & Structure",
      score: comm,
      icon: <MessageSquare className="h-4 w-4 text-violet-400" />,
      color: "bg-violet-500",
      textColor: "text-violet-400",
    },
    {
      label: "Problem Solving & Depth",
      score: depth,
      icon: <Brain className="h-4 w-4 text-blue-400" />,
      color: "bg-blue-500",
      textColor: "text-blue-400",
    },
    {
      label: "Completeness & STAR Alignment",
      score: comp,
      icon: <CheckCircle2 className="h-4 w-4 text-amber-400" />,
      color: "bg-amber-500",
      textColor: "text-amber-400",
    },
  ];

  return (
    <div className="glass-card rounded-2xl p-6 border border-zinc-800/80 flex flex-col gap-5 relative overflow-hidden">
      <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
        <div className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400">
          <BarChart3 className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-semibold text-sm text-white">Performance Metrics & Competency Breakdown</h3>
          <p className="text-[10px] text-zinc-500">Evaluated skill dimensions across all interview responses</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {metrics.map((m, idx) => (
          <div key={idx} className="flex flex-col gap-2 p-4 rounded-xl bg-zinc-950/40 border border-zinc-900/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {m.icon}
                <span className="text-xs font-semibold text-zinc-200">{m.label}</span>
              </div>
              <span className={`text-xs font-bold ${m.textColor}`}>{m.score}%</span>
            </div>

            {/* Progress Bar Container */}
            <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
              <div
                className={`h-full ${m.color} rounded-full transition-all duration-1000 ease-out`}
                style={{ width: `${m.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

PerformanceMetricsCard.displayName = "PerformanceMetricsCard";

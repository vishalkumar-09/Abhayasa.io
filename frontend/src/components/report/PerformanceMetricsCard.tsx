"use client";

import React from "react";

interface PerformanceMetricsCardProps {
  overallScore: number;
  readiness?: string;
  competencyBreakdown?: { name: string; score: number }[];
}

export const PerformanceMetricsCard: React.FC<PerformanceMetricsCardProps> = React.memo(({
  overallScore,
  readiness,
  competencyBreakdown = []
}) => {
  // Compute default breakdown items if missing
  const defaultBreakdown = [
    { name: "Technical Knowledge", score: 82, icon: "⚡" },
    { name: "Problem Solving", score: 76, icon: "🧩" },
    { name: "Communication", score: 74, icon: "💬" },
    { name: "System Design", score: 80, icon: "🏛️" },
    { name: "Coding", score: 72, icon: "💻" }
  ];

  const breakdownList = competencyBreakdown.length > 0
    ? competencyBreakdown.slice(0, 5).map((c, i) => ({
        name: c.name,
        score: c.score,
        icon: defaultBreakdown[i % defaultBreakdown.length].icon
      }))
    : defaultBreakdown;

  // SVG Ring Circle Math for Overall Score
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const scoreOffset = circumference - (overallScore / 100) * circumference;

  // Percentile Rank Math (e.g. score - 6 or default 72)
  const percentile = Math.min(99, Math.max(10, Math.round(overallScore * 0.92)));
  const percentileOffset = circumference - (percentile / 100) * circumference;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
      {/* Card 1: Overall Score */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-between text-center gap-3 shadow-sm">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide self-start">Overall Score</h3>
        
        <div className="relative flex items-center justify-center my-1">
          <svg className="w-32 h-32 -rotate-90">
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke="currentColor"
              strokeWidth="7"
              fill="transparent"
              className="text-slate-800/80"
            />
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke="currentColor"
              strokeWidth="7"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={scoreOffset}
              strokeLinecap="round"
              className="text-emerald-400 transition-all duration-700" 
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-slate-100">
              {overallScore}
            </span>
            <span className="text-[11px] font-medium text-slate-400">/100</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-bold text-emerald-400">Good Performance</span>
          <span className="text-[11px] text-slate-400">Keep practicing to reach the next level!</span>
        </div>
      </div>

      {/* Card 2: Score Breakdown */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-3 shadow-sm">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Score Breakdown</h3>
        
        <div className="flex flex-col gap-2.5 my-auto">
          {breakdownList.map((item, idx) => {
            const barColor = item.score >= 80 ? "bg-emerald-500" : item.score >= 70 ? "bg-amber-500" : "bg-red-500";
            return (
              <div key={idx} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium flex items-center gap-1.5 truncate">
                    <span className="text-xs">{item.icon}</span>
                    <span className="truncate">{item.name}</span>
                  </span>
                  <span className="text-slate-400 font-semibold shrink-0">{item.score}<span className="text-slate-500 font-normal">/100</span></span>
                </div>
                <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                  <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${item.score}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

PerformanceMetricsCard.displayName = "PerformanceMetricsCard";

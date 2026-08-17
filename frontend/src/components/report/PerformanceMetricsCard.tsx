"use client";

import React from "react";

interface PerformanceMetricsCardProps {
  overallScore: number;
  readiness?: string;
}

export const PerformanceMetricsCard: React.FC<PerformanceMetricsCardProps> = React.memo(({
  overallScore,
  readiness
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400 stroke-emerald-500";
    if (score >= 60) return "text-amber-400 stroke-amber-500";
    return "text-red-400 stroke-red-500";
  };
  
  const getReadinessConfig = (r?: string) => {
    if (r === 'INTERVIEW_READY') return { label: 'Interview Ready', bg: 'bg-emerald-500/10', text: 'text-emerald-400' };
    if (r === 'NEEDS_IMPROVEMENT') return { label: 'Needs Improvement', bg: 'bg-amber-500/10', text: 'text-amber-400' };
    if (r === 'NOT_READY') return { label: 'Not Ready', bg: 'bg-red-500/10', text: 'text-red-400' };
    return { label: 'Pending', bg: 'bg-slate-800', text: 'text-slate-400' };
  };

  const rdConfig = getReadinessConfig(readiness);
  const strokeColor = getScoreColor(overallScore).split(' ')[1].replace('stroke-', ''); // rough extraction or we can just use class

  // Circumference for strokeDasharray
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (overallScore / 100) * circumference;

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 h-full flex flex-col items-center justify-center gap-6">
      <h3 className="text-sm font-semibold text-slate-200">Overall Score</h3>
      
      <div className="relative flex items-center justify-center">
        <svg className="w-32 h-32 -rotate-90">
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-slate-800"
          />
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={getScoreColor(overallScore).split(' ')[0]} 
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold ${getScoreColor(overallScore).split(' ')[0]}`}>
            {overallScore}
          </span>
          <span className="text-xs text-slate-500">/ 100</span>
        </div>
      </div>

      <div className={`mt-2 px-3 py-1.5 rounded-full text-xs font-semibold ${rdConfig.bg} ${rdConfig.text}`}>
        {rdConfig.label}
      </div>
    </div>
  );
});

PerformanceMetricsCard.displayName = "PerformanceMetricsCard";

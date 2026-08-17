"use client";

import React from "react";

interface ReportSummaryCardProps {
  summary?: string;
  roleTitle?: string;
  categoryName?: string;
  createdAt?: string;
  readinessScore?: number;
}

export const ReportSummaryCard: React.FC<ReportSummaryCardProps> = React.memo(({
  summary,
  roleTitle,
  categoryName,
  createdAt,
  readinessScore = 0
}) => {
  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 h-full flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-slate-200">Performance Summary</h3>
      
      <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap flex-1">
        {summary || "No summary available for this evaluation."}
      </p>
      
      <div className="border-t border-slate-800 pt-4 mt-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Readiness Score</span>
            <span className="text-xs font-semibold text-slate-300">{readinessScore}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${readinessScore >= 80 ? 'bg-emerald-500' : readinessScore >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${readinessScore}%` }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
});

ReportSummaryCard.displayName = "ReportSummaryCard";

"use client";

import React from "react";
import { Sparkles, BookOpen } from "lucide-react";

interface ReportSummaryCardProps {
  summary?: string;
}

export const ReportSummaryCard: React.FC<ReportSummaryCardProps> = React.memo(({ summary }) => {
  if (!summary) return null;

  return (
    <div className="glass-card rounded-2xl p-6 border border-zinc-800/80 flex flex-col gap-3 relative overflow-hidden">
      <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
        <div className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400">
          <Sparkles className="h-4 w-4" />
        </div>
        <h3 className="font-semibold text-sm text-white">Executive Performance Summary</h3>
      </div>
      <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
        {summary}
      </p>
    </div>
  );
});

ReportSummaryCard.displayName = "ReportSummaryCard";

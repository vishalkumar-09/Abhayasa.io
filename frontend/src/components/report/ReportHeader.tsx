"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, Calendar, Award, Layers } from "lucide-react";

interface ReportHeaderProps {
  roleTitle?: string;
  categoryName?: string;
  overallScore: number;
  createdAt?: string;
  onDelete: () => void;
}

export const ReportHeader: React.FC<ReportHeaderProps> = React.memo(({
  roleTitle,
  categoryName,
  overallScore,
  createdAt,
  onDelete,
}) => {
  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
    if (score >= 60) return "bg-amber-500/10 border-amber-500/30 text-amber-400";
    return "bg-red-500/10 border-red-500/30 text-red-400";
  };

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Recent Evaluation";

  return (
    <div className="flex flex-col gap-6">
      {/* Top Nav Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-all bg-zinc-900/60 border border-zinc-800/60 px-3.5 py-2 rounded-xl"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>

        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold transition-all"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete Evaluation</span>
        </button>
      </div>

      {/* Main Banner Card */}
      <div className="glass-card rounded-3xl p-8 border border-zinc-800/80 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-[-50%] left-[-20%] w-[300px] h-[300px] bg-violet-600/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="flex flex-col gap-3 z-10">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-bold text-violet-400 flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5" />
              Evaluation Report
            </span>
            <span className="text-xs text-zinc-500 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formattedDate}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            {roleTitle || "Technical Interview Evaluation"}
          </h1>

          <p className="text-xs text-zinc-400 flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-zinc-500" />
            <span>Category: {categoryName || "Software Engineering"}</span>
          </p>
        </div>

        {/* Score Card */}
        <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 shrink-0 min-w-[140px] z-10">
          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Overall Score</span>
          <div className="flex items-baseline gap-1 my-1">
            <span className="text-4xl font-extrabold text-white tracking-tight">{overallScore}</span>
            <span className="text-sm font-semibold text-zinc-500">/ 100</span>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getScoreBadgeColor(overallScore)}`}>
            {overallScore >= 80 ? "STRONG PASS" : overallScore >= 60 ? "COMPETENT" : "NEEDS PRACTICE"}
          </span>
        </div>
      </div>
    </div>
  );
});

ReportHeader.displayName = "ReportHeader";

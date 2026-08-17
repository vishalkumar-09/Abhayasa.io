"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface ReportHeaderProps {
  roleTitle?: string;
  categoryName?: string;
  createdAt?: string;
  companyName?: string;
  durationMinutes?: number;
}

export const ReportHeader: React.FC<ReportHeaderProps> = React.memo(({
  roleTitle = "Software Mock Interview",
  categoryName = "Technical",
  createdAt,
  companyName = "Target Role",
  durationMinutes = 30
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const formattedTime = createdAt
    ? new Date(createdAt).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-col gap-4 pb-2">
      <div>
        <Link
          href="/interviews"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Reports</span>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-100">
            Interview Report
          </h1>
          <p className="text-sm font-medium text-slate-300">
            {companyName} – {roleTitle} <span className="text-slate-400">({categoryName})</span>
          </p>
          <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
            <span>📅 {formattedDate}</span>
            <span>•</span>
            <span>🕒 {formattedTime}</span>
            <span>•</span>
            <span>⏱️ {durationMinutes || 30} Minutes</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap no-print">
          <button 
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3.5 py-2 rounded-xl transition-all shadow-sm active:scale-95"
          >
            <span>📥 Download PDF</span>
          </button>
          <button 
            onClick={handleShare}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3.5 py-2 rounded-xl transition-all shadow-sm active:scale-95 relative"
          >
            <span>{copied ? "✓ Copied Link!" : "🔗 Share Report"}</span>
          </button>
          <Link
            href="/interview"
            className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/20 active:scale-95"
          >
            <span>🎯 Practice Weak Areas</span>
          </Link>
        </div>
      </div>
    </div>
  );
});

ReportHeader.displayName = "ReportHeader";

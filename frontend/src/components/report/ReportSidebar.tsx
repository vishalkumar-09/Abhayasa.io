"use client";

import React from "react";
import Link from "next/link";
import { Briefcase, Building, ShieldCheck, User, Clock, BarChart3, Calendar, ChevronRight, CheckCircle2 } from "lucide-react";

interface ReportSidebarProps {
  roleTitle?: string;
  companyName?: string;
  categoryName?: string;
  difficulty?: string;
  createdAt?: string;
  durationMinutes?: number;
  readiness?: string;
  summary?: string;
  focusAreas?: string[];
}

export const ReportSidebar: React.FC<ReportSidebarProps> = React.memo(({
  roleTitle = "Software Mock Interview",
  companyName = "Target Role",
  categoryName = "Technical",
  difficulty = "MID",
  createdAt,
  durationMinutes = 30,
  readiness = "INTERVIEW_READY",
  summary,
  focusAreas = ["Data Structures", "Algorithms", "System Design", "Problem Solving", "Coding"]
}) => {
  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }) + ", " + new Date(createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const displayFocusAreas = focusAreas && focusAreas.length > 0 ? focusAreas.slice(0, 6) : ["Data Structures", "Algorithms", "System Design"];

  const verdictBadge = readiness === "INTERVIEW_READY"
    ? { label: "Recommended", color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" }
    : readiness === "NEEDS_IMPROVEMENT"
    ? { label: "Needs Practice", color: "bg-amber-500/10 border-amber-500/20 text-amber-400" }
    : { label: "Needs Prep", color: "bg-red-500/10 border-red-500/20 text-red-400" };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* 1. Interview Summary Card */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Interview Summary</h3>

        <div className="flex flex-col gap-3 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400 flex items-center gap-2 font-medium">
              <Briefcase className="h-3.5 w-3.5 text-indigo-400" />
              Role
            </span>
            <span className="text-slate-200 font-semibold">{roleTitle}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400 flex items-center gap-2 font-medium">
              <Building className="h-3.5 w-3.5 text-indigo-400" />
              Company
            </span>
            <span className="text-slate-200 font-semibold">{companyName}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400 flex items-center gap-2 font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
              Interview Type
            </span>
            <span className="text-slate-200 font-semibold">{categoryName}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400 flex items-center gap-2 font-medium">
              <User className="h-3.5 w-3.5 text-indigo-400" />
              Experience Level
            </span>
            <span className="text-slate-200 font-semibold">Standard Level</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400 flex items-center gap-2 font-medium">
              <Clock className="h-3.5 w-3.5 text-indigo-400" />
              Duration
            </span>
            <span className="text-slate-200 font-semibold">{durationMinutes || 30} Minutes</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400 flex items-center gap-2 font-medium">
              <BarChart3 className="h-3.5 w-3.5 text-indigo-400" />
              Difficulty
            </span>
            <span className="text-slate-200 font-semibold">{difficulty}</span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-slate-400 flex items-center gap-2 font-medium">
              <Calendar className="h-3.5 w-3.5 text-indigo-400" />
              Date
            </span>
            <span className="text-slate-200 font-semibold text-[11px]">{formattedDate}</span>
          </div>
        </div>
      </div>

      {/* 2. Focus Areas Card */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Focus Areas</h3>
        <div className="flex flex-wrap gap-2">
          {displayFocusAreas.map((area, idx) => (
            <span key={idx} className="bg-indigo-950/40 border border-indigo-800/40 text-indigo-300 text-[11px] font-semibold px-3 py-1 rounded-full">
              {area}
            </span>
          ))}
        </div>
      </div>

      {/* 3. Verdict Card */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Verdict</h3>
          <span className={`border text-[11px] font-bold px-2.5 py-0.5 rounded-full ${verdictBadge.color}`}>
            {verdictBadge.label}
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          {summary || "Performance evaluation indicates a good foundation. Continue reviewing weak concepts to maximize success in technical rounds."}
        </p>
      </div>
    </div>
  );
});

ReportSidebar.displayName = "ReportSidebar";

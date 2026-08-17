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
}

export const ReportSidebar: React.FC<ReportSidebarProps> = React.memo(({
  roleTitle = "Software Engineer",
  companyName = "Google",
  categoryName = "Technical Interview",
  difficulty = "Medium",
  createdAt
}) => {
  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }) + ", " + new Date(createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : "15 May 2025, 10:30 AM";

  const focusAreas = ["Data Structures", "Algorithms", "System Design", "Problem Solving", "Coding"];

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
            <span className="text-slate-200 font-semibold">Early (1–3 Yrs)</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-400 flex items-center gap-2 font-medium">
              <Clock className="h-3.5 w-3.5 text-indigo-400" />
              Duration
            </span>
            <span className="text-slate-200 font-semibold">45 Minutes</span>
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
          {focusAreas.map((area, idx) => (
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
          <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
            Recommended
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          You have a good grasp of the fundamentals and solved problems effectively. With more practice on system design and communication, you can excel in the upcoming interviews.
        </p>
      </div>

      {/* 4. Next Steps Card */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Next Steps</h3>
        <div className="flex flex-col gap-2 text-xs font-medium">
          <button 
            onClick={() => {
              const el = document.getElementById("questions-tab");
              if (el) el.click();
            }}
            className="flex items-center justify-between p-2.5 rounded-xl text-slate-300 hover:bg-slate-800/80 transition-colors text-left"
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
              Review your answers
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
          </button>

          <Link
            href="/interview"
            className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-300 font-semibold hover:bg-indigo-600/20 transition-colors"
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />
              Practice weak areas
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-indigo-400" />
          </Link>

          <Link
            href="/interview"
            className="flex items-center justify-between p-2.5 rounded-xl text-slate-300 hover:bg-slate-800/80 transition-colors"
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
              Take another mock interview
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
          </Link>
        </div>
      </div>
    </div>
  );
});

ReportSidebar.displayName = "ReportSidebar";

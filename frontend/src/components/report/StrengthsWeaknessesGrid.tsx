"use client";

import React from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";

interface StrengthsWeaknessesGridProps {
  strengths: string[];
  weaknesses: string[];
}

export const StrengthsWeaknessesGrid: React.FC<StrengthsWeaknessesGridProps> = React.memo(({
  strengths = [],
  weaknesses = [],
}) => {
  const defaultStrengths = [
    "Good understanding of data structures and algorithms",
    "Solved coding problems with optimal approach",
    "Explained solutions clearly and logically",
    "Strong hold on system design fundamentals"
  ];

  const defaultWeaknesses = [
    "Take more time to analyze requirements",
    "Communication can be more structured",
    "Edge case handling in coding can improve",
    "Deep dive more into scalability in system design"
  ];

  const listStrengths = strengths.length > 0 ? strengths : defaultStrengths;
  const listWeaknesses = weaknesses.length > 0 ? weaknesses : defaultWeaknesses;

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-slate-200">Strengths & Improvement Areas</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Strengths Container (Soft Emerald Tint) */}
        <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-2xl p-5 flex flex-col gap-4">
          <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-2">
            <span>Strengths</span>
          </h4>
          <div className="flex flex-col gap-2.5">
            {listStrengths.map((str, idx) => (
              <div key={idx} className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200 leading-relaxed font-medium">{str}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Areas to Improve Container (Soft Amber Tint) */}
        <div className="bg-amber-950/20 border border-amber-900/40 rounded-2xl p-5 flex flex-col gap-4">
          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-2">
            <span>Areas to Improve</span>
          </h4>
          <div className="flex flex-col gap-2.5">
            {listWeaknesses.map((weak, idx) => (
              <div key={idx} className="flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200 leading-relaxed font-medium">{weak}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

StrengthsWeaknessesGrid.displayName = "StrengthsWeaknessesGrid";

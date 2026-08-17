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
  if (strengths.length === 0 && weaknesses.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Strengths */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          Strengths
        </h3>
        <div className="flex flex-col gap-3">
          {strengths.length > 0 ? (
            strengths.map((str, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-300 leading-relaxed">{str}</span>
              </div>
            ))
          ) : (
            <span className="text-sm text-slate-500 italic">No strengths recorded.</span>
          )}
        </div>
      </div>

      {/* Weaknesses */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          Areas to Improve
        </h3>
        <div className="flex flex-col gap-3">
          {weaknesses.length > 0 ? (
            weaknesses.map((weak, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-300 leading-relaxed">{weak}</span>
              </div>
            ))
          ) : (
            <span className="text-sm text-slate-500 italic">No areas to improve recorded.</span>
          )}
        </div>
      </div>
    </div>
  );
});

StrengthsWeaknessesGrid.displayName = "StrengthsWeaknessesGrid";

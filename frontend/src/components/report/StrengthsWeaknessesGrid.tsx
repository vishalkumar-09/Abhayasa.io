"use client";

import React from "react";
import { CheckCircle, AlertTriangle } from "lucide-react";

interface StrengthsWeaknessesGridProps {
  strengths?: string[];
  weaknesses?: string[];
}

export const StrengthsWeaknessesGrid: React.FC<StrengthsWeaknessesGridProps> = React.memo(({
  strengths = [],
  weaknesses = [],
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Strengths Card */}
      <div className="glass-card rounded-2xl p-6 border border-zinc-800/80 flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle className="h-4 w-4" />
          </div>
          <h3 className="font-semibold text-sm text-white">Demonstrated Strengths</h3>
        </div>
        <ul className="flex flex-col gap-2.5">
          {strengths.length > 0 ? (
            strengths.map((str, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300 leading-relaxed">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>{str.replace(/^[-\d.]+\s*/, "")}</span>
              </li>
            ))
          ) : (
            <li className="text-xs text-zinc-500 italic">No specific strengths documented.</li>
          )}
        </ul>
      </div>

      {/* Weaknesses Card */}
      <div className="glass-card rounded-2xl p-6 border border-zinc-800/80 flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <h3 className="font-semibold text-sm text-white">Areas for Improvement</h3>
        </div>
        <ul className="flex flex-col gap-2.5">
          {weaknesses.length > 0 ? (
            weaknesses.map((weak, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300 leading-relaxed">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span>{weak.replace(/^[-\d.]+\s*/, "")}</span>
              </li>
            ))
          ) : (
            <li className="text-xs text-zinc-500 italic">No major weaknesses flagged.</li>
          )}
        </ul>
      </div>
    </div>
  );
});

StrengthsWeaknessesGrid.displayName = "StrengthsWeaknessesGrid";

"use client";

import React from "react";

interface PrepStepsChecklistProps {
  plan: string[];
}

export const PrepStepsChecklist: React.FC<PrepStepsChecklistProps> = React.memo(({ plan = [] }) => {
  if (plan.length === 0) return null;

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-slate-100 mb-4">Recommended Next Steps</h2>
      
      <ol className="flex flex-col gap-3">
        {plan.map((step, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold shrink-0">
              {idx + 1}
            </span>
            <span className="text-sm text-slate-300 leading-relaxed pt-0.5">
              {step}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
});

PrepStepsChecklist.displayName = "PrepStepsChecklist";

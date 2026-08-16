"use client";

import React, { useMemo } from "react";
import { TrendingUp } from "lucide-react";

interface PrepStepsChecklistProps {
  weaknesses?: string[];
  recommendations?: string;
  strengths?: string[];
}

export const PrepStepsChecklist: React.FC<PrepStepsChecklistProps> = React.memo(({
  weaknesses = [],
  recommendations = "",
  strengths = [],
}) => {
  const highPriorityItems = useMemo(() => {
    const items: { id: string; text: string }[] = [];
    if (weaknesses && Array.isArray(weaknesses) && weaknesses.length > 0) {
      weaknesses.forEach((weakness: string, idx: number) => {
        if (weakness && weakness.trim()) {
          const cleanW = weakness.replace(/^[-\d.]+\s*/, "").trim();
          items.push({ id: `hp-w-${idx}`, text: `Address weakness: ${cleanW}` });
        }
      });
    }
    if (recommendations && typeof recommendations === "string") {
      const recLines = recommendations
        .split("\n")
        .map((l: string) => l.replace(/^[-*•\d.]+\s*/, "").trim())
        .filter((l: string) => l.length > 12 && !l.toLowerCase().includes("actionable roadmap") && !l.toLowerCase().includes("missing concepts"));
      recLines.forEach((rec: string, idx: number) => {
        if (items.length < 5) {
          items.push({ id: `hp-r-${idx}`, text: rec });
        }
      });
    }
    if (items.length === 0) {
      items.push(
        { id: "hp-d-1", text: "Review concepts matching your recent technical question topics." },
        { id: "hp-d-2", text: "Practice restructuring technical descriptions using the STAR framework." }
      );
    }
    return items;
  }, [weaknesses, recommendations]);

  const skillGapItems = useMemo(() => {
    const items: { id: string; text: string }[] = [];
    if (recommendations && typeof recommendations === "string" && recommendations.includes("Missing Concepts:")) {
      const missingChunk = recommendations.split("Actionable Roadmap:")[0];
      const match = missingChunk.match(/Missing Concepts:\s*([^\n]+)/i);
      if (match && match[1]) {
        const concepts = match[1].split(",").map((c: string) => c.trim()).filter(Boolean);
        concepts.forEach((c: string, idx: number) => {
          items.push({ id: `sg-mc-${idx}`, text: `Master core principles and architectural trade-offs of ${c}` });
        });
      }
    }
    if (items.length === 0 && strengths && Array.isArray(strengths)) {
      strengths.forEach((str: string, idx: number) => {
        if (str && str.trim()) {
          const cleanS = str.replace(/^[-\d.]+\s*/, "").trim();
          items.push({ id: `sg-s-${idx}`, text: `Refine and expand demonstrated strength: ${cleanS}` });
        }
      });
    }
    if (items.length === 0) {
      items.push(
        { id: "sg-d-1", text: "Revise complexity formulas (Time & Space O-notation) to state them clearly in explanations." },
        { id: "sg-d-2", text: "Launch a new AI simulator session to practice scenario-based problem solving." }
      );
    }
    return items;
  }, [recommendations, strengths]);

  return (
    <div className="glass-card rounded-2xl p-6 border border-zinc-800/80 flex flex-col gap-5 relative overflow-hidden">
      <div className="absolute top-[-30%] right-[-10%] w-[180px] h-[180px] bg-emerald-600/5 rounded-full blur-[40px] pointer-events-none" />
      <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
        <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <TrendingUp className="h-4.5 w-4.5" />
        </div>
        <div>
          <h3 className="font-semibold text-sm text-white">Your Actionable Placement Prep Steps</h3>
          <p className="text-[10px] text-zinc-500 mt-0.5">Custom homework checklists compiled from your weaknesses and performance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Priority Checklist */}
        <div className="flex flex-col gap-3.5">
          <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
            High Priority Action Items
          </h4>
          <div className="flex flex-col gap-2.5">
            {highPriorityItems.map((step) => (
              <label key={step.id} className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-900/60 hover:border-zinc-800 hover:bg-zinc-950/80 transition-all cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="mt-0.5 h-3.5 w-3.5 rounded border-zinc-800 text-violet-600 focus:ring-violet-500 bg-zinc-900 cursor-pointer accent-violet-600 shrink-0"
                />
                <span className="text-[11px] text-zinc-300 leading-relaxed">{step.text}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Skill Gap Checklist */}
        <div className="flex flex-col gap-3.5">
          <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
            Skill Gap Closers & Refinements
          </h4>
          <div className="flex flex-col gap-2.5">
            {skillGapItems.map((step) => (
              <label key={step.id} className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-900/60 hover:border-zinc-800 hover:bg-zinc-950/80 transition-all cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="mt-0.5 h-3.5 w-3.5 rounded border-zinc-800 text-violet-600 focus:ring-violet-500 bg-zinc-900 cursor-pointer accent-violet-600 shrink-0"
                />
                <span className="text-[11px] text-zinc-300 leading-relaxed">{step.text}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

PrepStepsChecklist.displayName = "PrepStepsChecklist";

"use client";

import React from "react";
import { Volume2, VolumeX, Sparkles, Brain, MessageSquare } from "lucide-react";

interface QuestionCardProps {
  questionNumber: number;
  questionText: string;
  category?: string;
  difficulty?: string;
  expectedConcepts?: string[];
  followUpCount: number;
  followUpQuestionText?: string;
  isAiSpeaking: boolean;
  isMuted: boolean;
  onSpeak: (text?: string) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = React.memo(({
  questionNumber,
  questionText,
  category,
  difficulty,
  expectedConcepts,
  followUpCount,
  followUpQuestionText,
  isAiSpeaking,
  isMuted,
  onSpeak,
}) => {
  const activeQuestionText = followUpQuestionText || questionText;

  return (
    <div className="glass-card rounded-2xl p-6 border border-zinc-800/80 relative overflow-hidden flex flex-col gap-4">
      <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-violet-600/5 rounded-full blur-[50px] pointer-events-none" />

      {/* Badges Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-bold text-zinc-300">
            Q{questionNumber}
          </span>
          {followUpCount > 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] font-bold text-amber-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Follow-Up #{followUpCount}
            </span>
          )}
          {category && (
            <span className="px-2.5 py-1 rounded-lg bg-zinc-900/60 border border-zinc-800/60 text-[11px] text-zinc-400">
              {category}
            </span>
          )}
        </div>

        {/* Speak / Speaking Status */}
        <button
          onClick={() => onSpeak(activeQuestionText)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
            isAiSpeaking
              ? "bg-violet-500/20 border-violet-500/40 text-violet-300 animate-pulse"
              : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white"
          }`}
          title="Replay Audio Question"
        >
          {isAiSpeaking ? (
            <>
              <Volume2 className="h-3.5 w-3.5 text-violet-400" />
              <span>AI Speaking...</span>
            </>
          ) : (
            <>
              <Volume2 className="h-3.5 w-3.5 text-zinc-400" />
              <span>Listen</span>
            </>
          )}
        </button>
      </div>

      {/* Main Question Text */}
      <div className="flex flex-col gap-2">
        <h2 className="text-base md:text-lg font-semibold text-white leading-relaxed tracking-tight">
          {activeQuestionText}
        </h2>
      </div>

      {/* Expected Concepts */}
      {expectedConcepts && expectedConcepts.length > 0 && (
        <div className="flex items-center gap-2 pt-2 border-t border-zinc-900">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 flex items-center gap-1">
            <Brain className="h-3 w-3 text-zinc-400" />
            Key Focus Areas:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {expectedConcepts.map((c, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 font-medium"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

QuestionCard.displayName = "QuestionCard";

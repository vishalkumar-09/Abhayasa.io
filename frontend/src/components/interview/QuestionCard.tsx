"use client";

import React from "react";
import { Volume2, VolumeX, Sparkles, Brain, Bot, Target } from "lucide-react";

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
    <div className="rounded-xl border border-slate-800 bg-[#111827] flex flex-col overflow-hidden shadow-sm">
      {/* AI Interviewer Header (Indigo tinted) */}
      <div className="bg-indigo-900/20 border-b border-indigo-900/30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-indigo-100">AI Interviewer</h3>
            <div className="flex items-center gap-2 mt-0.5">
              {difficulty && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  difficulty === 'SENIOR' ? 'text-red-300 bg-red-500/10' :
                  difficulty === 'MID' ? 'text-amber-300 bg-amber-500/10' :
                  'text-sky-300 bg-sky-500/10'
                }`}>
                  {difficulty}
                </span>
              )}
              {category && (
                <span className="text-[10px] font-semibold text-slate-400 px-2 py-0.5 rounded-full bg-slate-800/50">
                  {category}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => onSpeak(activeQuestionText)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
            isAiSpeaking
              ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300 animate-pulse"
              : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
          }`}
          title="Replay Audio Question"
        >
          {isAiSpeaking ? (
            <>
              <Volume2 className="h-4 w-4 text-indigo-400" />
              <span>Speaking...</span>
            </>
          ) : (
            <>
              <Volume2 className="h-4 w-4 text-slate-400" />
              <span>Listen</span>
            </>
          )}
        </button>
      </div>

      <div className="p-6">
        {/* Follow-up Badge */}
        {followUpCount > 0 && (
          <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-400">
            <Sparkles className="h-3.5 w-3.5" />
            Follow-Up Question
          </div>
        )}

        {/* Question Text */}
        <h2 className="text-xl font-semibold text-slate-100 leading-relaxed tracking-tight">
          {activeQuestionText}
        </h2>

        {/* Expected Concepts */}
        {expectedConcepts && expectedConcepts.length > 0 && (
          <div className="mt-6 flex flex-col gap-2 pt-4 border-t border-slate-800">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-slate-400" />
              Expected Keywords
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {expectedConcepts.map((c, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md bg-slate-800 text-[11px] font-medium text-slate-300"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

QuestionCard.displayName = "QuestionCard";

"use client";

import React, { useState } from "react";
import { MessageSquare, Lightbulb, ChevronRight, CheckCircle, AlertTriangle } from "lucide-react";

interface AnswerItem {
  id: number;
  answerText: string;
  score?: number;
  evaluationFeedback?: string;
  idealAnswer?: string;
}

interface QuestionItem {
  id: number;
  questionText: string;
  expectedConcepts?: string[];
  answers?: AnswerItem[];
}

interface QuestionReviewCardProps {
  question: QuestionItem;
  index: number;
}

export const QuestionReviewCard: React.FC<QuestionReviewCardProps> = React.memo(({ question, index }) => {
  const [showIdeal, setShowIdeal] = useState(false);
  const answer = question.answers?.[0];
  const score = answer?.score !== undefined ? Number(answer.score) : 0;

  const getScoreColor = (s: number) => {
    if (s >= 80) return "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
    if (s >= 60) return "bg-amber-500/10 border-amber-500/30 text-amber-400";
    return "bg-red-500/10 border-red-500/30 text-red-400";
  };

  return (
    <div className="glass-card rounded-2xl p-6 border border-zinc-800/80 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300 shrink-0">
            Q{index + 1}
          </span>
          <h4 className="text-sm font-semibold text-white leading-relaxed">
            {question.questionText}
          </h4>
        </div>

        {answer && (
          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border shrink-0 ${getScoreColor(score)}`}>
            {score} / 100
          </span>
        )}
      </div>

      {/* Candidate Answer */}
      <div className="flex flex-col gap-2 p-4 rounded-xl bg-zinc-950/60 border border-zinc-900">
        <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1">
          <MessageSquare className="h-3 w-3 text-zinc-400" />
          Your Submitted Explanation:
        </span>
        <p className="text-xs text-zinc-300 leading-relaxed font-mono whitespace-pre-wrap">
          {answer?.answerText || "No response submitted."}
        </p>
      </div>

      {/* Evaluation Feedback */}
      {answer?.evaluationFeedback && (
        <div className="flex flex-col gap-2 p-4 rounded-xl bg-violet-500/5 border border-violet-500/15">
          <span className="text-[10px] uppercase font-bold text-violet-400 tracking-wider flex items-center gap-1">
            <Lightbulb className="h-3 w-3 text-violet-400" />
            AI Expert Critique & Assessment:
          </span>
          <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
            {answer.evaluationFeedback}
          </p>
        </div>
      )}

      {/* Ideal Benchmark Model Answer Toggle */}
      {answer?.idealAnswer && (
        <div className="flex flex-col gap-2 pt-2 border-t border-zinc-900">
          <button
            onClick={() => setShowIdeal(!showIdeal)}
            className="flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-all self-start"
          >
            <ChevronRight className={`h-3.5 w-3.5 transition-transform ${showIdeal ? "rotate-90" : ""}`} />
            <span>{showIdeal ? "Hide Ideal Benchmark Answer" : "View Ideal Model Answer"}</span>
          </button>

          {showIdeal && (
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs text-zinc-300 leading-relaxed whitespace-pre-line font-mono mt-1">
              {answer.idealAnswer}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

QuestionReviewCard.displayName = "QuestionReviewCard";

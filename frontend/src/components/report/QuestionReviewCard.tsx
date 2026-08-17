"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface QuestionReviewCardProps {
  question: any;
  index: number;
}

export const QuestionReviewCard: React.FC<QuestionReviewCardProps> = React.memo(({ question, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { answer } = question;

  const scoreColor = (score: number) => {
    if (score >= 8) return "text-emerald-400 bg-emerald-500/10";
    if (score >= 5) return "text-amber-400 bg-amber-500/10";
    return "text-red-400 bg-red-500/10";
  };
  
  const scoreBadgeColor = (score: number) => {
    if (score >= 80) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 60) return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    return "text-red-400 bg-red-500/10 border-red-500/20";
  };

  const getDifficultyColor = (diff: string) => {
    const d = (diff || "").toLowerCase();
    if (d === "hard") return "bg-red-500/10 text-red-400 border-red-500/20";
    if (d === "medium") return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  };

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden flex flex-col">
      {/* Header (Clickable) */}
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold text-slate-200 w-6 shrink-0">Q{index + 1}</span>
          
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
            {question.category || "General"}
          </span>
          
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${getDifficultyColor(question.difficulty)}`}>
            {question.difficulty || "Medium"}
          </span>
          
          {answer?.evaluationScore !== undefined && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${scoreBadgeColor(answer.evaluationScore)}`}>
              Score: {answer.evaluationScore}/100
            </span>
          )}
        </div>
        
        <div className="text-slate-400 shrink-0">
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 pt-0 border-t border-slate-800 flex flex-col gap-5 mt-4">
          
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Question</span>
            <p className="text-sm text-slate-200 leading-relaxed font-medium">
              {question.questionText}
            </p>
          </div>

          {question.answered && answer ? (
            <>
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Your Answer</span>
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3">
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {answer.answerText || "No answer text provided."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-3 flex flex-col items-center justify-center gap-1">
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Technical</span>
                  <span className={`text-lg font-bold px-2 rounded ${scoreColor(answer.technicalScore || 0)}`}>
                    {answer.technicalScore || 0}/10
                  </span>
                </div>
                <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-3 flex flex-col items-center justify-center gap-1">
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Communication</span>
                  <span className={`text-lg font-bold px-2 rounded ${scoreColor(answer.communicationScore || 0)}`}>
                    {answer.communicationScore || 0}/10
                  </span>
                </div>
                <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-3 flex flex-col items-center justify-center gap-1">
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Depth</span>
                  <span className={`text-lg font-bold px-2 rounded ${scoreColor(answer.depthScore || 0)}`}>
                    {answer.depthScore || 0}/10
                  </span>
                </div>
                <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-3 flex flex-col items-center justify-center gap-1">
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Completeness</span>
                  <span className={`text-lg font-bold px-2 rounded ${scoreColor(answer.completenessScore || 0)}`}>
                    {answer.completenessScore || 0}/10
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Feedback</span>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {answer.evaluationFeedback || "No feedback available."}
                </p>
              </div>
            </>
          ) : (
            <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 text-center">
              <span className="text-sm text-slate-500 italic">This question was not answered.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

QuestionReviewCard.displayName = "QuestionReviewCard";

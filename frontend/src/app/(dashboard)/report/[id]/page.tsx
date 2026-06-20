"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
  Award,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  ArrowLeft,
  Loader2,
  Calendar,
  Layers,
  Sparkles,
  TrendingUp,
  Search
} from "lucide-react";

export default function ReportPage() {
  const { id: interviewId } = useParams();

  // Queries
  const { data: report, isLoading: loadingReport, error: reportError } = useQuery({
    queryKey: ["report", interviewId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/v1/interviews/${interviewId}/report`);
      return res.data;
    },
    enabled: !!interviewId,
  });

  const { data: interview, isLoading: loadingInterview } = useQuery({
    queryKey: ["interview", interviewId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/v1/interviews/${interviewId}`);
      return res.data;
    },
    enabled: !!interviewId,
  });

  const isLoading = loadingReport || loadingInterview;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <Loader2 className="h-10 w-10 text-violet-500 animate-spin" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white">Generating Performance Analytics...</h3>
          <p className="text-xs text-zinc-500 mt-1">Fetching RAG evaluation data from database...</p>
        </div>
      </div>
    );
  }

  if (reportError || !report) {
    return (
      <div className="glass-card rounded-2xl p-8 border border-zinc-800/80 text-center flex flex-col items-center justify-center gap-4">
        <AlertTriangle className="h-10 w-10 text-red-500" />
        <div>
          <h3 className="text-lg font-semibold text-white">Report Generation Failed</h3>
          <p className="text-sm text-zinc-400 mt-1">
            This interview session might not be completed, or report compilation failed.
          </p>
        </div>
        <div className="flex gap-4">
          <Link href="/interview" className="px-5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-800 transition-colors">
            Back to Simulator
          </Link>
          <Link href="/dashboard" className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const overallScoreNum = Number(report.overallScore || 0);
  
  // Custom score color mapping
  const getScoreColor = (score: number) => {
    if (score >= 8.5) return "text-emerald-400 border-emerald-500/20 bg-emerald-500/10";
    if (score >= 7.0) return "text-violet-400 border-violet-500/20 bg-violet-500/10";
    if (score >= 5.0) return "text-yellow-400 border-yellow-500/20 bg-yellow-500/10";
    return "text-red-400 border-red-500/20 bg-red-500/10";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 8.5) return "Distinguished Candidate";
    if (score >= 7.0) return "Strong Candidate";
    if (score >= 5.0) return "Intermediate candidate";
    return "Requires Mentorship";
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header and Back Link */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-violet-400 tracking-widest uppercase">Evaluation Report</span>
              <span className="text-xs text-zinc-600">•</span>
              <span className="text-xs text-zinc-500 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(report.createdAt).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric"
                })}
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
              Session Performance Review #{report.interviewId}
            </h2>
          </div>
        </div>
      </div>

      {/* Main Score Banner & KPI Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Score Dial Banner */}
        <div className="lg:col-span-1 glass-card rounded-2xl p-6 border border-zinc-800/80 flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-[150px] h-[150px] bg-violet-600/10 rounded-full blur-[40px] pointer-events-none" />
          
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Aggregate Rating</span>
          
          {/* Big Score Dial */}
          <div className="relative flex items-center justify-center my-6 h-36 w-36">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="64"
                stroke="#1f2937"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r="64"
                stroke="#8b5cf6"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={402}
                strokeDashoffset={402 - (402 * overallScoreNum) / 10}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-extrabold text-white">{overallScoreNum.toFixed(1)}</span>
              <span className="text-zinc-500 text-xs font-semibold mt-0.5">/ 10</span>
            </div>
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getScoreColor(overallScoreNum)}`}>
            {getScoreLabel(overallScoreNum)}
          </span>
        </div>

        {/* Executive summary block */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-zinc-800/80 flex flex-col justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-violet-400" />
              <h3 className="font-semibold text-sm text-white uppercase tracking-wider">Executive Review</h3>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed font-normal">
              {report.summary}
            </p>
          </div>

          {/* Quick stats on the session */}
          <div className="border-t border-zinc-900 pt-5 mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Total Questions</span>
              <span className="text-sm font-bold text-white mt-1">{interview?.questions?.length || 0} Questions</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Session Format</span>
              <span className="text-sm font-bold text-white mt-1">RAG Contextualized</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Evaluation Method</span>
              <span className="text-sm font-bold text-white mt-1">Gemini AI Structured</span>
            </div>
          </div>
        </div>
      </div>

      {/* Strengths & Weaknesses side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths Card */}
        <div className="glass-card rounded-2xl p-6 border border-zinc-800/80 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle className="h-4.5 w-4.5" />
            </div>
            <h3 className="font-semibold text-sm text-white">Identified Core Strengths</h3>
          </div>

          {report.strengths && report.strengths.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {report.strengths.map((str: string, index: number) => (
                <li key={index} className="flex items-start gap-2.5 text-xs text-zinc-300 leading-relaxed">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  {str}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-zinc-500">No major strengths highlighted in the evaluation.</p>
          )}
        </div>

        {/* Weaknesses Card */}
        <div className="glass-card rounded-2xl p-6 border border-zinc-800/80 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
            <div className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
              <AlertTriangle className="h-4.5 w-4.5" />
            </div>
            <h3 className="font-semibold text-sm text-white">Areas for Growth</h3>
          </div>

          {report.weaknesses && report.weaknesses.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {report.weaknesses.map((weak: string, index: number) => (
                <li key={index} className="flex items-start gap-2.5 text-xs text-zinc-300 leading-relaxed">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                  {weak}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-zinc-500">No major weaknesses highlighted in the evaluation.</p>
          )}
        </div>
      </div>

      {/* Improvement Roadmap Card */}
      <div className="glass-card rounded-2xl p-6 border border-zinc-800/80 flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
          <div className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400">
            <Lightbulb className="h-4.5 w-4.5" />
          </div>
          <h3 className="font-semibold text-sm text-white">Missing Concepts & Improvement Roadmap</h3>
        </div>

        <div className="text-xs text-zinc-300 leading-relaxed font-normal space-y-4">
          {report.recommendations?.split("\n").map((para: string, index: number) => {
            if (!para.trim()) return null;
            
            // Format bullet points or headers nicely if they exist
            const isBullet = para.trim().startsWith("-") || para.trim().startsWith("*");
            const isHeader = para.trim().startsWith("#");
            
            if (isHeader) {
              return (
                <h4 key={index} className="text-sm font-bold text-white mt-4 border-b border-zinc-900 pb-1 w-fit">
                  {para.replace(/#/g, "").trim()}
                </h4>
              );
            }
            if (isBullet) {
              return (
                <div key={index} className="flex items-start gap-2 ml-2">
                  <span className="h-1 w-1 rounded-full bg-violet-400 mt-2 shrink-0" />
                  <p>{para.replace(/^[-*]\s+/, "")}</p>
                </div>
              );
            }

            return <p key={index}>{para}</p>;
          })}
        </div>
      </div>

      {/* Questions Asked Card */}
      {interview?.questions && interview.questions.length > 0 && (
        <div className="glass-card rounded-2xl p-6 border border-zinc-800/80 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
            <div className="p-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <BookOpen className="h-4.5 w-4.5" />
            </div>
            <h3 className="font-semibold text-sm text-white">Questions list evaluated</h3>
          </div>

          <div className="flex flex-col gap-4 divide-y divide-zinc-900">
            {interview.questions.map((q: any, index: number) => (
              <div key={q.id} className={`flex flex-col gap-2 ${index > 0 ? "pt-4" : ""}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-2.5">
                    <span className="h-5 w-5 rounded-full bg-zinc-900 border border-zinc-850 flex items-center justify-center text-[10px] font-bold text-zinc-400 mt-0.5 shrink-0">
                      {index + 1}
                    </span>
                    <h4 className="text-xs font-semibold text-white leading-relaxed">
                      {q.questionText}
                    </h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-semibold border shrink-0 ${
                    q.difficulty === "SENIOR"
                      ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                      : q.difficulty === "JUNIOR"
                      ? "bg-sky-500/10 border-sky-500/20 text-sky-400"
                      : "bg-zinc-500/10 border-zinc-850 text-zinc-400"
                  }`}>
                    {q.difficulty}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

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
  MessageSquare,
  ChevronRight,
  TrendingDown,
  User,
  Trash2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { motion } from "framer-motion";

export default function ReportPage() {
  const { id: interviewId } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [expandedIdeal, setExpandedIdeal] = React.useState<Record<number, boolean>>({});

  const deleteInterviewMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.delete(`/api/v1/interviews/${interviewId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interviews"] });
      router.push("/dashboard");
    },
  });

  const [showDeleteModal, setShowDeleteModal] = React.useState(false);

  const handleDeleteInterview = () => {
    setShowDeleteModal(true);
  };

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
    if (score >= 5.0) return "Intermediate Candidate";
    return "Requires Mentorship";
  };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col gap-8">
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

        <button
          onClick={handleDeleteInterview}
          disabled={deleteInterviewMutation.isPending}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white text-red-400 text-xs font-semibold transition-all cursor-pointer disabled:opacity-40"
          title="Delete interview record to free DB storage"
        >
          <Trash2 className="h-4 w-4" />
          Delete Session Record
        </button>
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

      {/* Dynamic SVG score progression graph */}
      <div className="glass-card rounded-2xl p-6 border border-zinc-800/80 flex flex-col gap-5 relative overflow-hidden">
        <div className="absolute top-[-30%] left-[-10%] w-[200px] h-[200px] bg-fuchsia-600/5 rounded-full blur-[50px] pointer-events-none" />
        
        <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4.5 w-4.5 text-violet-400" />
            <h3 className="font-semibold text-sm text-white">Score Progression Chart</h3>
          </div>
          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Visual Rating Analytics</span>
        </div>

        <div className="h-48 w-full flex items-end justify-between px-2 pt-6 relative border-b border-zinc-900 pb-1">
          {/* Y Axis Grid lines */}
          <div className="absolute inset-y-0 left-0 right-0 flex flex-col justify-between pointer-events-none opacity-20">
            <div className="border-b border-zinc-800 w-full text-[8px] text-zinc-500">10 (Expert)</div>
            <div className="border-b border-zinc-800 w-full text-[8px] text-zinc-500">7 (Strong)</div>
            <div className="border-b border-zinc-800 w-full text-[8px] text-zinc-500">4 (Basic)</div>
            <div className="w-full text-[8px] text-zinc-500">0</div>
          </div>

          {/* Bar rendering */}
          {interview?.questions?.map((q: any, idx: number) => {
            const score = q.answer ? Number(q.answer.evaluationScore || 0) : 0;
            const barHeight = score * 10; // 0% to 100%

            return (
              <div key={q.id} className="flex-1 flex flex-col items-center gap-3 group z-10">
                <div className="w-10 bg-zinc-950/80 rounded-t-lg relative flex items-end h-32 overflow-hidden border border-zinc-900 hover:border-violet-500/40 transition-all shadow-inner">
                  {/* Pulsing Gradient fill */}
                  <div
                    style={{ height: `${barHeight}%` }}
                    className="w-full bg-gradient-to-t from-violet-600/80 to-fuchsia-500/80 group-hover:from-violet-600 group-hover:to-fuchsia-500 transition-all duration-700 ease-out rounded-t-md"
                  />
                  {/* Score Tooltip overlay */}
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition-all bg-zinc-900 border border-zinc-850 text-white text-[9px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap shadow-xl">
                    Score: {score}/10
                  </div>
                </div>
                
                {/* Category label indicator */}
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[10px] text-zinc-400 font-bold">Q{idx + 1}</span>
                  <span className="text-[7px] text-zinc-600 font-semibold uppercase tracking-wider max-w-[50px] truncate text-center">
                    {score >= 7 ? "Strength" : "Improve"}
                  </span>
                </div>
              </div>
            );
          })}
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

      {/* Actionable Placement Prep Steps */}
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
          {/* Priority Checklist compiled from candidate weaknesses */}
          <div className="flex flex-col gap-3.5">
            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              High Priority Action Items
            </h4>
            <div className="flex flex-col gap-2.5">
              {(() => {
                const items: { id: string; text: string }[] = [];
                if (report.weaknesses && Array.isArray(report.weaknesses) && report.weaknesses.length > 0) {
                  report.weaknesses.forEach((weakness: string, idx: number) => {
                    if (weakness && weakness.trim()) {
                      const cleanW = weakness.replace(/^[-\d.]+\s*/, '').trim();
                      items.push({ id: `hp-w-${idx}`, text: `Address weakness: ${cleanW}` });
                    }
                  });
                }
                if (report.recommendations && typeof report.recommendations === "string") {
                  const recLines = report.recommendations.split("\n")
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
                return items.map((step) => (
                  <label key={step.id} className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-900/60 hover:border-zinc-800 hover:bg-zinc-950/80 transition-all cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-3.5 w-3.5 rounded border-zinc-800 text-violet-600 focus:ring-violet-500 bg-zinc-900 cursor-pointer accent-violet-600 shrink-0"
                    />
                    <span className="text-[11px] text-zinc-300 leading-relaxed">{step.text}</span>
                  </label>
                ));
              })()}
            </div>
          </div>

          {/* Skill Gap Checklist compiled from missing concepts & strengths */}
          <div className="flex flex-col gap-3.5">
            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
              Skill Gap Closers & Refinements
            </h4>
            <div className="flex flex-col gap-2.5">
              {(() => {
                const items: { id: string; text: string }[] = [];
                if (report.recommendations && typeof report.recommendations === "string" && report.recommendations.includes("Missing Concepts:")) {
                  const missingChunk = report.recommendations.split("Actionable Roadmap:")[0];
                  const match = missingChunk.match(/Missing Concepts:\s*([^\n]+)/i);
                  if (match && match[1]) {
                    const concepts = match[1].split(",").map((c: string) => c.trim()).filter(Boolean);
                    concepts.forEach((c: string, idx: number) => {
                      items.push({ id: `sg-mc-${idx}`, text: `Master core principles and architectural trade-offs of ${c}` });
                    });
                  }
                }
                if (items.length === 0 && report.strengths && Array.isArray(report.strengths)) {
                  report.strengths.forEach((str: string, idx: number) => {
                    if (str && str.trim()) {
                      const cleanS = str.replace(/^[-\d.]+\s*/, '').trim();
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
                return items.map((step) => (
                  <label key={step.id} className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-900/60 hover:border-zinc-800 hover:bg-zinc-950/80 transition-all cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-3.5 w-3.5 rounded border-zinc-800 text-violet-600 focus:ring-violet-500 bg-zinc-900 cursor-pointer accent-violet-600 shrink-0"
                    />
                    <span className="text-[11px] text-zinc-300 leading-relaxed">{step.text}</span>
                  </label>
                ));
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Questions Asked Card */}
      {interview?.questions && interview.questions.length > 0 && (
        <div className="glass-card rounded-2xl p-6 border border-zinc-800/80 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
            <div className="p-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <BookOpen className="h-4.5 w-4.5" />
            </div>
            <h3 className="font-semibold text-sm text-white">Detailed Question Reviews</h3>
          </div>

          <div className="flex flex-col gap-5 divide-y divide-zinc-900">
            {interview.questions.map((q: any, index: number) => (
              <div key={q.id} className={`flex flex-col gap-3.5 ${index > 0 ? "pt-5" : ""}`}>
                
                {/* Header Question Line */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="h-5.5 w-5.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400 mt-0.5 shrink-0">
                      {index + 1}
                    </span>
                    <h4 className="text-xs md:text-sm font-semibold text-white leading-relaxed">
                      {q.questionText}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-semibold border ${
                      q.difficulty === "SENIOR"
                        ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                        : q.difficulty === "JUNIOR"
                        ? "bg-sky-500/10 border-sky-500/20 text-sky-400"
                        : "bg-zinc-500/10 border-zinc-850 text-zinc-400"
                    }`}>
                      {q.difficulty}
                    </span>

                    {/* Question score badge */}
                    {q.answer && (
                      <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-bold border ${
                        q.answer.evaluationScore >= 8
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : q.answer.evaluationScore >= 5
                          ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                          : "bg-red-500/10 border-red-500/20 text-red-400"
                      }`}>
                        Score: {q.answer.evaluationScore}/10
                      </span>
                    )}
                  </div>
                </div>

                {/* Answer and Feedback collapse box */}
                {q.answer ? (
                  <div className="ml-8.5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-3.5">
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                        <User className="h-3 w-3" />
                        <span>Your Response</span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed font-normal whitespace-pre-line">
                        {q.answer.answerText || "[No explanation text provided]"}
                      </p>
                    </div>

                    <div className="bg-violet-950/5 border border-violet-950/10 rounded-xl p-3.5">
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-violet-400 uppercase tracking-wider mb-1.5">
                        <MessageSquare className="h-3 w-3" />
                        <span>AI Evaluator Feedback</span>
                      </div>
                      <p className="text-xs text-zinc-350 leading-relaxed font-normal">
                        {q.answer.evaluationFeedback || "[No AI feedback generated]"}
                      </p>
                    </div>

                    {/* Rating Breakdown sub-scores */}
                    <div className="col-span-1 md:col-span-2 bg-zinc-950/20 border border-zinc-900/60 rounded-xl p-4 mt-2">
                      <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-3">Rating Breakdown</h5>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                          { label: "Technical Accuracy", score: q.answer.technicalScore ?? q.answer.evaluationScore },
                          { label: "Communication Skills", score: q.answer.communicationScore ?? 7 },
                          { label: "Explanation Depth", score: q.answer.depthScore ?? (q.answer.evaluationScore - 1 > 0 ? q.answer.evaluationScore - 1 : 5) },
                          { label: "Completeness Check", score: q.answer.completenessScore ?? q.answer.evaluationScore },
                        ].map((sub, i) => (
                          <div key={i} className="flex flex-col gap-1.5">
                            <div className="flex justify-between text-[10px] font-semibold">
                              <span className="text-zinc-500">{sub.label}</span>
                              <span className="text-white">{sub.score}/10</span>
                            </div>
                            <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${sub.score * 10}%` }}
                                className={`h-full rounded-full ${
                                  sub.score >= 8
                                    ? "bg-emerald-500"
                                    : sub.score >= 5
                                    ? "bg-violet-500"
                                    : "bg-red-500"
                                }`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Checklists and Model Answer Trigger */}
                    <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      {/* Structure Checklist */}
                      <div className="bg-zinc-950/20 border border-zinc-900/60 rounded-xl p-4 flex flex-col justify-between">
                        <div>
                          <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-3">Response Structural Audit</h5>
                          <div className="flex flex-col gap-2.5">
                            {(q.difficulty === "SENIOR" || q.questionText.toLowerCase().includes("describe") || q.questionText.toLowerCase().includes("tell me about")) ? (
                              // HR / STAR Checklist
                              [
                                { name: "Context / Situation set", met: q.answer.answerText.length > 30 },
                                { name: "Task/Challenge outlined", met: q.answer.answerText.toLowerCase().includes("challenge") || q.answer.answerText.toLowerCase().includes("had to") || q.answer.answerText.toLowerCase().includes("need") || q.answer.answerText.length > 60 },
                                { name: "Personal Action details", met: q.answer.answerText.toLowerCase().includes("i ") || q.answer.answerText.toLowerCase().includes("implemented") || q.answer.answerText.toLowerCase().includes("created") || q.answer.answerText.toLowerCase().includes("worked") },
                                { name: "Result / Impact outcome", met: q.answer.answerText.toLowerCase().includes("result") || q.answer.answerText.toLowerCase().includes("metrics") || q.answer.answerText.toLowerCase().includes("reduced") || q.answer.answerText.toLowerCase().includes("improved") || q.answer.answerText.length > 90 },
                              ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2.5 text-[11px]">
                                  <span className={`h-4.5 w-4.5 rounded-md flex items-center justify-center text-[10px] font-bold border ${item.met ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-zinc-900 border-zinc-800 text-zinc-650"}`}>
                                    {item.met ? "✓" : "○"}
                                  </span>
                                  <span className={item.met ? "text-zinc-300 font-medium" : "text-zinc-500 font-normal"}>{item.name}</span>
                                </div>
                              ))
                            ) : (
                              // Technical / DSA Checklist
                              [
                                { name: "Direct Definition explained", met: q.answer.answerText.length > 25 },
                                { name: "Edge cases/Tradeoffs evaluated", met: q.answer.answerText.toLowerCase().includes("tradeoff") || q.answer.answerText.toLowerCase().includes("limit") || q.answer.answerText.toLowerCase().includes("but") || q.answer.answerText.toLowerCase().includes("however") || q.answer.answerText.toLowerCase().includes("instead") },
                                { name: "Implementation details described", met: q.answer.answerText.toLowerCase().includes("code") || q.answer.answerText.toLowerCase().includes("class") || q.answer.answerText.toLowerCase().includes("function") || q.answer.answerText.toLowerCase().includes("method") || q.answer.answerText.length > 70 },
                                { name: "Complexity / Performance mentioned", met: q.answer.answerText.toLowerCase().includes("complexity") || q.answer.answerText.toLowerCase().includes("time") || q.answer.answerText.toLowerCase().includes("space") || q.answer.answerText.toLowerCase().includes("o(") || q.answer.answerText.toLowerCase().includes("scale") },
                              ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2.5 text-[11px]">
                                  <span className={`h-4.5 w-4.5 rounded-md flex items-center justify-center text-[10px] font-bold border ${item.met ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-zinc-900 border-zinc-800 text-zinc-650"}`}>
                                    {item.met ? "✓" : "○"}
                                  </span>
                                  <span className={item.met ? "text-zinc-300 font-medium" : "text-zinc-500 font-normal"}>{item.name}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Model Answer button */}
                      <div className="bg-zinc-950/20 border border-zinc-900/60 rounded-xl p-4 flex flex-col justify-between">
                        <div>
                          <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Model Blueprint</h5>
                          <p className="text-[11px] text-zinc-500 leading-relaxed mb-3">
                            Review how a top candidate would structure their answer to this specific question.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setExpandedIdeal(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 hover:border-zinc-700 text-zinc-300 font-semibold text-xs transition-all cursor-pointer"
                        >
                          <Lightbulb className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400/10" />
                          {expandedIdeal[q.id] ? "Hide Study Guide" : "View Study Guide"}
                        </button>
                      </div>
                    </div>

                    {/* Model Answer Collapsible Outline */}
                    {expandedIdeal[q.id] && (
                      <div className="col-span-1 md:col-span-2 bg-violet-600/5 border border-violet-500/20 rounded-xl p-4 mt-2 animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-violet-400 uppercase tracking-wider mb-2">
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Ideal Answer blueprint ({getIdealAnswerOutline(q.questionText, q.expectedKeywords).structure})</span>
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed font-normal whitespace-pre-line">
                          {getIdealAnswerOutline(q.questionText, q.expectedKeywords).response}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="ml-8.5 text-xs text-zinc-500 italic bg-zinc-950/20 border border-zinc-900/60 rounded-xl p-3">
                    This question was skipped or not answered by the candidate.
                  </div>
                )}

              </div>
            ))}
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          setShowDeleteModal(false);
          deleteInterviewMutation.mutate();
        }}
        title={`Delete Session Record #${interviewId}?`}
        description="Are you sure you want to delete this session? All questions, answers, and evaluation reports will be permanently removed from database storage."
        confirmText="Delete Record"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteInterviewMutation.isPending}
      />
    </motion.div>
  );
}

// Client-side Model Answer Blueprint Generator
function getIdealAnswerOutline(questionText: string, keywords: string[]): { structure: string; response: string } {
  const qLower = questionText.toLowerCase();
  const isHR = qLower.includes("tell me about") || qLower.includes("describe a time") || qLower.includes("how do you") || qLower.includes("conflict") || qLower.includes("challenging");
  
  if (isHR) {
    return {
      structure: "STAR Method (Situation ➡️ Task ➡️ Action ➡️ Result)",
      response: `1. **Situation (Context)**: Start with a clear background context. (e.g. "During my second project, we were integrating a multi-service pipeline...")
2. **Task (Challenge)**: Define the core obstacle or conflict. (e.g. "We faced severe rate-limiting and connection leaks in production...")
3. **Action (Personal Contribution)**: Explain your specific actions. (e.g. "I personally refactored the connection pools, set up exponential backoff retries...")
4. **Result (Outcome)**: Finish with quantified metrics and achievements. (e.g. "This optimized response times by 35% and completely resolved the leaks.")`
    };
  } else {
    const kList = keywords && keywords.length > 0 ? keywords.slice(0, 3).join(", ") : "framework internals";
    return {
      structure: "Technical Definition ➡️ Execution Details ➡️ Tradeoffs / Best Practices",
      response: `1. **Core Definition**: Define the concept accurately. (e.g. "This concept refers to the underlying mechanism governing how resources are managed/rendered...")
2. **Technical Execution & Keywords**: Describe the workflow using keywords: ${kList}. (e.g. explain how these tokens/commands compile and map inside the framework stack)
3. **Architectural Tradeoffs**: Detail when to avoid this approach and how it affects memory/CPU overhead.`
    };
  }
}

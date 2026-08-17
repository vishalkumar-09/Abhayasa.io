"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ReportHeader } from "@/components/report/ReportHeader";
import { PerformanceMetricsCard } from "@/components/report/PerformanceMetricsCard";
import { PerformanceOverTimeCard } from "@/components/report/PerformanceOverTimeCard";
import { StrengthsWeaknessesGrid } from "@/components/report/StrengthsWeaknessesGrid";
import { QuestionReviewCard } from "@/components/report/QuestionReviewCard";
import { ReportSidebar } from "@/components/report/ReportSidebar";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Loader2 } from "lucide-react";

export default function ReportPage() {
  const { id: interviewId } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"Overview" | "Performance" | "Questions" | "Feedback" | "Transcript">("Overview");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch report data
  const { data: report, isLoading } = useQuery({
    queryKey: ["report", interviewId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/v1/interviews/${interviewId}/report`);
      return res.data;
    },
    enabled: !!interviewId,
  });

  const deleteInterviewMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.delete(`/api/v1/interviews/${interviewId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interviews"] });
      router.push("/interviews");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center gap-4 text-slate-100">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
        <span className="text-sm font-medium text-slate-400">Loading interview report...</span>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center gap-4 p-6 text-slate-100">
        <h2 className="text-xl font-semibold text-slate-100">Report Not Found</h2>
        <p className="text-sm text-slate-400 mb-4">The requested interview evaluation could not be found.</p>
        <button
          onClick={() => router.push("/interviews")}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm px-4 py-2.5 rounded-lg transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const overallScore = report.overallScore !== undefined ? Number(report.overallScore) : 78;
  const questions = report.questions || [];
  const competencyBreakdown = report.competencyBreakdown || [];

  const tabs: ("Overview" | "Performance" | "Questions" | "Feedback" | "Transcript")[] = [
    "Overview",
    "Performance",
    "Questions",
    "Feedback",
    "Transcript"
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        
        {/* Top Header */}
        <ReportHeader
          roleTitle={report.roleTitle}
          categoryName={report.categoryName}
          createdAt={report.createdAt}
          companyName={report.companyName}
          durationMinutes={report.durationMinutes}
        />

        {/* Tab Navigation */}
        <div className="flex items-center gap-6 border-b border-slate-800/80 pb-0 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              id={tab === "Questions" ? "questions-tab" : undefined}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-xs md:text-sm font-semibold transition-all relative whitespace-nowrap ${
                activeTab === tab
                  ? "text-indigo-400 border-b-2 border-indigo-500"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Main Content & Sidebar Layout (2:1 Grid) */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Main Column */}
          <div className="flex-1 flex flex-col gap-6 min-w-0 w-full">
            
            {/* OVERVIEW TAB */}
            {activeTab === "Overview" && (
              <>
                {/* 1. Top 3-Card Metrics Row */}
                <PerformanceMetricsCard
                  overallScore={overallScore}
                  readiness={report.readiness}
                  competencyBreakdown={competencyBreakdown}
                />

                {/* 2. Middle Area Chart: Performance Over Time */}
                <PerformanceOverTimeCard currentScore={overallScore} />

                {/* 3. Strengths & Improvement Areas Grid */}
                <StrengthsWeaknessesGrid
                  strengths={report.strengths || []}
                  weaknesses={report.weaknesses || []}
                />
              </>
            )}

            {/* PERFORMANCE TAB */}
            {activeTab === "Performance" && (
              <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 flex flex-col gap-6">
                <h3 className="text-base font-semibold text-slate-100">Competency Breakdown & Evaluation Metrics</h3>
                
                <div className="flex flex-col gap-5">
                  {(competencyBreakdown.length > 0 ? competencyBreakdown : [
                    { name: "Technical Knowledge", score: 82, evidence: "Demonstrated strong knowledge of core framework fundamentals." },
                    { name: "Problem Solving", score: 76, evidence: "Approached requirements algorithmically with good trade-off analysis." },
                    { name: "Communication", score: 74, evidence: "Clear explanations, though could structure architectural points faster." },
                    { name: "System Design", score: 80, evidence: "Solid understanding of caching, microservices, and database scaling." },
                    { name: "Coding", score: 72, evidence: "Clean syntax and modular organization; recommend edge-case unit testing." }
                  ]).map((comp: any, idx: number) => {
                    const scoreColor = comp.score >= 80 ? 'bg-emerald-500' : comp.score >= 60 ? 'bg-amber-500' : 'bg-red-500';
                    return (
                      <div key={idx} className="flex flex-col gap-2 bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-slate-200">{comp.name}</span>
                          <span className="text-sm font-bold text-slate-300">{comp.score}<span className="text-slate-500 font-normal">/100</span></span>
                        </div>
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full ${scoreColor} rounded-full transition-all duration-500`} style={{ width: `${comp.score}%` }} />
                        </div>
                        {comp.evidence && (
                          <p className="text-xs text-slate-400 mt-1 italic">"{comp.evidence}"</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* QUESTIONS TAB */}
            {activeTab === "Questions" && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-100">Detailed Question Review</h3>
                  <span className="text-xs text-slate-400">{questions.length} Questions Evaluated</span>
                </div>
                <div className="flex flex-col gap-4">
                  {questions.map((q: any, idx: number) => (
                    <QuestionReviewCard key={q.id || idx} question={q} index={idx} />
                  ))}
                </div>
              </div>
            )}

            {/* FEEDBACK TAB */}
            {activeTab === "Feedback" && (
              <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
                <h3 className="text-base font-semibold text-slate-100">AI Executive Feedback</h3>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {report.summary || "You demonstrated strong technical knowledge across all core topics. Your explanations were logical and well-reasoned. To achieve a top-tier score in upcoming interviews, focus on refining edge-case handling and structuring system design trade-offs quickly."}
                </p>
                
                {report.recommendations && (
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wide mb-2">Targeted Recommendations</h4>
                    <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">
                      {report.recommendations}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TRANSCRIPT TAB */}
            {activeTab === "Transcript" && (
              <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 flex flex-col gap-5">
                <h3 className="text-base font-semibold text-slate-100">Interview Transcript Log</h3>
                <div className="flex flex-col gap-4">
                  {questions.map((q: any, idx: number) => (
                    <div key={idx} className="flex flex-col gap-2 p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
                      <span className="text-xs font-bold text-indigo-400">Interviewer (Q{idx + 1}):</span>
                      <p className="text-xs text-slate-200 font-medium">{q.questionText}</p>
                      
                      <span className="text-xs font-bold text-emerald-400 mt-2">Candidate Response:</span>
                      <p className="text-xs text-slate-300 bg-slate-950/40 p-3 rounded-lg border border-slate-800 whitespace-pre-wrap">
                        {q.answer?.answerText || "No answer provided."}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar (1/3 Width) */}
          <div className="w-full lg:w-80 shrink-0">
            <ReportSidebar
              roleTitle={report.roleTitle}
              companyName={report.companyName}
              categoryName={report.categoryName}
              difficulty={report.difficulty}
              createdAt={report.createdAt}
              durationMinutes={report.durationMinutes}
              readiness={report.readiness}
              summary={report.summary}
              focusAreas={report.missingConcepts || report.weaknesses}
            />
          </div>

        </div>

      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Interview Record?"
        description="Are you sure you want to permanently delete this interview evaluation? This action cannot be undone."
        confirmText="Delete Report"
        variant="danger"
        onConfirm={() => {
          setShowDeleteModal(false);
          deleteInterviewMutation.mutate();
        }}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  );
}

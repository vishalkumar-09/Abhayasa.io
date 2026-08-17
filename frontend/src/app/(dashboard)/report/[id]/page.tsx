"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ReportHeader } from "@/components/report/ReportHeader";
import { ReportSummaryCard } from "@/components/report/ReportSummaryCard";
import { PerformanceMetricsCard } from "@/components/report/PerformanceMetricsCard";
import { StrengthsWeaknessesGrid } from "@/components/report/StrengthsWeaknessesGrid";
import { PrepStepsChecklist } from "@/components/report/PrepStepsChecklist";
import { QuestionReviewCard } from "@/components/report/QuestionReviewCard";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Loader2 } from "lucide-react";

export default function ReportPage() {
  const { id: interviewId } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
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
      router.push("/dashboard");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
        <span className="text-xs text-zinc-400 font-medium">Generating Evaluation Analysis...</span>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-3 text-center p-6">
        <h2 className="text-base font-semibold text-white">Evaluation Report Not Available</h2>
        <p className="text-xs text-zinc-400">Complete an interview session to generate performance feedback.</p>
      </div>
    );
  }

  const overallScore = report.overallScore !== undefined ? Number(report.overallScore) : 0;
  const questions = report.questions || [];
  const competencyBreakdown: { name: string; score: number; evidence?: string }[] = report.competencyBreakdown || [];
  const readiness: string | null = report.readiness || null;
  const readinessScore: number = report.readinessScore ?? 0;
  const nextInterviewPlan: string[] = report.nextInterviewPlan || [];

  const readinessConfig = {
    INTERVIEW_READY: { label: "Interview Ready", color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-500/20" },
    NEEDS_IMPROVEMENT: { label: "Needs Improvement", color: "text-amber-400", bg: "bg-amber-400/10 border-amber-500/20" },
    NOT_READY: { label: "Not Ready", color: "text-red-400", bg: "bg-red-400/10 border-red-500/20" },
  };
  const rdConfig = readiness ? readinessConfig[readiness as keyof typeof readinessConfig] : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-10">
      <div className="max-w-5xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <ReportHeader
          roleTitle={report.roleTitle}
          categoryName={report.categoryName}
          overallScore={overallScore}
          createdAt={report.createdAt}
          onDelete={() => setShowDeleteModal(true)}
        />

        {/* Summary Card */}
        <ReportSummaryCard summary={report.summary} />

        {/* Performance Metrics Bar Graphs */}
        <PerformanceMetricsCard overallScore={overallScore} />

        {/* Readiness Badge */}
        {rdConfig && (
          <div className={`rounded-2xl border p-5 flex items-center justify-between gap-4 ${rdConfig.bg}`}>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-zinc-500 font-semibold mb-1">Interview Readiness</p>
              <p className={`text-lg font-bold ${rdConfig.color}`}>{rdConfig.label}</p>
              <p className="text-xs text-zinc-400 mt-0.5">Based on overall performance across all competencies</p>
            </div>
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="relative h-16 w-16">
                <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#27272a" strokeWidth="3"/>
                  <circle
                    cx="18" cy="18" r="15.9" fill="none" strokeWidth="3"
                    stroke={readiness === 'INTERVIEW_READY' ? '#22c55e' : readiness === 'NOT_READY' ? '#ef4444' : '#f59e0b'}
                    strokeDasharray={`${readinessScore} 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${rdConfig.color}`}>
                  {readinessScore}
                </span>
              </div>
              <span className="text-[10px] text-zinc-500">/ 100</span>
            </div>
          </div>
        )}

        {/* Competency Breakdown */}
        {competencyBreakdown.length > 0 && (
          <div className="glass-card rounded-2xl border border-zinc-800/80 p-6">
            <h3 className="text-sm font-bold text-white mb-4">Competency Breakdown</h3>
            <div className="flex flex-col gap-3">
              {competencyBreakdown.map((comp, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-zinc-300 font-medium">{comp.name}</span>
                    <span className="text-xs font-bold text-zinc-200">{comp.score}<span className="text-zinc-600">/100</span></span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${comp.score}%`,
                        background: comp.score >= 75
                          ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                          : comp.score >= 50
                            ? 'linear-gradient(90deg, #a78bfa, #7c3aed)'
                            : 'linear-gradient(90deg, #ef4444, #dc2626)',
                      }}
                    />
                  </div>
                  {comp.evidence && (
                    <p className="text-[10px] text-zinc-500 mt-0.5 italic">&ldquo;{comp.evidence}&rdquo;</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strengths & Weaknesses Grid */}
        <StrengthsWeaknessesGrid
          strengths={report.strengths}
          weaknesses={report.weaknesses}
        />

        {/* Prep Steps Checklist */}
        <PrepStepsChecklist
          weaknesses={report.weaknesses}
          recommendations={report.recommendations}
          strengths={report.strengths}
        />

        {/* Personalised Next Interview Plan */}
        {nextInterviewPlan.length > 0 && (
          <div className="glass-card rounded-2xl border border-zinc-800/80 p-6">
            <h3 className="text-sm font-bold text-white mb-1">Your Personalised Preparation Plan</h3>
            <p className="text-[11px] text-zinc-500 mb-4">Specific steps to ace your next interview based on the gaps found today.</p>
            <ol className="flex flex-col gap-3">
              {nextInterviewPlan.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="shrink-0 h-5 w-5 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-[10px] font-bold text-violet-300">
                    {i + 1}
                  </span>
                  <span className="text-xs text-zinc-300 leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Question-by-Question Reviews */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white tracking-wide uppercase text-zinc-400">
            Question-by-Question Feedback &amp; Critique
          </h3>
          <div className="flex flex-col gap-6">
            {questions.map((q: any, idx: number) => (
              <QuestionReviewCard key={q.id || idx} question={q} index={idx} />
            ))}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
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

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
      router.push("/interviews");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center gap-4 text-slate-100">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
        <span className="text-sm font-medium text-slate-400">Loading report...</span>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center gap-4 p-6 text-slate-100">
        <h2 className="text-xl font-semibold text-slate-100">Report Not Found</h2>
        <p className="text-sm text-slate-400 mb-4">The requested interview report could not be found.</p>
        <button
          onClick={() => router.push("/interviews")}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm px-4 py-2.5 rounded-lg transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const overallScore = report.overallScore !== undefined ? Number(report.overallScore) : 0;
  const questions = report.questions || [];
  const competencyBreakdown: { name: string; score: number; evidence?: string }[] = report.competencyBreakdown || [];
  const missingConcepts: string[] = report.missingConcepts || [];
  const nextInterviewPlan: string[] = report.nextInterviewPlan || [];

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100 pb-16">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Main Content Column */}
        <div className="flex-1 flex flex-col gap-8 min-w-0">
          <ReportHeader
            roleTitle={report.roleTitle}
            categoryName={report.categoryName}
            createdAt={report.createdAt}
            companyName={report.companyName}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <PerformanceMetricsCard
                overallScore={overallScore}
                readiness={report.readiness}
              />
            </div>
            <div className="lg:col-span-2">
              <ReportSummaryCard
                summary={report.summary}
                roleTitle={report.roleTitle}
                categoryName={report.categoryName}
                createdAt={report.createdAt}
                readinessScore={report.readinessScore}
              />
            </div>
          </div>

          {competencyBreakdown.length > 0 && (
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-slate-100 mb-5">Competency Breakdown</h2>
              <div className="flex flex-col gap-5">
                {competencyBreakdown.map((comp, idx) => {
                  const scoreColor = comp.score >= 80 ? 'bg-emerald-500' : comp.score >= 60 ? 'bg-amber-500' : 'bg-red-500';
                  return (
                    <div key={idx} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-200">{comp.name}</span>
                        <span className="text-sm font-semibold text-slate-300">{comp.score}<span className="text-slate-500 font-normal">/100</span></span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${scoreColor} rounded-full`} style={{ width: `${comp.score}%` }} />
                      </div>
                      {comp.evidence && (
                        <p className="text-xs text-slate-400 mt-1 italic">{comp.evidence}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <StrengthsWeaknessesGrid
            strengths={report.strengths || []}
            weaknesses={report.weaknesses || []}
          />

          {missingConcepts.length > 0 && (
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-slate-100 mb-4">Concepts to Study</h2>
              <div className="flex flex-wrap gap-2">
                {missingConcepts.map((concept, i) => (
                  <span key={i} className="inline-flex items-center bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium px-3 py-1.5 rounded-full">
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          )}

          {nextInterviewPlan.length > 0 && (
            <PrepStepsChecklist
              plan={nextInterviewPlan}
            />
          )}

          <div className="flex flex-col gap-4 mt-2">
            <h2 className="text-lg font-semibold text-slate-100">Detailed Question Review</h2>
            <div className="flex flex-col gap-4">
              {questions.map((q: any, idx: number) => (
                <QuestionReviewCard key={q.id || idx} question={q} index={idx} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Interview Details</h3>
            
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Role</span>
              <span className="text-sm text-slate-300">{report.roleTitle || "Not specified"}</span>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Company</span>
              <span className="text-sm text-slate-300">{report.companyName || "Not specified"}</span>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Type</span>
              <span className="text-sm text-slate-300">{report.categoryName || "Not specified"}</span>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Date</span>
              <span className="text-sm text-slate-300">
                {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : "Unknown date"}
              </span>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Readiness</span>
              <span className="text-sm text-slate-300">{report.readiness?.replace(/_/g, " ") || "Pending"}</span>
            </div>
            
            <div className="border-t border-slate-800 pt-4 mt-2">
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm px-4 py-2.5 rounded-lg transition-colors text-center"
              >
                Back to Dashboard
              </button>
            </div>
          </div>

          {report.recommendations && (
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide mb-3">Recommendations</h3>
              <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">
                {report.recommendations}
              </p>
            </div>
          )}
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

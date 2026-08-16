"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ReportHeader } from "@/components/report/ReportHeader";
import { ReportSummaryCard } from "@/components/report/ReportSummaryCard";
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

        {/* Question-by-Question Reviews */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white tracking-wide uppercase text-zinc-400">
            Question-by-Question Feedback & Critique
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

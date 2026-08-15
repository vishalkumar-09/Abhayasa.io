"use client";

import React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import {
  Play,
  FileText,
  Briefcase,
  Award,
  Clock,
  ArrowRight,
  Plus,
  ChevronRight,
  Loader2,
  Calendar,
  AlertCircle,
  Trash2
} from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export default function DashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const deleteInterviewMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete(`/api/v1/interviews/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interviews"] });
    },
  });

  const [deleteTargetId, setDeleteTargetId] = React.useState<number | null>(null);

  const handleDeleteInterview = (id: number) => {
    setDeleteTargetId(id);
  };

  // Queries
  const { data: resumes = [], isLoading: loadingResumes } = useQuery({
    queryKey: ["resumes"],
    queryFn: async () => {
      const res = await apiClient.get("/api/v1/resumes");
      return res.data;
    },
  });

  const { data: jobs = [], isLoading: loadingJobs } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const res = await apiClient.get("/api/v1/job-descriptions");
      return res.data;
    },
  });

  const { data: interviews = [], isLoading: loadingInterviews } = useQuery({
    queryKey: ["interviews"],
    queryFn: async () => {
      const res = await apiClient.get("/api/v1/interviews");
      const list = res.data || [];
      return [...list].sort((a: any, b: any) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (timeB !== timeA) return timeB - timeA;
        return (b.id || 0) - (a.id || 0);
      });
    },
  });

  const isLoading = loadingResumes || loadingJobs || loadingInterviews;

  const activeInterviews = interviews.filter(
    (i: any) => i.status === "IN_PROGRESS" || i.status === "CREATED"
  );
  const completedInterviews = interviews.filter(
    (i: any) => i.status === "COMPLETED"
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-8"
    >
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 md:p-8 border border-[var(--border)] relative overflow-hidden bg-gradient-to-r from-violet-950/20 via-zinc-950 to-zinc-950"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Welcome back, <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">{user?.name}</span>!
          </h2>
          <p className="text-zinc-400 mt-2 text-sm md:text-base leading-relaxed">
            Ready to sharpen your interview performance? Upload your resume, add target job descriptions, and let our AI simulator evaluate your readiness for top-tier tech roles.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Link
                href="/interview"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm transition-all shadow-lg shadow-violet-600/20 cursor-pointer"
              >
                <Play className="h-4 w-4 fill-current" />
                New Mock Interview
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Link
                href="/upload-resume"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white font-medium text-sm transition-all cursor-pointer"
              >
                <FileText className="h-4 w-4" />
                Manage Resumes
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div variants={itemVariants} whileHover={{ y: -3 }} className="glass-card rounded-xl p-5 border border-[var(--border)] flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Interviews</p>
            <h3 className="text-2xl font-bold mt-1 text-[var(--foreground)]">{interviews.length}</h3>
          </div>
          <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/10">
            <Award className="h-5 w-5 text-violet-400" />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} whileHover={{ y: -3 }} className="glass-card rounded-xl p-5 border border-[var(--border)] flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Active Sessions</p>
            <h3 className="text-2xl font-bold mt-1 text-[var(--foreground)]">{activeInterviews.length}</h3>
          </div>
          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/10">
            <Clock className="h-5 w-5 text-yellow-400 animate-pulse" />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} whileHover={{ y: -3 }} className="glass-card rounded-xl p-5 border border-[var(--border)] flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Resumes</p>
            <h3 className="text-2xl font-bold mt-1 text-[var(--foreground)]">{resumes.length}</h3>
          </div>
          <div className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/10">
            <FileText className="h-5 w-5 text-sky-400" />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} whileHover={{ y: -3 }} className="glass-card rounded-xl p-5 border border-[var(--border)] flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Jobs Configured</p>
            <h3 className="text-2xl font-bold mt-1 text-[var(--foreground)]">{jobs.length}</h3>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/10">
            <Briefcase className="h-5 w-5 text-emerald-400" />
          </div>
        </motion.div>
      </motion.div>

      {/* Main Grid: Left = Recent Interviews, Right = Setup steps */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Interviews List */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Recent Mock Interviews</h3>
            {interviews.length > 0 && (
              <Link href="/interview" className="text-xs font-medium text-violet-400 hover:text-violet-300 flex items-center gap-1">
                View All
                <ChevronRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          {isLoading ? (
            <div className="glass-card rounded-xl p-12 border border-[var(--border)] flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
              <p className="text-sm text-zinc-500">Loading your history...</p>
            </div>
          ) : interviews.length === 0 ? (
            <div className="glass-card rounded-xl p-10 border border-[var(--border)] text-center flex flex-col items-center justify-center gap-4">
              <div className="p-4 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500">
                <Play className="h-8 w-8 text-zinc-600" />
              </div>
              <div>
                <h4 className="font-semibold text-[var(--foreground)]">No interviews recorded</h4>
                <p className="text-sm text-zinc-400 mt-1 max-w-sm mx-auto">
                  You haven&apos;t started any mock sessions yet. Complete your profile setup on the right to start.
                </p>
              </div>
              <Link
                href="/interview"
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs shadow-md"
              >
                Start First Interview
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {interviews.map((item: any) => {
                const isDone = item.status === "COMPLETED";
                const isDraft = item.status === "IN_PROGRESS" || item.status === "CREATED";

                return (
                  <motion.div
                    key={item.id}
                    whileHover={{ y: -2, scale: 1.01 }}
                    className="glass-card rounded-xl p-4 border border-[var(--border)] hover:border-zinc-700/60 transition-all flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`p-2.5 rounded-xl border shrink-0 ${
                          isDone
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                        }`}
                      >
                        {isDone ? (
                          <Award className="h-5 w-5" />
                        ) : (
                          <Clock className="h-5 w-5 animate-pulse" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm text-[var(--foreground)] truncate">
                            {item.interviewType} Interview #{item.id}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              isDone
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          {new Date(item.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isDone ? (
                        <Link
                          href={`/report/${item.id}`}
                          className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-200 hover:text-white transition-colors"
                        >
                          View Report
                        </Link>
                      ) : (
                        <Link
                          href={`/interview/${item.id}`}
                          className="px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white transition-colors flex items-center gap-1 shadow-sm"
                        >
                          Continue
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteInterview(item.id);
                        }}
                        disabled={deleteInterviewMutation.isPending}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/5 border border-transparent hover:border-red-500/10 transition-colors cursor-pointer"
                        title="Delete Session Record"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Setup Progress */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">Preparation Readiness</h3>

          <div className="glass-card rounded-xl p-5 border border-[var(--border)] flex flex-col gap-5">
            {/* Step 1: Upload Resume */}
            <div className="flex items-start gap-3.5">
              <div
                className={`p-2 rounded-lg border shrink-0 mt-0.5 ${
                  resumes.length > 0
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-zinc-900 border-zinc-800 text-zinc-500"
                }`}
              >
                <FileText className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <h5 className="text-sm font-semibold text-[var(--foreground)]">1. Upload Resume</h5>
                  {resumes.length > 0 && (
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Ready
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  {resumes.length > 0
                    ? `${resumes.length} resume(s) uploaded.`
                    : "Add your resume to enable personalized AI questions."}
                </p>
                <Link
                  href="/upload-resume"
                  className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-violet-400 hover:text-violet-300"
                >
                  {resumes.length > 0 ? "Manage Resumes" : "Upload Resume Now"}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            <div className="border-t border-zinc-900" />

            {/* Step 2: Configure Job Description */}
            <div className="flex items-start gap-3.5">
              <div
                className={`p-2 rounded-lg border shrink-0 mt-0.5 ${
                  jobs.length > 0
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-zinc-900 border-zinc-800 text-zinc-500"
                }`}
              >
                <Briefcase className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <h5 className="text-sm font-semibold text-[var(--foreground)]">2. Target Role Details</h5>
                  {jobs.length > 0 && (
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Ready
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  {jobs.length > 0
                    ? `${jobs.length} target role(s) configured.`
                    : "Paste a target job description for targeted matching."}
                </p>
                <Link
                  href="/job-description"
                  className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-violet-400 hover:text-violet-300"
                >
                  {jobs.length > 0 ? "Manage Target Jobs" : "Add Target Job"}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            <div className="border-t border-zinc-900" />

            {/* Step 3: Launch Interview */}
            <div className="flex items-start gap-3.5">
              <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 shrink-0 mt-0.5">
                <Play className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="text-sm font-semibold text-[var(--foreground)]">3. Start AI Simulation</h5>
                <p className="text-xs text-zinc-400 mt-1">
                  Generate structured interview questions and receive feedback.
                </p>
                <Link
                  href="/interview"
                  className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-colors shadow-md shadow-violet-600/20"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Launch Mock Track
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId !== null) {
            deleteInterviewMutation.mutate(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        title={`Delete Interview Session #${deleteTargetId}?`}
        description="Are you sure you want to delete this mock interview record? All associated questions, candidate answers, and evaluation reports will be permanently removed from database storage."
        confirmText="Delete Record"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteInterviewMutation.isPending}
      />
    </motion.div>
  );
}

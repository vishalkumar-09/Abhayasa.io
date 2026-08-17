"use client";

import React, { useState, useEffect } from "react";
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
  Loader2,
  Calendar,
  Trash2,
  CheckCircle2,
  ListChecks,
  Check
} from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export default function DashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 18) setGreeting("Good evening");
    else if (hour >= 12) setGreeting("Good afternoon");
    else setGreeting("Good morning");
  }, []);

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

  const activeInterviews = interviews.filter(
    (i: any) => i.status === "IN_PROGRESS" || i.status === "CREATED"
  );

  const recentInterviews = interviews.slice(0, 5);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-6 lg:gap-8"
    >
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-950/30 to-[#111827] rounded-xl p-6 md:p-8 border border-slate-800"
      >
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-slate-50">
            {greeting}, {user?.name}
          </h2>
          <p className="text-slate-400 mt-2 text-base">
            Ready to sharpen your interview performance?
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/interview"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm px-4 py-2.5 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Start Interview
            </Link>
            <Link
              href="/upload-resume"
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm px-4 py-2.5 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Manage Resumes
            </Link>
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
        <motion.div variants={itemVariants} className="bg-[#111827] rounded-xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Interviews</p>
            <h3 className="text-3xl font-bold mt-2 text-slate-100">{interviews.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center">
            <ListChecks className="h-6 w-6 text-indigo-400" />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-[#111827] rounded-xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Sessions</p>
            <h3 className="text-3xl font-bold mt-2 text-slate-100">{activeInterviews.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Clock className="h-6 w-6 text-amber-400" />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-[#111827] rounded-xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resumes</p>
            <h3 className="text-3xl font-bold mt-2 text-slate-100">{resumes.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-lg bg-sky-500/10 flex items-center justify-center">
            <FileText className="h-6 w-6 text-sky-400" />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-[#111827] rounded-xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Jobs Configured</p>
            <h3 className="text-3xl font-bold mt-2 text-slate-100">{jobs.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Briefcase className="h-6 w-6 text-emerald-400" />
          </div>
        </motion.div>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Interviews */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-100">Recent Interviews</h3>
            {interviews.length > 0 && (
              <Link href="/interviews" className="text-sm text-indigo-400 hover:text-indigo-300">
                View All
              </Link>
            )}
          </div>

          <div className="bg-[#111827] rounded-xl border border-slate-800 overflow-hidden flex flex-col">
            {loadingInterviews ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between gap-4 animate-pulse">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-800 rounded-lg"></div>
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-slate-800 rounded"></div>
                        <div className="h-3 w-20 bg-slate-800 rounded"></div>
                      </div>
                    </div>
                    <div className="h-8 w-24 bg-slate-800 rounded"></div>
                  </div>
                ))}
              </div>
            ) : recentInterviews.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                  <Play className="h-8 w-8 text-slate-500" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-slate-200">No interviews recorded</h4>
                  <p className="text-sm text-slate-400 mt-1 max-w-sm">
                    You haven&apos;t started any mock sessions yet. Complete your profile setup to start.
                  </p>
                </div>
                <Link
                  href="/interview"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm px-4 py-2.5 rounded-lg transition-colors inline-flex items-center gap-2 mt-2"
                >
                  Start Interview
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {recentInterviews.map((item: any) => {
                  const isDone = item.status === "COMPLETED";
                  return (
                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-800/20 transition-colors">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${item.interviewType === 'TECHNICAL' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                          {item.interviewType === 'TECHNICAL' ? 'Tech' : 'HR'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm text-slate-200 truncate flex items-center gap-2">
                            Interview #{item.id}
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${isDone ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                              {item.status}
                            </span>
                          </h4>
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {isDone ? (
                          <Link
                            href={`/report/${item.id}`}
                            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm px-3 py-1.5 rounded-lg transition-colors"
                          >
                            View Report
                          </Link>
                        ) : (
                          <Link
                            href={`/interview/${item.id}`}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                          >
                            Continue
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Setup Progress */}
        <div className="flex flex-col gap-4">
          <h3 className="text-xl font-semibold text-slate-100">Get Started</h3>

          <div className="bg-[#111827] rounded-xl border border-slate-800 p-5 flex flex-col gap-6">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="shrink-0 pt-1">
                {resumes.length > 0 ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check className="h-4 w-4 text-emerald-400" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border border-slate-700 flex items-center justify-center">
                    <span className="text-xs text-slate-500">1</span>
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-200">Upload Resume</h4>
                <p className="text-xs text-slate-400 mt-1 mb-2">Upload your PDF resume to personalize questions.</p>
                <Link href="/upload-resume" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1">
                  {resumes.length > 0 ? "Manage Resumes" : "Upload Resume"}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            <div className="border-t border-slate-800"></div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="shrink-0 pt-1">
                {jobs.length > 0 ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check className="h-4 w-4 text-emerald-400" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border border-slate-700 flex items-center justify-center">
                    <span className="text-xs text-slate-500">2</span>
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-200">Configure Target Job</h4>
                <p className="text-xs text-slate-400 mt-1 mb-2">Paste a job description you want to practice for.</p>
                <Link href="/job-description" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1">
                  {jobs.length > 0 ? "Manage Jobs" : "Add Target Job"}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            <div className="border-t border-slate-800"></div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="shrink-0 pt-1">
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <Play className="h-3 w-3 text-indigo-400 ml-0.5" />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-200">Start Your Interview</h4>
                <p className="text-xs text-slate-400 mt-1 mb-3">Begin your AI-powered mock interview session.</p>
                <Link href="/interview" className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-3 py-2 rounded-lg transition-colors inline-flex items-center gap-2">
                  Launch Interview
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId !== null) {
            deleteInterviewMutation.mutate(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        title="Delete Interview Session?"
        description="Are you sure you want to delete this mock interview record? This action cannot be undone."
        confirmText="Delete Record"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteInterviewMutation.isPending}
      />
    </motion.div>
  );
}

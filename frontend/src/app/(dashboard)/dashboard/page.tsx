"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
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
  AlertCircle
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();

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
      return res.data;
    },
  });

  const isLoading = loadingResumes || loadingJobs || loadingInterviews;

  const completedInterviews = interviews.filter((i: any) => i.status === "COMPLETED");
  const activeInterviews = interviews.filter((i: any) => i.status === "IN_PROGRESS");

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-black p-6 md:p-8">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-violet-600/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Welcome back, <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">{user?.name}</span>!
          </h2>
          <p className="text-zinc-400 mt-2 text-sm md:text-base leading-relaxed">
            Ready to sharpen your interview performance? Upload your resume, add target job descriptions, and let our AI simulator evaluate your readiness for top-tier tech roles.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/interview"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-medium text-sm transition-all shadow-lg shadow-violet-600/20 cursor-pointer"
            >
              <Play className="h-4 w-4 fill-current" />
              New Mock Interview
            </Link>
            <Link
              href="/upload-resume"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white font-medium text-sm transition-all cursor-pointer"
            >
              <FileText className="h-4 w-4" />
              Manage Resumes
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Interviews attempted */}
        <div className="glass-card rounded-xl p-5 border border-zinc-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Interviews</p>
            <h3 className="text-2xl font-bold mt-1 text-white">{interviews.length}</h3>
          </div>
          <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/10">
            <Award className="h-5 w-5 text-violet-400" />
          </div>
        </div>

        {/* Stat 2: Active sessions */}
        <div className="glass-card rounded-xl p-5 border border-zinc-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Active Sessions</p>
            <h3 className="text-2xl font-bold mt-1 text-white">{activeInterviews.length}</h3>
          </div>
          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/10">
            <Clock className="h-5 w-5 text-yellow-400 animate-pulse" />
          </div>
        </div>

        {/* Stat 3: Resumes */}
        <div className="glass-card rounded-xl p-5 border border-zinc-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Resumes</p>
            <h3 className="text-2xl font-bold mt-1 text-white">{resumes.length}</h3>
          </div>
          <div className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/10">
            <FileText className="h-5 w-5 text-sky-400" />
          </div>
        </div>

        {/* Stat 4: Job Descriptions */}
        <div className="glass-card rounded-xl p-5 border border-zinc-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Jobs Configured</p>
            <h3 className="text-2xl font-bold mt-1 text-white">{jobs.length}</h3>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/10">
            <Briefcase className="h-5 w-5 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Main Grid: Left = Recent Interviews, Right = Setup steps */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Interviews List */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Recent Mock Interviews</h3>
            {interviews.length > 0 && (
              <Link href="/interview" className="text-xs font-medium text-violet-400 hover:text-violet-300 flex items-center gap-1">
                View All
                <ChevronRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          {isLoading ? (
            <div className="glass-card rounded-xl p-12 border border-zinc-800/80 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
              <p className="text-sm text-zinc-500">Loading your history...</p>
            </div>
          ) : interviews.length === 0 ? (
            <div className="glass-card rounded-xl p-10 border border-zinc-800/80 text-center flex flex-col items-center justify-center gap-4">
              <div className="p-4 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500">
                <Play className="h-8 w-8 text-zinc-600" />
              </div>
              <div>
                <h4 className="font-semibold text-white">No interviews recorded</h4>
                <p className="text-sm text-zinc-400 mt-1 max-w-sm mx-auto">
                  You haven&apos;t started any mock sessions yet. Complete your profile setup on the right to start.
                </p>
              </div>
              <Link
                href="/interview"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs transition-colors cursor-pointer"
              >
                Launch Simulator
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="glass-card rounded-xl border border-zinc-800/80 overflow-hidden divide-y divide-zinc-800/80">
              {interviews.slice(0, 5).map((interview: any) => {
                const isCompleted = interview.status === "COMPLETED";
                const isInProgress = interview.status === "IN_PROGRESS";
                
                // Find matching resume/job details if possible
                const matchedResume = resumes.find((r: any) => r.id === interview.resumeId);
                const matchedJob = jobs.find((j: any) => j.id === interview.jobDescriptionId);

                return (
                  <div key={interview.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-900/20 transition-colors">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-semibold text-white">
                          Session #{interview.id}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                            isCompleted
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                              : isInProgress
                              ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                              : "bg-zinc-500/10 border-zinc-500/20 text-zinc-400"
                          }`}
                        >
                          {interview.status}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-zinc-400">
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3 text-zinc-500" />
                          {matchedResume ? matchedResume.fileName : "Resume Profile"}
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3 text-zinc-500" />
                          {matchedJob ? matchedJob.title : "Target Role"}
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-zinc-500" />
                          {new Date(interview.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {isCompleted ? (
                        <Link
                          href={`/report/${interview.id}`}
                          className="px-4 py-2 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400 hover:bg-violet-600 hover:text-white font-medium text-xs transition-all cursor-pointer"
                        >
                          View Report
                        </Link>
                      ) : (
                        <Link
                          href={`/interview/${interview.id}`}
                          className="px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500 hover:text-black font-medium text-xs transition-all cursor-pointer"
                        >
                          Resume
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Setup Guide */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold text-white">Preparation checklist</h3>

          <div className="glass-card rounded-xl border border-zinc-800/80 p-5 flex flex-col gap-5">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
                resumes.length > 0
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                  : "bg-zinc-800 border border-zinc-700 text-zinc-400"
              }`}>
                {resumes.length > 0 ? "✓" : "1"}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-white">Upload your Resume</h4>
                <p className="text-xs text-zinc-400 mt-0.5 leading-normal">
                  Our system extracts your detailed skill profile automatically.
                </p>
                <Link
                  href="/upload-resume"
                  className="text-xs text-violet-400 hover:text-violet-300 font-medium inline-flex items-center gap-0.5 mt-2"
                >
                  Go to upload
                  <Plus className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
                jobs.length > 0
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                  : "bg-zinc-800 border border-zinc-700 text-zinc-400"
              }`}>
                {jobs.length > 0 ? "✓" : "2"}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-white">Add Job Description</h4>
                <p className="text-xs text-zinc-400 mt-0.5 leading-normal">
                  Paste the requirements of the job you are targeting.
                </p>
                <Link
                  href="/job-description"
                  className="text-xs text-violet-400 hover:text-violet-300 font-medium inline-flex items-center gap-0.5 mt-2"
                >
                  Configure job
                  <Plus className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
                interviews.length > 0
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                  : "bg-zinc-800 border border-zinc-700 text-zinc-400"
              }`}>
                {interviews.length > 0 ? "✓" : "3"}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-white">Launch Simulator</h4>
                <p className="text-xs text-zinc-400 mt-0.5 leading-normal">
                  RAG engine builds matching questions for live testing.
                </p>
                <Link
                  href="/interview"
                  className="text-xs text-violet-400 hover:text-violet-300 font-medium inline-flex items-center gap-0.5 mt-2"
                >
                  Start interview
                  <Play className="h-2.5 w-2.5 fill-current" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

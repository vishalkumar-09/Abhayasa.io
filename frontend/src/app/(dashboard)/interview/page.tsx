"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
  Play,
  FileText,
  Briefcase,
  AlertTriangle,
  Loader2,
  Calendar,
  ChevronRight,
  HelpCircle,
  Clock,
  CheckCircle
} from "lucide-react";

export default function InterviewLauncherPage() {
  const router = useRouter();
  const [selectedResumeId, setSelectedResumeId] = useState<number | "">("");
  const [selectedJobId, setSelectedJobId] = useState<number | "">("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  // Start interview mutation
  const startMutation = useMutation({
    mutationFn: async (req: { resumeId: number; jobDescriptionId: number }) => {
      const res = await apiClient.post("/api/v1/interviews", req);
      return res.data;
    },
    onSuccess: (data) => {
      // Redirect to the active interview page
      router.push(`/interview/${data.id}`);
    },
    onError: (err: any) => {
      console.error(err);
      setErrorMsg(err.response?.data?.message || "Failed to initialize interview session.");
    },
  });

  const handleLaunch = () => {
    setErrorMsg(null);
    if (!selectedResumeId) {
      setErrorMsg("Please select a resume profile.");
      return;
    }
    if (!selectedJobId) {
      setErrorMsg("Please select a target job description.");
      return;
    }

    startMutation.mutate({
      resumeId: Number(selectedResumeId),
      jobDescriptionId: Number(selectedJobId),
    });
  };

  const hasProfiles = resumes.length > 0 && jobs.length > 0;
  const isLoading = loadingResumes || loadingJobs || loadingInterviews;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Interview Simulator</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Launch a dedicated simulation session. The AI engine retrieves context from your resume and matches it with job requirements.
        </p>
      </div>

      {isLoading ? (
        <div className="glass-card rounded-2xl p-16 border border-zinc-800/80 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
          <p className="text-sm text-zinc-500">Retrieving configuration settings...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Launcher Form */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-zinc-300">Launch Setup</h3>

            {errorMsg && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs animate-in fade-in duration-200">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <p className="flex-1">{errorMsg}</p>
              </div>
            )}

            {!hasProfiles ? (
              <div className="glass-card rounded-2xl p-5 border border-zinc-800/80 flex flex-col gap-4 text-center">
                <div className="p-3.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 mx-auto">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Requirements Missing</h4>
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                    You need to upload at least one resume and configure one job description before starting a mock session.
                  </p>
                </div>
                <div className="flex flex-col gap-2.5 mt-2">
                  {resumes.length === 0 && (
                    <Link
                      href="/upload-resume"
                      className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs transition-colors"
                    >
                      Upload Resume
                    </Link>
                  )}
                  {jobs.length === 0 && (
                    <Link
                      href="/job-description"
                      className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition-colors"
                    >
                      Add Job Description
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="glass-card rounded-2xl p-5 border border-zinc-800/80 flex flex-col gap-5">
                {/* Resume Selection */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="resume" className="text-xs font-medium text-zinc-300">
                    Select Resume Profile
                  </label>
                  <select
                    id="resume"
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm outline-none focus:border-violet-500 transition-all cursor-pointer"
                  >
                    <option value="">-- Choose Resume --</option>
                    {resumes.map((r: any) => (
                      <option key={r.id} value={r.id}>
                        {r.fileName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Job Description Selection */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="job" className="text-xs font-medium text-zinc-300">
                    Select Target Job
                  </label>
                  <select
                    id="job"
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm outline-none focus:border-violet-500 transition-all cursor-pointer"
                  >
                    <option value="">-- Choose Target Job --</option>
                    {jobs.map((j: any) => (
                      <option key={j.id} value={j.id}>
                        {j.title} {j.companyName ? `at ${j.companyName}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Launch Button */}
                <button
                  onClick={handleLaunch}
                  disabled={startMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-violet-600/25"
                >
                  {startMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating Questions...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-current" />
                      Launch AI Simulator
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Historic sessions */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-zinc-300">Your Simulator History</h3>

            {interviews.length === 0 ? (
              <div className="glass-card rounded-2xl p-10 border border-zinc-800/80 text-center flex flex-col items-center justify-center gap-3">
                <HelpCircle className="h-8 w-8 text-zinc-600" />
                <h4 className="font-semibold text-zinc-400">No mock sessions found</h4>
                <p className="text-xs text-zinc-500 max-w-sm">
                  Once you start a simulation, it will list here. You can pause sessions and resume them anytime.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {interviews.map((session: any) => {
                  const isCompleted = session.status === "COMPLETED";
                  const isInProgress = session.status === "IN_PROGRESS";
                  
                  const rProfile = resumes.find((r: any) => r.id === session.resumeId);
                  const jProfile = jobs.find((j: any) => j.id === session.jobDescriptionId);

                  return (
                    <div
                      key={session.id}
                      className="glass-card rounded-2xl p-5 border border-zinc-800/80 hover:border-zinc-700/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm font-semibold text-white">
                            Session #{session.id}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[9px] font-semibold tracking-wide border ${
                              isCompleted
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                : isInProgress
                                ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                                : "bg-zinc-500/10 border-zinc-500/20 text-zinc-400"
                            }`}
                          >
                            {session.status}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1.5 flex flex-wrap gap-x-2 gap-y-1">
                          <span className="text-zinc-300 font-medium">
                            Target: {jProfile ? jProfile.title : "Not specified"}
                          </span>
                          <span className="text-zinc-600">|</span>
                          <span>Resume: {rProfile ? rProfile.fileName : "Not specified"}</span>
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-0.5 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Created on {new Date(session.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {isCompleted ? (
                          <Link
                            href={`/report/${session.id}`}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400 hover:bg-violet-600 hover:text-white font-semibold text-xs transition-all cursor-pointer"
                          >
                            View Feedback
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        ) : (
                          <Link
                            href={`/interview/${session.id}`}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500 hover:text-black font-semibold text-xs transition-all cursor-pointer"
                          >
                            Resume Session
                            <ChevronRight className="h-3.5 w-3.5" />
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
      )}
    </div>
  );
}

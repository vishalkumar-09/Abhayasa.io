"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
  FileText,
  Briefcase,
  AlertTriangle,
  Loader2,
  Calendar,
  Check,
  ChevronRight,
  ArrowRight,
  Users
} from "lucide-react";
import { motion } from "framer-motion";

export default function InterviewLauncherPage() {
  const router = useRouter();
  const [selectedResumeId, setSelectedResumeId] = useState<number | "">("");
  const [selectedJobId, setSelectedJobId] = useState<number | "">("");
  const [interviewType, setInterviewType] = useState<"TECHNICAL" | "HR">("TECHNICAL");
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
    mutationFn: async (req: { resumeId: number; jobDescriptionId: number; interviewType: string }) => {
      const res = await apiClient.post("/api/v1/interviews", {
        resumeId: req.resumeId,
        jobDescriptionId: req.jobDescriptionId,
        interviewType: req.interviewType,
      });
      return res.data;
    },
    onSuccess: (data) => {
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
      interviewType: interviewType,
    });
  };

  const isLoading = loadingResumes || loadingJobs || loadingInterviews;

  const selectedResume = resumes.find((r: any) => r.id === selectedResumeId);
  const selectedJob = jobs.find((j: any) => j.id === selectedJobId);

  const inProgressInterviews = interviews.filter((i: any) => i.status === "IN_PROGRESS");

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-[#0a0f1e]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-sm text-slate-400">Loading configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-[#0a0f1e] lg:flex-row">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-10">
        <div className="mx-auto max-w-3xl space-y-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-50">Interview Setup</h1>
            <p className="mt-2 text-sm text-slate-400">
              Configure your mock interview session. The AI will tailor questions to your profile and the role.
            </p>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-3 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p>{errorMsg}</p>
            </div>
          )}

          {/* Section 1: Resume */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                  1
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">Select Your Resume</h2>
                  <p className="text-xs text-slate-400">AI will personalize questions based on your selected resume</p>
                </div>
              </div>
              <Link href="/upload-resume" className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                Manage Resumes &rarr;
              </Link>
            </div>

            {resumes.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-[#111827] p-8 text-center">
                <FileText className="mx-auto h-8 w-8 text-slate-600" />
                <h3 className="mt-4 text-sm font-medium text-slate-200">No resumes uploaded</h3>
                <p className="mt-1 text-xs text-slate-500">Upload a resume to get started</p>
                <Link
                  href="/upload-resume"
                  className="mt-4 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
                >
                  Upload Resume
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {resumes.map((r: any) => {
                  const isSelected = selectedResumeId === r.id;
                  const skills = r.skills || [];
                  const displaySkills = skills.slice(0, 5);
                  const extraSkills = skills.length - 5;
                  
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelectedResumeId(r.id)}
                      className={`relative flex flex-col items-start rounded-xl border p-4 text-left transition-all ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500"
                          : "border-slate-800 bg-[#111827] hover:border-slate-700 hover:bg-[#111827]/80"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute right-3 top-3 text-indigo-500">
                          <Check className="h-5 w-5" />
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <FileText className={`h-4 w-4 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                        <span className="font-medium text-slate-200 line-clamp-1 pr-6">{r.fileName}</span>
                      </div>
                      <span className="mt-1 text-xs text-slate-500">
                        Uploaded {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                      {skills.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {displaySkills.map((s: string) => (
                            <span key={s} className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                              {s}
                            </span>
                          ))}
                          {extraSkills > 0 && (
                            <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                              +{extraSkills} more
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Section 2: Job */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                  2
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">Select Target Role</h2>
                  <p className="text-xs text-slate-400">Questions will be tailored to this job description</p>
                </div>
              </div>
              <Link href="/job-description" className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                Manage Jobs &rarr;
              </Link>
            </div>

            {jobs.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-[#111827] p-8 text-center">
                <Briefcase className="mx-auto h-8 w-8 text-slate-600" />
                <h3 className="mt-4 text-sm font-medium text-slate-200">No jobs added</h3>
                <p className="mt-1 text-xs text-slate-500">Add a job description to continue</p>
                <Link
                  href="/job-description"
                  className="mt-4 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
                >
                  Add Job Description
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {jobs.map((j: any) => {
                  const isSelected = selectedJobId === j.id;
                  const skills = j.skillsRequired || [];
                  const displaySkills = skills.slice(0, 5);
                  const extraSkills = skills.length - 5;
                  
                  return (
                    <button
                      key={j.id}
                      onClick={() => setSelectedJobId(j.id)}
                      className={`relative flex flex-col items-start rounded-xl border p-4 text-left transition-all ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500"
                          : "border-slate-800 bg-[#111827] hover:border-slate-700 hover:bg-[#111827]/80"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute right-3 top-3 text-indigo-500">
                          <Check className="h-5 w-5" />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-200 line-clamp-1 pr-6">{j.title}</span>
                        {j.companyName && (
                          <span className="mt-0.5 text-xs text-slate-400">{j.companyName}</span>
                        )}
                      </div>
                      {skills.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {displaySkills.map((s: string) => (
                            <span key={s} className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                              {s}
                            </span>
                          ))}
                          {extraSkills > 0 && (
                            <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                              +{extraSkills} more
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Section 3: Interview Type */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                3
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-100">Interview Type</h2>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <button
                onClick={() => setInterviewType("TECHNICAL")}
                className={`flex flex-col items-start rounded-xl border p-4 text-left transition-all ${
                  interviewType === "TECHNICAL"
                    ? "border-indigo-500 bg-indigo-600 text-white"
                    : "border-slate-800 bg-[#111827] text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`rounded-md p-1.5 ${interviewType === "TECHNICAL" ? "bg-white/20" : "bg-slate-800"}`}>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                  <span className="font-semibold">Technical Interview</span>
                </div>
                <p className={`mt-2 text-xs leading-relaxed ${interviewType === "TECHNICAL" ? "text-indigo-100" : "text-slate-500"}`}>
                  Deep dive into algorithms, system design, and coding concepts based on job requirements.
                </p>
              </button>

              <button
                onClick={() => setInterviewType("HR")}
                className={`flex flex-col items-start rounded-xl border p-4 text-left transition-all ${
                  interviewType === "HR"
                    ? "border-indigo-500 bg-indigo-600 text-white"
                    : "border-slate-800 bg-[#111827] text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`rounded-md p-1.5 ${interviewType === "HR" ? "bg-white/20" : "bg-slate-800"}`}>
                    <Users className="h-4 w-4" />
                  </div>
                  <span className="font-semibold">HR Interview</span>
                </div>
                <p className={`mt-2 text-xs leading-relaxed ${interviewType === "HR" ? "text-indigo-100" : "text-slate-500"}`}>
                  Behavioral, situational, and cultural fit questions to assess soft skills and experience.
                </p>
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Right Sidebar - Summary */}
      <div className="w-full border-l border-slate-800 bg-[#0d1525] p-6 lg:w-[400px] lg:shrink-0 lg:p-8">
        <div className="sticky top-8 space-y-8">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-100">Interview Summary</h2>
            
            <div className="rounded-xl border border-slate-800 bg-[#111827] p-5 space-y-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Selected Resume</span>
                <p className="mt-1 text-sm font-medium text-slate-200">
                  {selectedResume ? selectedResume.fileName : <span className="text-slate-500">— Select a resume</span>}
                </p>
              </div>
              
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Target Role</span>
                <p className="mt-1 text-sm font-medium text-slate-200">
                  {selectedJob ? (
                    <span>{selectedJob.title} {selectedJob.companyName && <span className="text-slate-400 font-normal">at {selectedJob.companyName}</span>}</span>
                  ) : (
                    <span className="text-slate-500">— Select a role</span>
                  )}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Type</span>
                <div className="mt-1">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    interviewType === "TECHNICAL" ? "bg-indigo-500/10 text-indigo-400" : "bg-emerald-500/10 text-emerald-400"
                  }`}>
                    {interviewType}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Questions will be generated using your selected resume and job description. Ensure they match your goals.
            </p>

            <button
              onClick={handleLaunch}
              disabled={startMutation.isPending || !selectedResumeId || !selectedJobId}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
            >
              {startMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Preparing Session...
                </>
              ) : (
                <>
                  Start Interview <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          {inProgressInterviews.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Sessions</h3>
              <div className="space-y-3">
                {inProgressInterviews.map((session: any) => (
                  <div key={session.id} className="rounded-xl border border-slate-800 bg-[#111827] p-4 flex flex-col gap-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-200">Session #{session.id}</span>
                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                          In Progress
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(session.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Link
                      href={`/interview/${session.id}`}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700"
                    >
                      Continue <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

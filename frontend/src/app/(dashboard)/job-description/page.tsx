"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
  Briefcase,
  Building,
  Plus,
  Trash2,
  Loader2,
  CheckCircle,
  AlertCircle,
  Tag,
  AlignLeft
} from "lucide-react";

export default function JobDescriptionPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: "",
    companyName: "",
    rawText: "",
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Query: Get user's configured job descriptions
  const { data: jobs = [], isLoading: loadingJobs } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const res = await apiClient.get("/api/v1/job-descriptions");
      return res.data;
    },
  });

  // Mutation: Create job description
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiClient.post("/api/v1/job-descriptions", data);
      return res.data;
    },
    onSuccess: () => {
      setSuccessMsg("Job description saved and analyzed!");
      setFormData({ title: "", companyName: "", rawText: "" });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setTimeout(() => setSuccessMsg(null), 3000);
    },
    onError: (err: any) => {
      console.error(err);
      setErrorMsg(err.response?.data?.message || "Failed to save job description.");
      setTimeout(() => setErrorMsg(null), 4000);
    },
  });

  // Mutation: Delete job description
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/v1/job-descriptions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (err: any) => {
      console.error(err);
      setErrorMsg("Failed to delete job description.");
      setTimeout(() => setErrorMsg(null), 3000);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!formData.title.trim()) {
      setErrorMsg("Job Title is required");
      return;
    }
    if (!formData.rawText.trim()) {
      setErrorMsg("Job Description text is required");
      return;
    }

    createMutation.mutate(formData);
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Target Job Descriptions</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Add the descriptions of the roles you are applying for. The simulator will structure its evaluation based on these requirements.
        </p>
      </div>

      {/* Main Grid: Form Left, List Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form panel */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-zinc-300">Add New Job Description</h3>

          {errorMsg && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs animate-in fade-in duration-200">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="flex-1">{errorMsg}</p>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs animate-in fade-in duration-200">
              <CheckCircle className="h-5 w-5 shrink-0" />
              <p className="flex-1">{successMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-5 border border-zinc-800/80 flex flex-col gap-4">
            {/* Job Title */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="title" className="text-xs font-medium text-zinc-300">
                Job Title *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500 pointer-events-none">
                  <Briefcase className="h-4 w-4" />
                </span>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Senior Software Engineer"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-950/50 border border-zinc-800 text-white placeholder-zinc-500 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                />
              </div>
            </div>

            {/* Company Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="companyName" className="text-xs font-medium text-zinc-300">
                Company Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500 pointer-events-none">
                  <Building className="h-4 w-4" />
                </span>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="e.g. Google (optional)"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-950/50 border border-zinc-800 text-white placeholder-zinc-500 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                />
              </div>
            </div>

            {/* Raw Text */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="rawText" className="text-xs font-medium text-zinc-300">
                Job Description Details *
              </label>
              <div className="relative">
                <span className="absolute top-3 left-3 text-zinc-500 pointer-events-none">
                  <AlignLeft className="h-4 w-4" />
                </span>
                <textarea
                  id="rawText"
                  name="rawText"
                  required
                  rows={8}
                  value={formData.rawText}
                  onChange={handleChange}
                  placeholder="Paste the job requirements, responsibilities, and qualifications here..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-950/50 border border-zinc-800 text-white placeholder-zinc-500 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all resize-y min-h-[160px]"
                />
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-violet-600/25"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Job...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Save Job Description
                </>
              )}
            </button>
          </form>
        </div>

        {/* List panel */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-zinc-300">Configured Jobs ({jobs.length})</h3>

          {loadingJobs ? (
            <div className="glass-card rounded-xl p-12 border border-zinc-800/80 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
              <p className="text-sm text-zinc-500">Retrieving jobs...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 border border-zinc-800/80 text-center flex flex-col items-center justify-center gap-3">
              <div className="p-4 rounded-full bg-zinc-900 border border-zinc-850 text-zinc-600">
                <Briefcase className="h-8 w-8" />
              </div>
              <h4 className="font-semibold text-zinc-400">No jobs configured yet</h4>
              <p className="text-xs text-zinc-500 max-w-sm">
                Add target job descriptions on the left. This will align the AI simulator to ask highly contextual questions matching these role requirements.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {jobs.map((job: any) => (
                <div
                  key={job.id}
                  className="glass-card rounded-2xl p-5 border border-zinc-800/80 hover:border-zinc-700/60 transition-all flex flex-col gap-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="p-3 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400">
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-white truncate max-w-xs sm:max-w-md">
                          {job.title}
                        </h4>
                        {job.companyName && (
                          <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
                            <Building className="h-3.5 w-3.5 text-zinc-500" />
                            {job.companyName}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Are you sure you want to delete ${job.title}?`)) {
                          deleteMutation.mutate(job.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/5 border border-transparent hover:border-red-500/10 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>

                  {/* Skills tags parsed */}
                  {job.skillsRequired && job.skillsRequired.length > 0 && (
                    <div className="flex flex-col gap-2 border-t border-zinc-900 pt-3">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                        <Tag className="h-3 w-3 text-zinc-500" />
                        Target Skills Identified:
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {job.skillsRequired.map((skill: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-medium text-zinc-300"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

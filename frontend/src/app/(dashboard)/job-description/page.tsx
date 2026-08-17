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
  Calendar
} from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { motion } from "framer-motion";

export default function JobDescriptionPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: "",
    companyName: "",
    rawText: "",
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deleteTargetJob, setDeleteTargetJob] = useState<{ id: number; title: string } | null>(null);

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
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-50">Target Roles</h1>
        <p className="text-sm text-slate-400 mt-2">
          Add job descriptions to practice for specific roles. We&apos;ll tailor the interview questions to match.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Form */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <h3 className="text-lg font-semibold text-slate-100">Add Target Role</h3>

          {errorMsg && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="flex-1">{errorMsg}</p>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
              <CheckCircle className="h-5 w-5 shrink-0" />
              <p className="flex-1">{successMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-[#111827] rounded-xl border border-slate-800 p-5 flex flex-col gap-4">
            <div className="space-y-1.5">
              <label htmlFor="title" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Job Title *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Senior Frontend Engineer"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="companyName" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Company Name
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="e.g. Acme Corp (optional)"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="rawText" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Job Description *
              </label>
              <textarea
                id="rawText"
                name="rawText"
                required
                value={formData.rawText}
                onChange={handleChange}
                placeholder="Paste the full job description here..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all min-h-[160px] resize-y"
              />
            </div>

            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 mt-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
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

        {/* Right: List */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h3 className="text-lg font-semibold text-slate-100">Your Target Roles</h3>

          {loadingJobs ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-[#111827] rounded-xl border border-slate-800 p-5 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-slate-800 rounded"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-1/3 bg-slate-800 rounded"></div>
                      <div className="h-3 w-1/4 bg-slate-800 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-[#111827] rounded-xl border border-slate-800 p-12 text-center flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                <Briefcase className="h-8 w-8" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-slate-200">No roles configured yet</h4>
                <p className="text-sm text-slate-400 mt-1">Add a target role on the left to start practicing.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {jobs.map((job: any) => (
                <div
                  key={job.id}
                  className="bg-[#111827] rounded-xl border border-slate-800 p-5 flex flex-col gap-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded bg-indigo-500/10 flex items-center justify-center shrink-0">
                        <Briefcase className="h-5 w-5 text-indigo-400" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-base text-slate-100 truncate">
                          {job.title}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          {job.companyName && (
                            <p className="text-sm text-slate-400 flex items-center gap-1.5 truncate">
                              <Building className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                              {job.companyName}
                            </p>
                          )}
                          <p className="text-sm text-slate-500 flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                            {new Date(job.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setDeleteTargetJob({ id: job.id, title: job.title })}
                      className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                      title="Delete Role"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {job.skillsRequired && job.skillsRequired.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {job.skillsRequired.slice(0, 5).map((skill: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300"
                        >
                          {skill}
                        </span>
                      ))}
                      {job.skillsRequired.length > 5 && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-800 text-slate-500">
                          +{job.skillsRequired.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteTargetJob !== null}
        onClose={() => setDeleteTargetJob(null)}
        onConfirm={() => {
          if (deleteTargetJob) {
            deleteMutation.mutate(deleteTargetJob.id);
            setDeleteTargetJob(null);
          }
        }}
        title={`Delete "${deleteTargetJob?.title}"?`}
        description="Are you sure you want to delete this target role? You can add it back later if needed."
        confirmText="Delete Role"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

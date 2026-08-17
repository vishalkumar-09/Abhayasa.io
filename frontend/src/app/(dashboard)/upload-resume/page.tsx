"use client";

import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
  UploadCloud,
  FileText,
  Trash2,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileBox,
} from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { motion } from "framer-motion";

export default function UploadResumePage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deleteTargetResume, setDeleteTargetResume] = useState<{ id: number; name: string } | null>(null);

  // Query: Get user resumes
  const { data: resumes = [], isLoading: loadingResumes } = useQuery({
    queryKey: ["resumes"],
    queryFn: async () => {
      const res = await apiClient.get("/api/v1/resumes");
      return res.data;
    },
  });

  // Mutation: Upload resume
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiClient.post("/api/v1/resumes/upload", formData);
      return res.data;
    },
    onSuccess: () => {
      setSuccessMsg("Resume uploaded and parsed successfully!");
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTimeout(() => setSuccessMsg(null), 3000);
    },
    onError: (err: any) => {
      console.error(err);
      setErrorMsg(err.response?.data?.message || "Failed to upload and parse resume. Please ensure it is a valid PDF.");
    },
  });

  // Mutation: Delete resume
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/v1/resumes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
    },
    onError: (err: any) => {
      console.error(err);
      setErrorMsg("Failed to delete resume.");
    },
  });

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndUpload(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (e.target.files && e.target.files[0]) {
      validateAndUpload(e.target.files[0]);
    }
  };

  const validateAndUpload = (file: File) => {
    if (file.type !== "application/pdf") {
      setErrorMsg("Invalid file type. Please upload a PDF file.");
      return;
    }
    // Limit file size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("File size exceeds the 5MB limit.");
      return;
    }

    uploadMutation.mutate(file);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-50">Resume Management</h1>
        <p className="text-sm text-slate-400 mt-2">
          Upload your resume to personalize your mock interview sessions with our AI.
        </p>
      </div>

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

      {/* Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`bg-[#111827] border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
          dragActive
            ? "border-indigo-500 bg-indigo-500/5"
            : uploadMutation.isPending
            ? "border-slate-800 opacity-75 cursor-not-allowed"
            : "border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800/30"
        }`}
        onClick={() => !uploadMutation.isPending && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          accept=".pdf"
          className="hidden"
          disabled={uploadMutation.isPending}
        />

        {uploadMutation.isPending ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
            <div>
              <h4 className="font-semibold text-slate-200 text-sm">Uploading and Parsing...</h4>
              <p className="text-xs text-slate-500 mt-1">Please wait while we extract your skills.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
              <UploadCloud className="h-8 w-8" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-200 text-sm">Drop your PDF resume here, or click to browse</h4>
              <p className="text-xs text-slate-500 mt-1">
                Max 5MB • PDF format only
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Resumes List */}
      <div>
        <h3 className="text-xl font-semibold text-slate-100 mb-4">Your Resumes</h3>
        
        {loadingResumes ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-[#111827] rounded-xl border border-slate-800 p-5 flex flex-col gap-4 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-slate-800 rounded"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-3/4 bg-slate-800 rounded"></div>
                    <div className="h-3 w-1/2 bg-slate-800 rounded"></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-6 w-16 bg-slate-800 rounded-full"></div>
                  <div className="h-6 w-16 bg-slate-800 rounded-full"></div>
                  <div className="h-6 w-16 bg-slate-800 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : resumes.length === 0 ? (
          <div className="bg-[#111827] rounded-xl border border-slate-800 p-12 text-center flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
              <FileBox className="h-8 w-8" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-slate-200">No resumes uploaded yet</h4>
              <p className="text-sm text-slate-400 mt-1">Upload your first resume above to get started.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {resumes.map((resume: any) => (
              <div
                key={resume.id}
                className="bg-[#111827] rounded-xl border border-slate-800 p-5 flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded bg-red-500/10 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm text-slate-200 truncate" title={resume.fileName}>
                        {resume.fileName}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(resume.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDeleteTargetResume({ id: resume.id, name: resume.fileName })}
                    className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                    title="Delete Resume"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {resume.skills && resume.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {resume.skills.slice(0, 6).map((skill: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300"
                      >
                        {skill}
                      </span>
                    ))}
                    {resume.skills.length > 6 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400">
                        +{resume.skills.length - 6} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteTargetResume !== null}
        onClose={() => setDeleteTargetResume(null)}
        onConfirm={() => {
          if (deleteTargetResume) {
            deleteMutation.mutate(deleteTargetResume.id);
            setDeleteTargetResume(null);
          }
        }}
        title={`Delete "${deleteTargetResume?.name}"?`}
        description="Are you sure you want to delete this resume? It will be removed from your profile."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </motion.div>
  );
}

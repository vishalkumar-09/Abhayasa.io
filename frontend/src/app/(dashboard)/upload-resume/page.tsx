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
  ShieldCheck,
  Tag
} from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { motion } from "framer-motion";

export default function UploadResumePage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
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
      const res = await apiClient.post("/api/v1/resumes/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data;
    },
    onSuccess: () => {
      setSuccessMsg("Resume uploaded and parsed successfully!");
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (err: any) => {
      console.error(err);
      setErrorMsg(err.response?.data?.message || "Failed to upload and parse resume. Please ensure it is a valid PDF/Docx file.");
      setUploadProgress(null);
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
    const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
    if (!validTypes.includes(file.type)) {
      setErrorMsg("Invalid file type. Please upload a PDF, Docx, or txt file.");
      return;
    }
    // Limit file size to 10MB
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("File size exceeds the 10MB limit.");
      return;
    }

    setUploadProgress(20);
    uploadMutation.mutate(file);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Manage Resumes</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Upload your resume files. Our Gemini AI parses them to build context for your mock interview sessions.
        </p>
      </div>

      {/* Upload zone & Alert messages */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-zinc-300">Upload New Resume</h3>
          
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

          {/* Drag & Drop Card */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`glass-card rounded-2xl p-8 border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer min-h-[280px] transition-all relative ${
              dragActive
                ? "border-violet-500 bg-violet-600/5 scale-[1.01]"
                : uploadMutation.isPending
                ? "border-zinc-800 bg-zinc-950/20 opacity-80 cursor-wait"
                : "border-zinc-800 hover:border-zinc-700 bg-zinc-950/40"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.docx,.txt"
              className="hidden"
              disabled={uploadMutation.isPending}
            />

            {uploadMutation.isPending ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 text-violet-500 animate-spin" />
                <div>
                  <h4 className="font-semibold text-white">Parsing with Gemini...</h4>
                  <p className="text-xs text-zinc-500 mt-1">This will take about 5-15 seconds.</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:text-white transition-colors">
                  <UploadCloud className="h-8 w-8" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">Click or drag file to upload</h4>
                  <p className="text-xs text-zinc-500 mt-1 leading-normal max-w-[200px] mx-auto">
                    Supports PDF, DOCX or TXT files up to 10MB
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resumes List */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-zinc-300">Parsed Resumes ({resumes.length})</h3>

          {loadingResumes ? (
            <div className="glass-card rounded-xl p-12 border border-zinc-800/80 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
              <p className="text-sm text-zinc-500">Retrieving resumes...</p>
            </div>
          ) : resumes.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 border border-zinc-800/80 text-center flex flex-col items-center justify-center gap-3">
              <div className="p-4 rounded-full bg-zinc-900 border border-zinc-850 text-zinc-600">
                <FileText className="h-8 w-8" />
              </div>
              <h4 className="font-semibold text-zinc-400">No resumes uploaded yet</h4>
              <p className="text-xs text-zinc-500 max-w-sm">
                Add your resume above to enable AI-tailored question generation based on your actual skills and experiences.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {resumes.map((resume: any) => (
                <div
                  key={resume.id}
                  className="glass-card rounded-2xl p-5 border border-zinc-800/80 hover:border-zinc-700/60 transition-all flex flex-col gap-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="p-3 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-white truncate max-w-xs sm:max-w-md">
                          {resume.fileName}
                        </h4>
                        <p className="text-xs text-zinc-500 mt-1">
                          Uploaded on {new Date(resume.createdAt).toLocaleDateString(undefined, {
                            month: "long",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTargetResume({ id: resume.id, name: resume.fileName });
                      }}
                      disabled={deleteMutation.isPending}
                      className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/5 border border-transparent hover:border-red-500/10 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>

                  {/* Skills tags parsed */}
                  {resume.skills && resume.skills.length > 0 && (
                    <div className="flex flex-col gap-2 border-t border-zinc-900 pt-3">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                        <Tag className="h-3 w-3 text-zinc-500" />
                        Skills Extracted:
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {resume.skills.map((skill: string, index: number) => (
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
      {/* Delete Confirmation Modal */}
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
        description="Are you sure you want to delete this resume? It will be removed from your profile and will no longer be used for AI question tailoring."
        confirmText="Delete Resume"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </motion.div>
  );
}

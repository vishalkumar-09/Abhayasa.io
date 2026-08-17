"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { motion } from "framer-motion";
import {
  ListChecks,
  Play,
  Calendar,
  Trash2,
  FileText,
  SearchX
} from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

type FilterStatus = "ALL" | "COMPLETED" | "ACTIVE";

export default function MyInterviewsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const { data: interviews = [], isLoading } = useQuery({
    queryKey: ['interviews'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/interviews');
      const list = res.data || [];
      return [...list].sort((a: any, b: any) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (timeB !== timeA) return timeB - timeA;
        return (b.id || 0) - (a.id || 0);
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete(`/api/v1/interviews/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      setDeleteTargetId(null);
    },
  });

  const filteredInterviews = interviews.filter((item: any) => {
    if (filterStatus === "ALL") return true;
    if (filterStatus === "COMPLETED") return item.status === "COMPLETED";
    if (filterStatus === "ACTIVE") return item.status === "IN_PROGRESS" || item.status === "CREATED";
    return true;
  });

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-50">My Interviews</h1>
        <p className="text-sm text-slate-400 mt-2">
          Review your interview history and access reports
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
        <button
          onClick={() => setFilterStatus("ALL")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            filterStatus === "ALL"
              ? "bg-indigo-600/10 text-indigo-400"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterStatus("ACTIVE")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            filterStatus === "ACTIVE"
              ? "bg-indigo-600/10 text-indigo-400"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilterStatus("COMPLETED")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            filterStatus === "COMPLETED"
              ? "bg-indigo-600/10 text-indigo-400"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          Completed
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-[#111827] rounded-xl border border-slate-800 p-5 flex items-center justify-between gap-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-16 h-8 bg-slate-800 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 w-40 bg-slate-800 rounded"></div>
                  <div className="h-3 w-24 bg-slate-800 rounded"></div>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-24 h-9 bg-slate-800 rounded-lg"></div>
                <div className="w-9 h-9 bg-slate-800 rounded-lg"></div>
              </div>
            </div>
          ))
        ) : interviews.length === 0 ? (
          <div className="bg-[#111827] rounded-xl border border-slate-800 p-12 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
              <ListChecks className="h-8 w-8 text-slate-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-200">No interviews yet</h3>
              <p className="text-sm text-slate-400 mt-1">Start a mock interview to see it here.</p>
            </div>
            <Link
              href="/interview"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm px-4 py-2.5 rounded-lg transition-colors mt-2"
            >
              Start your first interview
            </Link>
          </div>
        ) : filteredInterviews.length === 0 ? (
          <div className="bg-[#111827] rounded-xl border border-slate-800 p-12 flex flex-col items-center justify-center text-center gap-4">
            <SearchX className="h-10 w-10 text-slate-500" />
            <h3 className="text-lg font-semibold text-slate-200">No {filterStatus.toLowerCase()} interviews found</h3>
          </div>
        ) : (
          filteredInterviews.map((item: any) => {
            const isDone = item.status === "COMPLETED";
            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={item.id}
                className="bg-[#111827] rounded-xl border border-slate-800 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`shrink-0 inline-flex items-center justify-center w-16 py-1 rounded-full text-xs font-medium ${item.interviewType === 'TECHNICAL' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {item.interviewType === 'TECHNICAL' ? 'Tech' : 'HR'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-semibold text-slate-100">
                        Interview #{item.id}
                      </h4>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${isDone ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                      {item.jobDescriptionId && (
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          Job ID: {item.jobDescriptionId}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {isDone ? (
                    <Link
                      href={`/report/${item.id}`}
                      className="flex-1 sm:flex-none text-center bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm px-4 py-2 rounded-lg transition-colors"
                    >
                      View Report
                    </Link>
                  ) : (
                    <Link
                      href={`/interview/${item.id}`}
                      className="flex-1 sm:flex-none text-center bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      Continue
                    </Link>
                  )}
                  
                  <button
                    onClick={() => setDeleteTargetId(item.id)}
                    className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors"
                    title="Delete Interview"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId !== null) {
            deleteMutation.mutate(deleteTargetId);
          }
        }}
        title="Delete Interview?"
        description="Are you sure you want to delete this interview record? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

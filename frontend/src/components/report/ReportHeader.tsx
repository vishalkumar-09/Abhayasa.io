"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface ReportHeaderProps {
  roleTitle?: string;
  categoryName?: string;
  createdAt?: string;
  companyName?: string;
}

export const ReportHeader: React.FC<ReportHeaderProps> = React.memo(({
  roleTitle,
  categoryName,
  createdAt,
  companyName
}) => {
  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Recent Evaluation";

  const companyText = companyName ? ` at ${companyName}` : "";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/interviews"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to My Interviews</span>
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-50">
          Abhayasa Interview Report
        </h1>
        <p className="text-sm text-slate-400">
          {roleTitle || "Technical Interview"}{companyText} • {categoryName || "Software Engineering"} • {formattedDate}
        </p>
      </div>
    </div>
  );
});

ReportHeader.displayName = "ReportHeader";

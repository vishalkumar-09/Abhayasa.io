"use client";

import React from "react";

interface PerformanceOverTimeCardProps {
  currentScore?: number;
}

export const PerformanceOverTimeCard: React.FC<PerformanceOverTimeCardProps> = React.memo(({ currentScore = 78 }) => {
  const dataPoints = [
    { label: "Interview 1", date: "(25 Apr)", score: 55, x: 50, y: 150 },
    { label: "Interview 2", date: "(02 May)", score: 62, x: 220, y: 125 },
    { label: "Interview 3", date: "(08 May)", score: 68, x: 390, y: 100 },
    { label: "Interview 4", date: "(15 May)", score: currentScore, x: 560, y: 65 },
  ];

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">Performance Over Time</h3>
        <div className="relative">
          <select className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer">
            <option>All Interviews</option>
            <option>Last 30 Days</option>
            <option>Technical Only</option>
          </select>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <div className="min-w-[500px] h-56 relative pt-4 pb-8">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 600 200" preserveAspectRatio="none">
            <defs>
              <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            <line x1="40" y1="30" x2="580" y2="30" stroke="#1e293b" strokeDasharray="4 4" />
            <line x1="40" y1="80" x2="580" y2="80" stroke="#1e293b" strokeDasharray="4 4" />
            <line x1="40" y1="130" x2="580" y2="130" stroke="#1e293b" strokeDasharray="4 4" />
            <line x1="40" y1="180" x2="580" y2="180" stroke="#1e293b" />

            {/* Y axis labels */}
            <text x="15" y="34" fill="#64748b" fontSize="10">100</text>
            <text x="15" y="84" fill="#64748b" fontSize="10">75</text>
            <text x="15" y="134" fill="#64748b" fontSize="10">50</text>
            <text x="25" y="184" fill="#64748b" fontSize="10">0</text>

            {/* Area Fill */}
            <path
              d="M 50 150 Q 135 137, 220 125 T 390 100 T 560 65 L 560 180 L 50 180 Z"
              fill="url(#purpleGradient)"
            />

            {/* Spline Line */}
            <path
              d="M 50 150 Q 135 137, 220 125 T 390 100 T 560 65"
              fill="none"
              stroke="#818cf8"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Data Points */}
            {dataPoints.map((pt, i) => (
              <g key={i}>
                <circle cx={pt.x} cy={pt.y} r={i === dataPoints.length - 1 ? 6 : 4} fill={i === dataPoints.length - 1 ? "#6366f1" : "#818cf8"} stroke="#111827" strokeWidth="2" />
                {i === dataPoints.length - 1 && (
                  <g transform={`translate(${pt.x - 12}, ${pt.y - 24})`}>
                    <rect width="24" height="18" rx="4" fill="#6366f1" />
                    <text x="12" y="13" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">{pt.score}</text>
                  </g>
                )}
                {i < dataPoints.length - 1 && (
                  <text x={pt.x} y={pt.y - 10} fill="#cbd5e1" fontSize="10" fontWeight="600" textAnchor="middle">{pt.score}</text>
                )}
              </g>
            ))}
          </svg>

          {/* X Axis Labels */}
          <div className="flex justify-between px-6 mt-1 text-center">
            {dataPoints.map((pt, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="text-[11px] font-medium text-slate-300">{pt.label}</span>
                <span className="text-[10px] text-slate-500">{pt.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

PerformanceOverTimeCard.displayName = "PerformanceOverTimeCard";

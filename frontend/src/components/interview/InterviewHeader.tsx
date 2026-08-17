"use client";

import React, { useState, useEffect } from "react";
import { Clock, Volume2, VolumeX, Video, VideoOff } from "lucide-react";
import { AbhayasaLogo } from "@/components/AbhayasaLogo";

interface InterviewHeaderProps {
  currentIdx: number;
  totalQuestions: number;
  roleTitle?: string;
  categoryName?: string;
  difficulty?: string;
  interviewType?: string;
  isMuted: boolean;
  onToggleMute: () => void;
  useWebcam: boolean;
  onToggleWebcam: () => void;
  onOpenCompleteModal: () => void;
}

export const InterviewHeader: React.FC<InterviewHeaderProps> = React.memo(({
  currentIdx,
  totalQuestions,
  roleTitle,
  categoryName,
  difficulty,
  interviewType,
  isMuted,
  onToggleMute,
  useWebcam,
  onToggleWebcam,
  onOpenCompleteModal,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <header className="h-14 bg-[#0d1525] border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <AbhayasaLogo width={108} />
        <div className="h-4 w-[1px] bg-slate-700" />
        {interviewType && (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            interviewType === "HR" 
              ? "bg-emerald-500/10 text-emerald-400" 
              : "bg-indigo-500/10 text-indigo-400"
          }`}>
            {interviewType}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-400 mr-2">
          Question {currentIdx + 1} of {totalQuestions}
        </span>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalQuestions }).map((_, idx) => (
            <div 
              key={idx}
              className={`h-2 w-2 rounded-full ${
                idx < currentIdx ? 'bg-indigo-500' :
                idx === currentIdx ? 'bg-indigo-400 ring-2 ring-indigo-500/30' :
                'bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Timer */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
          <Clock className="h-3 w-3 text-slate-500" />
          <span>{formatTimer(elapsedSeconds)}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 border-l border-slate-700 pl-3">
          <button
            onClick={onToggleMute}
            className={`p-1.5 rounded-md transition-colors ${
              isMuted ? "bg-red-500/10 text-red-400" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
            title={isMuted ? "Unmute AI Voice" : "Mute AI Voice"}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>

          <button
            onClick={onToggleWebcam}
            className={`p-1.5 rounded-md transition-colors ${
              useWebcam ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200" : "bg-red-500/10 text-red-400"
            }`}
            title={useWebcam ? "Turn Camera Off" : "Turn Camera On"}
          >
            {useWebcam ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex items-center gap-2 border-l border-slate-700 pl-3">
          <button
            onClick={onOpenCompleteModal}
            className="px-3 py-1.5 rounded-md border border-red-500/50 text-red-400 hover:bg-red-500/10 text-xs font-semibold transition-colors"
          >
            End Interview
          </button>
        </div>
      </div>
    </header>
  );
});

InterviewHeader.displayName = "InterviewHeader";

"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, Clock, Volume2, VolumeX, Video, VideoOff } from "lucide-react";

interface InterviewHeaderProps {
  currentIdx: number;
  totalQuestions: number;
  roleTitle?: string;
  categoryName?: string;
  difficulty?: string;
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
  isMuted,
  onToggleMute,
  useWebcam,
  onToggleWebcam,
  onOpenCompleteModal,
}) => {
  // Timer isolated to this component so 1-second ticks do not trigger re-renders elsewhere
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
    <header className="glass-card border-b border-zinc-800/80 px-6 py-4 flex items-center justify-between sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h1 className="font-semibold text-sm text-white tracking-wide">
            {roleTitle || "Technical Mock Interview"}
          </h1>
        </div>
        <span className="text-zinc-700">|</span>
        <span className="text-xs text-zinc-400 font-medium">{categoryName || "General Engineering"}</span>
        {difficulty && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/10 border border-violet-500/20 text-violet-400">
            {difficulty}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Timer Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs font-mono text-zinc-300">
          <Clock className="h-3.5 w-3.5 text-zinc-500" />
          <span>{formatTimer(elapsedSeconds)}</span>
        </div>

        {/* Progress Counter */}
        <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
          <span>Question</span>
          <span className="px-2 py-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-bold">
            {currentIdx + 1} / {totalQuestions}
          </span>
        </div>

        {/* Audio Mute Controls */}
        <button
          onClick={onToggleMute}
          className={`p-2 rounded-xl border text-xs font-medium transition-all ${
            isMuted
              ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
              : "bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
          }`}
          title={isMuted ? "Unmute AI Voice" : "Mute AI Voice"}
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>

        {/* Camera Toggle */}
        <button
          onClick={onToggleWebcam}
          className={`p-2 rounded-xl border text-xs font-medium transition-all ${
            useWebcam
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
              : "bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
          }`}
          title={useWebcam ? "Turn Camera Off" : "Turn Camera On"}
        >
          {useWebcam ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
        </button>

        {/* Complete Session Button */}
        <button
          onClick={onOpenCompleteModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600/10 border border-violet-500/30 text-violet-300 hover:bg-violet-600 hover:text-white text-xs font-semibold transition-all shadow-sm"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Finish Interview</span>
        </button>
      </div>
    </header>
  );
});

InterviewHeader.displayName = "InterviewHeader";

"use client";

import React, { useRef, useEffect } from "react";
import { Video, VideoOff, User } from "lucide-react";

interface WebcamOverlayProps {
  useWebcam: boolean;
  webcamStream: MediaStream | null;
  onToggleWebcam: () => void;
}

export const WebcamOverlay: React.FC<WebcamOverlayProps> = React.memo(({
  useWebcam,
  webcamStream,
  onToggleWebcam,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (useWebcam && webcamStream && videoRef.current) {
      videoRef.current.srcObject = webcamStream;
    }
  }, [useWebcam, webcamStream]);

  if (!useWebcam) {
    return (
      <div className="glass-card rounded-2xl p-4 border border-zinc-800/80 flex items-center justify-between bg-zinc-950/60">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500">
            <VideoOff className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-zinc-300">Camera Off</span>
            <p className="text-[10px] text-zinc-500">Enable camera for proctored body language evaluation</p>
          </div>
        </div>
        <button
          onClick={onToggleWebcam}
          className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-all"
        >
          Enable Camera
        </button>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border border-zinc-800/80 bg-zinc-950 aspect-video max-w-[280px] shadow-xl group">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover transform -scale-x-100"
      />
      <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-zinc-950/80 backdrop-blur-md border border-zinc-800/60 flex items-center gap-1.5 text-[10px] text-zinc-300 font-semibold">
        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>PROCTORED LIVE</span>
      </div>

      <button
        onClick={onToggleWebcam}
        className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-zinc-950/80 backdrop-blur-md border border-zinc-800 text-zinc-400 opacity-0 group-hover:opacity-100 transition-all hover:text-white"
        title="Disable Camera"
      >
        <VideoOff className="h-3.5 w-3.5" />
      </button>
    </div>
  );
});

WebcamOverlay.displayName = "WebcamOverlay";

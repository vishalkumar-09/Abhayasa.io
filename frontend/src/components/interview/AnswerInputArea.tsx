"use client";

import React from "react";
import { Mic, MicOff, Send, Loader2, Code, Sparkles } from "lucide-react";

interface AnswerInputAreaProps {
  answerText: string;
  setAnswerText: (text: string) => void;
  isRecording: boolean;
  isTranscribingAudio: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isCodingMode: boolean;
  setIsCodingMode: (mode: boolean) => void;
  onSubmitAnswer: () => void;
  isSubmitting: boolean;
  isGeneratingFollowUp: boolean;
  followUpCount: number;
  onNextQuestion: () => void;
}

export const AnswerInputArea: React.FC<AnswerInputAreaProps> = React.memo(({
  answerText,
  setAnswerText,
  isRecording,
  isTranscribingAudio,
  onStartRecording,
  onStopRecording,
  isCodingMode,
  setIsCodingMode,
  onSubmitAnswer,
  isSubmitting,
  isGeneratingFollowUp,
  followUpCount,
  onNextQuestion,
}) => {
  return (
    <div className="flex flex-col gap-4">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between">
        {/* Left: Code Mode Toggle */}
        <button
          onClick={() => setIsCodingMode(!isCodingMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
            isCodingMode
              ? "bg-violet-600/20 border-violet-500/40 text-violet-300"
              : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
          }`}
        >
          <Code className="h-3.5 w-3.5" />
          <span>{isCodingMode ? "Switch to Text Mode" : "Open Code Sandbox"}</span>
        </button>

        {/* Right: Mic Dictation Button */}
        <button
          onClick={isRecording ? onStopRecording : onStartRecording}
          disabled={isTranscribingAudio}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
            isRecording
              ? "bg-red-500/20 border-red-500/40 text-red-300 animate-pulse shadow-lg shadow-red-500/10"
              : "bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300"
          }`}
        >
          {isRecording ? (
            <>
              <MicOff className="h-4 w-4 text-red-400" />
              <span>Stop Voice Dictation</span>
            </>
          ) : (
            <>
              <Mic className="h-4 w-4 text-violet-400" />
              <span>Start Voice Dictation</span>
            </>
          )}
        </button>
      </div>

      {/* Audio Transcribing Banner */}
      {isTranscribingAudio && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 animate-pulse">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" />
          <span>Transcribing spoken audio via AI...</span>
        </div>
      )}

      {/* Main Answer Textarea with Clear Placeholder Instructions */}
      {!isCodingMode && (
        <div className="relative">
          <textarea
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder="Type your answer here, or click 'Start Voice Dictation' above to speak. Once finished, click 'Stop Voice Dictation' to see your transcribed answer appear here..."
            rows={5}
            className="w-full bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/80 leading-relaxed resize-none"
          />
        </div>
      )}

      {/* Bottom Action Buttons Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onNextQuestion}
          className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-400 hover:text-white transition-all"
        >
          {followUpCount > 0 ? "Skip Follow-Up & Next Question" : "Skip / Next Question"}
        </button>

        <button
          onClick={onSubmitAnswer}
          disabled={isSubmitting || isGeneratingFollowUp || (!answerText.trim() && !isCodingMode)}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-xs font-semibold text-white transition-all shadow-lg shadow-violet-600/20"
        >
          {isGeneratingFollowUp ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-white" />
              <span>Formulating AI Follow-Up Question...</span>
            </>
          ) : isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-white" />
              <span>Evaluating Response...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>{followUpCount > 0 ? "Submit Follow-Up Answer" : "Submit Answer"}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
});

AnswerInputArea.displayName = "AnswerInputArea";

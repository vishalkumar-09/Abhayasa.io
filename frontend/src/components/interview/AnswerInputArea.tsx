"use client";

import React, { useState } from "react";
import { Mic, MicOff, Send, Loader2, Code, FileText } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<"TYPE" | "VOICE">("TYPE");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100">Your Response</h3>
        <div className="flex items-center rounded-lg bg-slate-900 p-1 border border-slate-800">
          <button
            onClick={() => {
              setActiveTab("TYPE");
              if (isRecording) onStopRecording();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === "TYPE"
                ? "bg-slate-800 text-slate-200 shadow-sm"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            Type Answer
          </button>
          
          <button
            onClick={() => setActiveTab("VOICE")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === "VOICE"
                ? "bg-slate-800 text-slate-200 shadow-sm"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Mic className="h-3.5 w-3.5" />
            Voice Answer
          </button>

          <button
            onClick={() => setIsCodingMode(!isCodingMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              isCodingMode
                ? "bg-indigo-500/20 text-indigo-400 shadow-sm"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Code className="h-3.5 w-3.5" />
            {isCodingMode ? "Code Mode On" : "Code Sandbox"}
          </button>
        </div>
      </div>

      {activeTab === "VOICE" ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-slate-800 bg-[#111827] p-8 min-h-[160px]">
          <button
            onClick={isRecording ? onStopRecording : onStartRecording}
            disabled={isTranscribingAudio}
            className={`flex h-16 w-16 items-center justify-center rounded-full transition-all ${
              isRecording
                ? "bg-red-500/20 text-red-400 ring-4 ring-red-500/20 animate-pulse"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
          >
            {isRecording ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
          </button>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-200">
              {isRecording ? "🔴 Recording in progress... Click to finish speaking" : "Click the microphone to start voice recording"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {isRecording ? "Speak clearly into your microphone." : "Your full audio will be transcribed once you finish recording."}
            </p>
          </div>
          {isTranscribingAudio && (
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mt-2 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20">
              <Loader2 className="h-4 w-4 animate-spin" />
              Transcribing audio answer...
            </div>
          )}
        </div>
      ) : (
        <div className="relative">
          {!isCodingMode && (
            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full min-h-[160px] rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-y"
            />
          )}
        </div>
      )}

      {/* Answer Preview when in voice mode */}
      {activeTab === "VOICE" && answerText && !isCodingMode && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Transcription Preview</p>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{answerText}</p>
          <button 
            onClick={() => setActiveTab("TYPE")} 
            className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
          >
            Edit text
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
        <button
          onClick={onNextQuestion}
          className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 hover:text-white transition-colors"
        >
          {followUpCount > 0 ? "Skip Follow-Up" : "Skip Question"}
        </button>

        <button
          onClick={onSubmitAnswer}
          disabled={isSubmitting || isGeneratingFollowUp || (!answerText.trim() && !isCodingMode)}
          className="flex w-full sm:w-auto items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
        >
          {isGeneratingFollowUp ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating Follow-Up...
            </>
          ) : isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Evaluating Answer...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              {followUpCount > 0 ? "Submit Follow-Up →" : "Submit Answer →"}
            </>
          )}
        </button>
      </div>
    </div>
  );
});

AnswerInputArea.displayName = "AnswerInputArea";

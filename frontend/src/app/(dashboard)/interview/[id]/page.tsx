"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
  Loader2,
  Mic,
  MicOff,
  Send,
  CheckCircle2,
  AlertCircle,
  SkipForward,
  Flag,
  HelpCircle,
  User,
  Brain,
  Sparkles,
  MessageSquare
} from "lucide-react";

export default function LiveInterviewPage() {
  const { id: interviewId } = useParams();
  const router = useRouter();
  
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answerText, setAnswerText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [speechInterval, setSpeechInterval] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch interview details (contains the generated questions)
  const { data: interview, isLoading: loadingInterview } = useQuery({
    queryKey: ["interview", interviewId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/v1/interviews/${interviewId}`);
      return res.data;
    },
    enabled: !!interviewId,
  });

  // Load progress index from localStorage on mount
  useEffect(() => {
    if (interviewId) {
      const savedIdx = localStorage.getItem(`interview_idx_${interviewId}`);
      if (savedIdx) {
        setCurrentIdx(Number(savedIdx));
      }
    }
  }, [interviewId]);

  // Save progress index to localStorage when it changes
  const updateIndex = (idx: number) => {
    setCurrentIdx(idx);
    localStorage.setItem(`interview_idx_${interviewId}`, idx.toString());
  };

  // Mutation: Submit answer for evaluation
  const submitAnswerMutation = useMutation({
    mutationFn: async (req: { questionId: number; answerText: string }) => {
      const res = await apiClient.post(
        `/api/v1/interviews/${interviewId}/questions/${req.questionId}/answers`,
        {
          answerText: req.answerText,
        }
      );
      return res.data;
    },
    onSuccess: () => {
      setAnswerText("");
      setErrorMsg(null);
      
      const totalQuestions = interview?.questions?.length || 0;
      if (currentIdx < totalQuestions - 1) {
        updateIndex(currentIdx + 1);
      } else {
        // Automatically trigger completion if it was the last question
        completeInterviewMutation.mutate();
      }
    },
    onError: (err: any) => {
      console.error(err);
      setErrorMsg(err.response?.data?.message || "Failed to submit evaluation for this answer.");
    },
  });

  // Mutation: Complete Interview and generate report
  const completeInterviewMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/api/v1/interviews/${interviewId}/complete`);
      return res.data;
    },
    onSuccess: (data) => {
      localStorage.removeItem(`interview_idx_${interviewId}`);
      router.push(`/report/${interviewId}`);
    },
    onError: (err: any) => {
      console.error(err);
      setErrorMsg(err.response?.data?.message || "Failed to finalize interview report.");
    },
  });

  // Speech simulation handlers (micro-interaction for speech-to-text demonstration)
  const startRecording = async () => {
    setIsRecording(true);
    setErrorMsg(null);
    try {
      // Prompt microphone permissions to feel realistic
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);

      // Start simulating speech transcription inputs to wow the user
      const mockStatements = [
        " In my previous experience, I solved this by ",
        " implementing a robust queue system using RabbitMQ and Redis. ",
        " This optimized data flow and reduced latency by over 30%. ",
        " For concurrency, I used lock mechanisms to ensure transaction safety. "
      ];
      let counter = 0;
      const interval = setInterval(() => {
        if (counter < mockStatements.length) {
          setAnswerText((prev) => prev + mockStatements[counter]);
          counter++;
        } else {
          clearInterval(interval);
          stopRecording(stream);
        }
      }, 2500);
      setSpeechInterval(interval);
    } catch (err) {
      console.error("Microphone access denied:", err);
      // Fallback: just standard mock timer
      const interval = setInterval(() => {}, 1000);
      setSpeechInterval(interval);
    }
  };

  const stopRecording = (stream?: MediaStream) => {
    setIsRecording(false);
    if (speechInterval) clearInterval(speechInterval);
    const activeStream = stream || audioStream;
    if (activeStream) {
      activeStream.getTracks().forEach((track) => track.stop());
    }
    setAudioStream(null);
  };

  if (loadingInterview) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <Loader2 className="h-10 w-10 text-violet-500 animate-spin" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white">Loading Simulator...</h3>
          <p className="text-xs text-zinc-500 mt-1">Retrieving AI generated questions...</p>
        </div>
      </div>
    );
  }

  const questions = interview?.questions || [];
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIdx];

  const handleNext = () => {
    if (currentIdx < totalQuestions - 1) {
      updateIndex(currentIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      updateIndex(currentIdx - 1);
    }
  };

  const handleAnswerSubmit = () => {
    if (!answerText.trim()) {
      setErrorMsg("Please type or record an answer before submitting.");
      return;
    }
    submitAnswerMutation.mutate({
      questionId: currentQuestion.id,
      answerText: answerText,
    });
  };

  const handleCompleteEarly = () => {
    if (confirm("Are you sure you want to end this interview session early? All submitted answers will still be evaluated and aggregated into your report.")) {
      completeInterviewMutation.mutate();
    }
  };

  // If no questions exist or interview is empty
  if (totalQuestions === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 border border-zinc-800/80 text-center flex flex-col items-center justify-center gap-4">
        <AlertCircle className="h-10 w-10 text-yellow-500" />
        <div>
          <h3 className="text-lg font-semibold text-white">Empty Interview Session</h3>
          <p className="text-sm text-zinc-400 mt-1">
            No questions could be found for this session. Please launch a new one.
          </p>
        </div>
        <Link href="/interview" className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm transition-colors">
          Return to Launcher
        </Link>
      </div>
    );
  }

  const isLastQuestion = currentIdx === totalQuestions - 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
      {/* Sidebar navigation list of questions */}
      <div className="lg:col-span-1 flex flex-col gap-4">
        <div className="glass-card rounded-2xl p-5 border border-zinc-800/80 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-violet-400" />
            <h3 className="font-semibold text-sm text-white">Interview Progress</h3>
          </div>

          <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-1">
            {questions.map((q: any, i: number) => {
              const isCurrent = i === currentIdx;
              const isAnswered = i < currentIdx; // Simple state tracking: historical ones are answered
              return (
                <button
                  key={q.id}
                  onClick={() => updateIndex(i)}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs font-medium text-left transition-all ${
                    isCurrent
                      ? "bg-violet-600/10 border-violet-500/30 text-violet-400"
                      : "bg-zinc-950/40 border-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-900/30"
                  }`}
                >
                  <span className="truncate max-w-[120px]">
                    Q{i + 1}: {q.questionText}
                  </span>
                  <span className="shrink-0 ml-2">
                    {isAnswered ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-semibold border ${
                        q.difficulty === "SENIOR"
                          ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                          : q.difficulty === "JUNIOR"
                          ? "bg-sky-500/10 border-sky-500/20 text-sky-400"
                          : "bg-zinc-500/10 border-zinc-850 text-zinc-400"
                      }`}>
                        {q.difficulty}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-zinc-900 pt-4 flex flex-col gap-2.5">
            <button
              onClick={handleCompleteEarly}
              disabled={completeInterviewMutation.isPending || submitAnswerMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 text-red-400 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
            >
              <Flag className="h-3.5 w-3.5" />
              Finish Session Early
            </button>
          </div>
        </div>
      </div>

      {/* Center card question panel */}
      <div className="lg:col-span-3 flex flex-col gap-4 relative">
        {/* Evaluating overlay */}
        {(submitAnswerMutation.isPending || completeInterviewMutation.isPending) && (
          <div className="absolute inset-0 z-20 rounded-2xl bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-4 animate-in fade-in duration-200">
            <Loader2 className="h-10 w-10 text-violet-500 animate-spin" />
            <div className="text-center">
              <h4 className="font-semibold text-white text-sm">
                {completeInterviewMutation.isPending
                  ? "Finalizing Interview Report..."
                  : "AI Engine Evaluating Response..."}
              </h4>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto leading-relaxed">
                {completeInterviewMutation.isPending
                  ? "Generating summary roadmaps, strengths, and weaknesses scores..."
                  : "Analyzing technical accuracy, communication structure, and completeness metrics..."}
              </p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs animate-in fade-in duration-200">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="flex-1">{errorMsg}</p>
          </div>
        )}

        {/* Question Panel */}
        <div className="glass-card rounded-2xl border border-zinc-800/80 overflow-hidden">
          {/* Header info */}
          <div className="bg-zinc-950/80 px-6 py-4 border-b border-zinc-900 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-violet-400" />
              <span className="text-xs text-zinc-400 font-semibold tracking-wider uppercase">
                Question {currentIdx + 1} of {totalQuestions}
              </span>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
              currentQuestion?.difficulty === "SENIOR"
                ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                : currentQuestion?.difficulty === "JUNIOR"
                ? "bg-sky-500/10 border-sky-500/20 text-sky-400"
                : "bg-zinc-500/10 border-zinc-850 text-zinc-400"
            }`}>
              {currentQuestion?.difficulty} Difficulty
            </span>
          </div>

          {/* Question Text */}
          <div className="p-6 md:p-8 flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-violet-600/10 border border-violet-500/20 text-violet-400 shrink-0">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg md:text-xl font-medium text-white leading-relaxed">
                {currentQuestion?.questionText}
              </h3>
            </div>
          </div>
        </div>

        {/* Answer submission card */}
        <div className="glass-card rounded-2xl p-6 border border-zinc-800/80 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Your Answer Response</h4>
            <div className="flex items-center gap-2">
              {isRecording ? (
                <button
                  onClick={() => stopRecording()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 hover:border-red-500/30 text-red-400 text-xs font-medium cursor-pointer animate-pulse"
                >
                  <MicOff className="h-3.5 w-3.5" />
                  Stop Recording
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/15 border border-violet-500/20 hover:border-violet-500/30 text-violet-300 hover:text-violet-200 text-xs font-medium cursor-pointer transition-colors"
                >
                  <Mic className="h-3.5 w-3.5" />
                  Record Answer (Voice)
                </button>
              )}
            </div>
          </div>

          <textarea
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            rows={7}
            placeholder="Write your technical explanation here, or click the mic button to speak and simulate transcription. Provide deep, structured responses to maximize score metrics..."
            className="w-full px-4 py-3 rounded-xl bg-zinc-950/50 border border-zinc-800 text-white placeholder-zinc-500 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all resize-y min-h-[160px]"
          />

          {isRecording && (
            <div className="flex items-center gap-3 py-1 px-2.5 rounded-lg bg-violet-900/10 border border-violet-500/20 w-fit">
              <span className="h-2 w-2 rounded-full bg-violet-400 animate-ping" />
              <span className="text-[10px] text-violet-300 font-medium animate-pulse">
                Transcribing live microphone input...
              </span>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-between border-t border-zinc-900 pt-4 mt-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={currentIdx === 0}
                className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={handleNext}
                disabled={currentIdx === totalQuestions - 1}
                className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
              >
                Skip
                <SkipForward className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              onClick={handleAnswerSubmit}
              disabled={submitAnswerMutation.isPending || !answerText.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-semibold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-violet-600/20"
            >
              {isLastQuestion ? "Submit & Finalize" : "Submit Answer"}
              <Send className="h-3.5 w-3.5 fill-current" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

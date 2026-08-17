"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import dynamic from "next/dynamic";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { InterviewHeader } from "@/components/interview/InterviewHeader";
import { QuestionCard } from "@/components/interview/QuestionCard";
import { AnswerInputArea } from "@/components/interview/AnswerInputArea";
import { ChatSidebar } from "@/components/interview/ChatSidebar";
import { Loader2, MessageSquare, Clock, Target, TrendingUp } from "lucide-react";

/** Interview state snapshot returned by the backend after every answer submission. */
interface InterviewStateSnapshot {
  primaryQuestionsAsked: number;
  followUpsAskedCurrentQuestion: number;
  competenciesEvaluated: string[];
  competenciesRequired: string[];
  interviewStartTime: string | null;
  elapsedMinutes: number;
  currentDifficulty: "JUNIOR" | "MID" | "SENIOR";
  rollingAvgScore: number;
  canEndEarly: boolean;
  mustEnd: boolean;
}

// Dynamic Code Editor import with SSR disabled to eliminate 3MB bundle bloat from initial route load
const MonacoCodeEditor = dynamic(
  () => import("@/components/interview/MonacoCodeEditor").then((mod) => mod.MonacoCodeEditor),
  {
    ssr: false,
    loading: () => (
      <div className="glass-card rounded-2xl border border-zinc-800/80 h-[400px] flex items-center justify-center bg-zinc-950">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
          <span>Loading Code Sandbox...</span>
        </div>
      </div>
    ),
  }
);

// Dynamic Webcam import with SSR disabled
const WebcamOverlay = dynamic(
  () => import("@/components/interview/WebcamOverlay").then((mod) => mod.WebcamOverlay),
  { ssr: false }
);

interface ChatMsg {
  role: "user" | "assistant";
  text: string;
}

export default function LiveInterviewPage() {
  const { id: interviewId } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answerText, setAnswerText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<any>(null);

  // Audio / Webcam / Voice States
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [useWebcam, setUseWebcam] = useState(true);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);

  // Follow-up States
  const [followUpCount, setFollowUpCount] = useState(0);
  const [followUpQuestionText, setFollowUpQuestionText] = useState("");
  const [followUpQuestionsHistory, setFollowUpQuestionsHistory] = useState<string[]>([]);
  const lastSpokenQuestionIdRef = useRef<number | null>(null);
  const activeSpokenTextRef = useRef<string>("");

  // Interview State Snapshot (from backend)
  const [interviewState, setInterviewState] = useState<InterviewStateSnapshot | null>(null);

  // Code Sandbox States
  const [codeContent, setCodeContent] = useState("");
  const [codeLanguage, setCodeLanguage] = useState("javascript");
  const [isCodingMode, setIsCodingMode] = useState(false);

  // Chat Assistant States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isGeneratingHint, setIsGeneratingHint] = useState(false);

  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const baseAnswerTextRef = useRef<string>("");
  const isRecordingRef = useRef<boolean>(false);
  const hasWebSpeechTranscribedRef = useRef<boolean>(false);
  const [isTranscribingAudio, setIsTranscribingAudio] = useState(false);

  // Initialize WebSpeech API on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        recog.continuous = !isMobile;
        recog.interimResults = true;
        recog.lang = "en-US";

        recog.onresult = (event: any) => {
          let spoken = "";
          for (let i = 0; i < event.results.length; i++) {
            spoken += event.results[i][0].transcript;
          }
          if (spoken.trim()) {
            hasWebSpeechTranscribedRef.current = true;
          }
          const base = baseAnswerTextRef.current;
          const updated = base ? base.trim() + " " + spoken.trim() : spoken.trim();

          if (isCodingMode) {
            setCodeContent((prev) => {
              const baseCode = prev.split("\n// Spoken explanation:")[0];
              return baseCode.trim() + `\n// Spoken explanation: ${updated}`;
            });
          } else {
            setAnswerText(updated);
          }
        };

        recog.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
        };

        recog.onend = () => {
          if (isRecordingRef.current) {
            try { recog.start(); } catch (e) {}
          } else {
            setIsRecording(false);
          }
        };

        setRecognition(recog);
      }
    }
  }, [isCodingMode]);

  // Fetch interview details
  const { data: interview, isLoading: loadingInterview } = useQuery({
    queryKey: ["interview", interviewId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/v1/interviews/${interviewId}`);
      return res.data;
    },
    enabled: !!interviewId,
  });

  // Seed interviewState from query data on first load
  useEffect(() => {
    if (interview?.interviewState && !interviewState) {
      setInterviewState(interview.interviewState);
    }
  }, [interview]);

  // Auto-complete when backend signals hard stop (18 questions or 45 min)
  useEffect(() => {
    if (interviewState?.mustEnd && !completeInterviewMutation.isPending) {
      setShowCompleteModal(true);
    }
  }, [interviewState?.mustEnd]);

  const questions = interview?.questions || [];
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIdx];

  // Saved progress index
  useEffect(() => {
    if (interviewId) {
      const savedIdx = localStorage.getItem(`interview_idx_${interviewId}`);
      if (savedIdx) {
        setCurrentIdx(Number(savedIdx));
      }
    }
  }, [interviewId]);

  const updateIndex = (idx: number) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setCurrentIdx(idx);
    setFollowUpCount(0);
    setFollowUpQuestionText("");
    setAnswerText("");
    setCodeContent("");
    activeSpokenTextRef.current = "";

    const nextQ = questions[idx];
    if (nextQ) {
      lastSpokenQuestionIdRef.current = nextQ.id;
      setTimeout(() => {
        speakQuestion(nextQ.questionText);
      }, 100);
    }
    localStorage.setItem(`interview_idx_${interviewId}`, idx.toString());
  };

  // Handle active webcam stream
  useEffect(() => {
    if (useWebcam) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((stream) => {
          setWebcamStream(stream);
        })
        .catch((err) => {
          console.error("Camera access blocked:", err);
          setUseWebcam(false);
        });
    } else {
      if (webcamStream) {
        webcamStream.getTracks().forEach((track) => track.stop());
        setWebcamStream(null);
      }
    }
    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [useWebcam]);

  // Audio Speech Synthesis
  const speakQuestion = (text?: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis || isMuted) return;
    const targetText = text || activeSpokenTextRef.current || followUpQuestionText || currentQuestion?.questionText;
    if (!targetText) return;

    activeSpokenTextRef.current = targetText;
    window.speechSynthesis.cancel();

    setTimeout(() => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(targetText);
      const allVoices = window.speechSynthesis.getVoices();
      let selectedVoice = allVoices.find((v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("natural"));
      if (!selectedVoice) {
        selectedVoice = allVoices.find((v) => v.lang.startsWith("en"));
      }
      if (selectedVoice) utterance.voice = selectedVoice;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsAiSpeaking(true);
      utterance.onend = () => setIsAiSpeaking(false);
      utterance.onerror = () => setIsAiSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }, 100);
  };

  useEffect(() => {
    if (currentQuestion && lastSpokenQuestionIdRef.current !== currentQuestion.id) {
      lastSpokenQuestionIdRef.current = currentQuestion.id;
      speakQuestion(currentQuestion.questionText);
    }
  }, [currentQuestion, isMuted]);

  // Generate AI Follow-Up Question Mutation
  const generateFollowUpMutation = useMutation({
    mutationFn: async (req: { questionId: number; answerText: string; history: string[] }) => {
      const res = await apiClient.post(
        `/api/v1/interviews/${interviewId}/questions/${req.questionId}/followup`,
        req
      );
      return res.data;
    },
    onSuccess: (data) => {
      if (data?.followupQuestion) {
        const text = data.followupQuestion;
        setFollowUpCount((prev) => prev + 1);
        setFollowUpQuestionText(text);
        setFollowUpQuestionsHistory((prev) => [...prev, text]);
        setAnswerText("");
        setCodeContent("");
        setTimeout(() => {
          speakQuestion(text);
        }, 100);
      } else {
        updateIndex(currentIdx + 1);
      }
    },
    onError: (err: any) => {
      console.warn("Follow-up generation error, moving to next main question:", err);
      updateIndex(currentIdx + 1);
    },
  });

  // Complete Interview Mutation
  const completeInterviewMutation = useMutation({
    mutationFn: async () => {
      setUseWebcam(false);
      if (webcamStream) {
        webcamStream.getTracks().forEach((track) => track.stop());
        setWebcamStream(null);
      }
      const res = await apiClient.post(`/api/v1/interviews/${interviewId}/complete`);
      return res.data;
    },
    onSuccess: () => {
      localStorage.removeItem(`interview_idx_${interviewId}`);
      router.push(`/report/${interviewId}`);
    },
    onError: (err: any) => {
      console.error(err);
      setErrorMsg(err.response?.data?.message || "Failed to finalize interview report.");
    },
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    setErrorMsg(null);
    hasWebSpeechTranscribedRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);

      audioChunksRef.current = [];
      let recorder: MediaRecorder;
      try {
        let mimeType = "";
        if (typeof MediaRecorder !== "undefined") {
          if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
            mimeType = "audio/webm;codecs=opus";
          } else if (MediaRecorder.isTypeSupported("audio/webm")) {
            mimeType = "audio/webm";
          } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
            mimeType = "audio/mp4";
          } else if (MediaRecorder.isTypeSupported("audio/aac")) {
            mimeType = "audio/aac";
          }
        }
        recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      } catch (e) {
        recorder = new MediaRecorder(stream);
      }

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        if ((!hasWebSpeechTranscribedRef.current || !answerText.trim() || !recognition) && audioChunksRef.current.length > 0) {
          setIsTranscribingAudio(true);
          const blobType = recorder.mimeType || "audio/webm";
          const audioBlob = new Blob(audioChunksRef.current, { type: blobType });
          const formData = new FormData();
          const ext = blobType.includes("mp4") ? "mp4" : blobType.includes("aac") ? "aac" : "webm";
          formData.append("file", audioBlob, `speech.${ext}`);

          try {
            const res = await apiClient.post("/api/v1/interviews/transcribe-audio", formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
            if (res.data?.transcript && res.data.transcript.trim()) {
              const text = res.data.transcript.trim();
              if (isCodingMode) {
                setCodeContent((prev) => {
                  const baseCode = prev.split("\n// Spoken explanation:")[0];
                  return baseCode.trim() + `\n// Spoken explanation: ${text}`;
                });
              } else {
                setAnswerText((prev) => (prev ? prev.trim() + " " + text : text));
              }
            }
          } catch (err) {
            console.error("Audio transcription error:", err);
          } finally {
            setIsTranscribingAudio(false);
          }
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000);

      baseAnswerTextRef.current = answerText;
      isRecordingRef.current = true;
      setIsRecording(true);

      if (recognition) {
        try {
          recognition.start();
        } catch (e) {
          console.warn("Speech recognition already active:", e);
        }
      }
    } catch (err: any) {
      console.error("Microphone access error:", err);
      setErrorMsg("Microphone access denied or unsupported. Please enable mic permissions.");
    }
  };

  const stopRecording = () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try { mediaRecorderRef.current.stop(); } catch (e) {}
    }
    if (recognition) {
      try { recognition.stop(); } catch (e) {}
    }
    if (audioStream) {
      audioStream.getTracks().forEach((track) => track.stop());
    }
    setAudioStream(null);
  };

  // Submit Final Answer Mutation
  const submitAnswerMutation = useMutation({
    mutationFn: async (req: { questionId: number; answerText: string }) => {
      const res = await apiClient.post(
        `/api/v1/interviews/${interviewId}/questions/${req.questionId}/answers`,
        { answerText: req.answerText }
      );
      return res.data;
    },
    onSuccess: (data) => {
      setAnswerText("");
      setCodeContent("");
      setErrorMsg(null);
      // Update local interview state snapshot from answer response
      if (data?.interviewState) {
        setInterviewState(data.interviewState);
      }
      queryClient.invalidateQueries({ queryKey: ["interview", interviewId] });

      if (currentIdx < totalQuestions - 1) {
        updateIndex(currentIdx + 1);
      } else {
        completeInterviewMutation.mutate();
      }
    },
    onError: (err: any) => {
      console.error(err);
      setErrorMsg(err.response?.data?.message || "Failed to submit evaluation for this answer.");
    },
  });

  // Handle Answer Submission (Triggers adaptive AI follow-up for initial responses)
  const handleSubmitAnswer = () => {
    if (!currentQuestion) return;
    const finalAnswerText = isCodingMode
      ? `[CODE SOLUTION (${codeLanguage.toUpperCase()}:\n${codeContent}\n]\n${answerText}`
      : answerText;

    if (!finalAnswerText.trim()) return;

    // Backend enforces max 3 follow-ups; frontend mirrors this cap
    const serverFollowUpCount = interviewState?.followUpsAskedCurrentQuestion ?? followUpCount;
    if (serverFollowUpCount < 3) {
      // Formulate adaptive AI follow-up question
      generateFollowUpMutation.mutate({
        questionId: currentQuestion.id,
        answerText: finalAnswerText.trim(),
        history: followUpQuestionsHistory,
      });
    } else {
      // Follow-up cap reached — submit and advance
      submitAnswerMutation.mutate({
        questionId: currentQuestion.id,
        answerText: finalAnswerText.trim(),
      });
    }
  };

  const handleAskHint = () => {
    if (!currentQuestion) return;
    setIsGeneratingHint(true);
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", text: `Hint for Q${currentIdx + 1}: Focus on core data structures and edge case validation for ${currentQuestion.questionText.slice(0, 30)}...` }
      ]);
      setIsGeneratingHint(false);
    }, 800);
  };

  const handleSendChatMessage = () => {
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", text }]);
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", text: `Understood. Ensure your answer addresses runtime complexity and trade-offs.` }
      ]);
    }, 600);
  };

  if (loadingInterview) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
        <span className="text-xs text-zinc-400 font-medium">Initializing AI Interview Simulator...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Isolated Memoized Header */}
      <InterviewHeader
        currentIdx={currentIdx}
        totalQuestions={totalQuestions}
        roleTitle={interview?.roleTitle}
        categoryName={interview?.categoryName}
        difficulty={interview?.difficulty}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(!isMuted)}
        useWebcam={useWebcam}
        onToggleWebcam={() => setUseWebcam(!useWebcam)}
        onOpenCompleteModal={() => setShowCompleteModal(true)}
      />

      {/* Interview Progress Bar (from backend interviewState) */}
      {interviewState && (
        <div className="border-b border-zinc-800/60 bg-zinc-900/40 px-6 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center gap-6">
            {/* Primary Q Progress */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Target className="h-3.5 w-3.5 text-violet-400 shrink-0" />
              <span className="text-[11px] text-zinc-400 shrink-0 font-medium">
                {interviewState.primaryQuestionsAsked}
                <span className="text-zinc-600">/15</span>
                <span className="text-zinc-600 ml-1">questions</span>
              </span>
              <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (interviewState.primaryQuestionsAsked / 15) * 100)}%`,
                    background: interviewState.primaryQuestionsAsked >= 15
                      ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                      : interviewState.primaryQuestionsAsked >= 10
                        ? 'linear-gradient(90deg, #a78bfa, #7c3aed)'
                        : 'linear-gradient(90deg, #6366f1, #818cf8)',
                  }}
                />
              </div>
              {interviewState.canEndEarly && (
                <span className="text-[10px] font-semibold text-emerald-400 shrink-0 bg-emerald-400/10 px-1.5 py-0.5 rounded-full">
                  Can End
                </span>
              )}
            </div>

            {/* Difficulty badge */}
            <div className="flex items-center gap-1.5 shrink-0">
              <TrendingUp className="h-3 w-3 text-zinc-500" />
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                interviewState.currentDifficulty === 'SENIOR' ? 'text-red-300 bg-red-500/10' :
                interviewState.currentDifficulty === 'MID' ? 'text-amber-300 bg-amber-500/10' :
                'text-sky-300 bg-sky-500/10'
              }`}>
                {interviewState.currentDifficulty}
              </span>
            </div>

            {/* Elapsed time */}
            {interviewState.elapsedMinutes > 0 && (
              <div className="flex items-center gap-1 shrink-0">
                <Clock className="h-3 w-3 text-zinc-500" />
                <span className="text-[11px] text-zinc-500">{interviewState.elapsedMinutes}m</span>
                {interviewState.elapsedMinutes >= 40 && (
                  <span className="text-[10px] text-amber-400 font-medium">({45 - interviewState.elapsedMinutes}m left)</span>
                )}
              </div>
            )}

            {/* Follow-up counter for current question */}
            {interviewState.followUpsAskedCurrentQuestion > 0 && (
              <div className="shrink-0 text-[10px] text-zinc-500">
                Follow-ups: {interviewState.followUpsAskedCurrentQuestion}/3
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Alert Banner */}
      {errorMsg && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-2.5 text-xs text-red-300 flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="font-bold hover:text-white">✕</button>
        </div>
      )}

      {/* Main Content Workspace Grid */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Question & Input Area */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <QuestionCard
            questionNumber={currentIdx + 1}
            questionText={currentQuestion?.questionText || "Question details loading..."}
            category={interview?.categoryName}
            difficulty={interview?.difficulty}
            expectedConcepts={currentQuestion?.expectedConcepts}
            followUpCount={followUpCount}
            followUpQuestionText={followUpQuestionText}
            isAiSpeaking={isAiSpeaking}
            isMuted={isMuted}
            onSpeak={speakQuestion}
          />

          {isCodingMode && (
            <MonacoCodeEditor
              codeContent={codeContent}
              setCodeContent={setCodeContent}
              codeLanguage={codeLanguage}
              setCodeLanguage={setCodeLanguage}
            />
          )}

          <AnswerInputArea
            answerText={answerText}
            setAnswerText={setAnswerText}
            isRecording={isRecording}
            isTranscribingAudio={isTranscribingAudio}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            isCodingMode={isCodingMode}
            setIsCodingMode={setIsCodingMode}
            onSubmitAnswer={handleSubmitAnswer}
            isSubmitting={submitAnswerMutation.isPending}
            isGeneratingFollowUp={generateFollowUpMutation.isPending}
            followUpCount={followUpCount}
            onNextQuestion={() => updateIndex(Math.min(currentIdx + 1, totalQuestions - 1))}
          />
        </div>

        {/* Right Column: Webcam & AI Assistant Controls */}
        <div className="flex flex-col gap-6">
          <WebcamOverlay
            useWebcam={useWebcam}
            webcamStream={webcamStream}
            onToggleWebcam={() => setUseWebcam(!useWebcam)}
          />

          {/* Quick AI Co-Pilot Drawer Toggle */}
          <div className="glass-card rounded-2xl p-5 border border-zinc-800/80 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-violet-400" />
                <span className="text-xs font-semibold text-white">AI Technical Co-Pilot</span>
              </div>
              <button
                onClick={() => setIsChatOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/30 text-violet-300 text-xs font-semibold transition-all"
              >
                Open Chat Assistant
              </button>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Stuck on a tricky algorithmic detail? Ask questions or request hint guidelines without penalty.
            </p>
          </div>
        </div>
      </main>

      {/* Floating Chat Sidebar */}
      <ChatSidebar
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={chatMessages}
        chatInput={chatInput}
        setChatInput={setChatInput}
        onSendMessage={handleSendChatMessage}
        onAskHint={handleAskHint}
        isGeneratingHint={isGeneratingHint}
      />

      {/* Finish Confirmation Modal */}
      <ConfirmModal
        isOpen={showCompleteModal}
        title="Finish Interview Session?"
        description="Are you sure you want to end this interview session? Your responses will be finalized and evaluated into your performance report."
        confirmText="Finish & Evaluate"
        variant="info"
        onConfirm={() => {
          setShowCompleteModal(false);
          completeInterviewMutation.mutate();
        }}
        onClose={() => setShowCompleteModal(false)}
      />
    </div>
  );
}

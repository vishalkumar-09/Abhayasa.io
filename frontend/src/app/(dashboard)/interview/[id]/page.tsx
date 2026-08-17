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
import { ReportGeneratingLoader } from "@/components/interview/ReportGeneratingLoader";
import { Loader2, TrendingUp, CheckCircle, Clock } from "lucide-react";

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
      <div className="rounded-xl border border-slate-800 h-[400px] flex items-center justify-center bg-[#111827]">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
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
  const [isChatOpen, setIsChatOpen] = useState(false); // Unused visually but keeping state
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isGeneratingHint, setIsGeneratingHint] = useState(false);

  // Right Panel Tabs
  const [rightTab, setRightTab] = useState<"OVERVIEW" | "HISTORY">("OVERVIEW");

  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const baseAnswerTextRef = useRef<string>("");
  const isRecordingRef = useRef<boolean>(false);
  const hasWebSpeechTranscribedRef = useRef<boolean>(false);
  const [isTranscribingAudio, setIsTranscribingAudio] = useState(false);

  // WebSpeech API for speech detection without live text stream override
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = true;
        recog.interimResults = false;
        recog.lang = "en-US";

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
  }, []);

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
  }, [interview, interviewState]);

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
    setFollowUpQuestionsHistory([]);
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
    onSuccess: (data, variables) => {
      const text = data?.followupQuestion?.trim();
      const isInvalid = !text || text.toLowerCase().includes("maximum follow-up");

      if (!isInvalid) {
        setFollowUpCount((prev) => prev + 1);
        setFollowUpQuestionText(text);
        setFollowUpQuestionsHistory((prev) => [...prev, text]);
        setAnswerText("");
        setCodeContent("");
        setTimeout(() => {
          speakQuestion(text);
        }, 100);
      } else {
        if (currentQuestion) {
          submitAnswerMutation.mutate({
            questionId: currentQuestion.id,
            answerText: variables.answerText,
          });
        }
      }
    },
    onError: (err: any, variables) => {
      console.warn("Follow-up generation error, advancing:", err);
      if (currentQuestion) {
        submitAnswerMutation.mutate({
          questionId: currentQuestion.id,
          answerText: variables.answerText,
        });
      }
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
        if (audioChunksRef.current.length > 0) {
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

  const handleSubmitAnswer = () => {
    if (!currentQuestion) return;
    const finalAnswerText = isCodingMode
      ? `[CODE SOLUTION (${codeLanguage.toUpperCase()}):\n${codeContent}\n]\n${answerText}`
      : answerText;

    if (!finalAnswerText.trim()) return;

    if (followUpCount < 2) {
      generateFollowUpMutation.mutate({
        questionId: currentQuestion.id,
        answerText: finalAnswerText.trim(),
        history: followUpQuestionsHistory,
      });
    } else {
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
      <div className="h-screen bg-[#0a0f1e] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        <span className="text-sm text-slate-400 font-medium">Initializing AI Interview Simulator...</span>
      </div>
    );
  }

  if (completeInterviewMutation.isPending) {
    return (
      <ReportGeneratingLoader
        errorMsg={errorMsg}
        onRetry={() => {
          setErrorMsg(null);
          completeInterviewMutation.mutate();
        }}
      />
    );
  }

  const compEvaluated = interviewState?.competenciesEvaluated || [];
  const compRequired = interviewState?.competenciesRequired || ["Algorithms", "System Design", "Communication"];

  return (
    <div className="h-screen bg-[#0a0f1e] text-slate-100 flex flex-col overflow-hidden">
      {/* Header */}
      <InterviewHeader
        currentIdx={currentIdx}
        totalQuestions={totalQuestions}
        roleTitle={interview?.roleTitle}
        categoryName={interview?.categoryName}
        difficulty={interview?.difficulty}
        interviewType={interview?.interviewType}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(!isMuted)}
        useWebcam={useWebcam}
        onToggleWebcam={() => setUseWebcam(!useWebcam)}
        onOpenCompleteModal={() => setShowCompleteModal(true)}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3 gap-0">
        
        {/* Left/Center Column: Question & Input Area */}
        <div className="lg:col-span-2 flex flex-col h-full overflow-y-auto p-6 space-y-6">
          
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl text-sm text-red-300 flex items-center justify-between">
              <span>{errorMsg}</span>
              <button onClick={() => setErrorMsg(null)} className="font-bold hover:text-white">✕</button>
            </div>
          )}

          <div className="flex-shrink-0 w-48 mb-2">
            <WebcamOverlay
              useWebcam={useWebcam}
              webcamStream={webcamStream}
              onToggleWebcam={() => setUseWebcam(!useWebcam)}
            />
          </div>

          <QuestionCard
            questionNumber={currentIdx + 1}
            questionText={currentQuestion?.questionText || "Loading..."}
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

        {/* Right Column: Overview / History */}
        <div className="lg:col-span-1 border-l border-slate-800 bg-[#0d1525] flex flex-col h-full overflow-hidden">
          <div className="flex border-b border-slate-800 bg-[#111827]">
            <button
              onClick={() => setRightTab("OVERVIEW")}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                rightTab === "OVERVIEW"
                  ? "text-indigo-400 border-b-2 border-indigo-500"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setRightTab("HISTORY")}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                rightTab === "HISTORY"
                  ? "text-indigo-400 border-b-2 border-indigo-500"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              History & Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {rightTab === "OVERVIEW" ? (
              <div className="p-6 space-y-6">
                {interviewState && (
                  <>
                    <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Interview Status</h4>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-300">Current Difficulty</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            interviewState.currentDifficulty === 'SENIOR' ? 'text-red-300 bg-red-500/10' :
                            interviewState.currentDifficulty === 'MID' ? 'text-amber-300 bg-amber-500/10' :
                            'text-sky-300 bg-sky-500/10'
                          }`}>
                            {interviewState.currentDifficulty}
                          </span>
                        </div>

                        {interviewState.rollingAvgScore > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-300">Current Score</span>
                            <span className="text-sm font-semibold text-emerald-400">
                              {interviewState.rollingAvgScore}/100
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-300">Can End Early?</span>
                          {interviewState.canEndEarly ? (
                            <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                              <CheckCircle className="h-3.5 w-3.5" /> Yes
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">No</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-[#111827] p-5">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Competency Progress</h4>
                      <div className="space-y-3">
                        {compRequired.map((comp, i) => {
                          const isEvaluated = compEvaluated.includes(comp);
                          return (
                            <div key={i} className="flex items-center justify-between">
                              <span className={`text-sm ${isEvaluated ? "text-slate-300" : "text-slate-500"}`}>{comp}</span>
                              {isEvaluated ? (
                                <CheckCircle className="h-4 w-4 text-emerald-400" />
                              ) : (
                                <div className="h-1.5 w-1.5 rounded-full bg-slate-700" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
                {!interviewState && (
                  <p className="text-sm text-slate-500 text-center py-10">Data will populate after you answer the first question.</p>
                )}
              </div>
            ) : (
              <ChatSidebar
                isOpen={true}
                onClose={() => setRightTab("OVERVIEW")}
                messages={chatMessages}
                chatInput={chatInput}
                setChatInput={setChatInput}
                onSendMessage={handleSendChatMessage}
                onAskHint={handleAskHint}
                isGeneratingHint={isGeneratingHint}
              />
            )}
          </div>
        </div>
      </main>

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

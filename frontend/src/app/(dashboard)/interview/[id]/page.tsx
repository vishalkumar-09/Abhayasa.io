"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Editor } from "@monaco-editor/react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { motion } from "framer-motion";
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
  MessageSquare,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Code,
  Info,
  ChevronRight,
  MessageCircle,
  FileText,
  X
} from "lucide-react";

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

  // Premium Features States
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [useWebcam, setUseWebcam] = useState(true);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Real-Time Voice Agent follow-up states
  const [followUpCount, setFollowUpCount] = useState(0);
  const [followUpQuestionText, setFollowUpQuestionText] = useState("");
  const [currentBlockAnswers, setCurrentBlockAnswers] = useState<string[]>([]);
  const [followUpQuestionsHistory, setFollowUpQuestionsHistory] = useState<string[]>([]);
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false);
  const lastSpokenQuestionIdRef = useRef<number | null>(null);
  const activeSpokenTextRef = useRef<string>("");

  // Monaco Code Sandbox States
  const [codeContent, setCodeContent] = useState("");
  const [codeLanguage, setCodeLanguage] = useState("javascript");
  const [isCodingMode, setIsCodingMode] = useState(false);

  // Chat / Hint Assistant States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isGeneratingHint, setIsGeneratingHint] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // STAR method guide toggle
  const [activeTab, setActiveTab] = useState<"answer" | "star">("answer");
  const [inputMode, setInputMode] = useState<"voice" | "text">("voice");
  const [browserSupportNotice, setBrowserSupportNotice] = useState<string | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const baseAnswerTextRef = useRef<string>("");
  const isRecordingRef = useRef<boolean>(false);

  // Available Neural / Natural Voices State
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const updateVoices = () => {
        const available = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"));
        setVoices(available);
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
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

  const questions = interview?.questions || [];
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIdx];

  // Load progress index
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
    setCurrentBlockAnswers([]);
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

  // Handle active webcam stream feed
  useEffect(() => {
    if (useWebcam) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((stream) => {
          setWebcamStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
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

  // Audio / Speech Synthesis for questions
  const speakQuestion = (text?: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis || isMuted) return;

    const targetText = text || activeSpokenTextRef.current || followUpQuestionText || currentQuestion?.questionText;
    if (!targetText) return;

    activeSpokenTextRef.current = targetText;

    // Purge any lingering main-question audio from Chrome/Edge SpeechSynthesis queue
    window.speechSynthesis.cancel();

    setTimeout(() => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(targetText);

      // Find highest quality Natural / Neural English voice
      const allVoices = window.speechSynthesis.getVoices();
      let selectedVoice = allVoices.find((v) => v.voiceURI === selectedVoiceUri);

      if (!selectedVoice) {
        selectedVoice =
          allVoices.find((v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("natural")) ||
          allVoices.find((v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("neural")) ||
          allVoices.find((v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("google")) ||
          allVoices.find((v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("enhanced")) ||
          allVoices.find((v) => v.lang.startsWith("en"));
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      utterance.rate = 0.95; // Calm, articulate, executive cadence
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setIsAiSpeaking(true);
        // Stop speech recognition when AI speaks to prevent feedback looping
        if (isRecording && recognition) {
          try { recognition.stop(); } catch (e) {}
        }
      };

      utterance.onend = () => {
        setIsAiSpeaking(false);
        // Restart speech recognition automatically so candidate can reply instantly
        if (isRecording && recognition) {
          try { recognition.start(); } catch (e) {}
        }
      };

      utterance.onerror = () => {
        setIsAiSpeaking(false);
        if (isRecording && recognition) {
          try { recognition.start(); } catch (e) {}
        }
      };

      window.speechSynthesis.speak(utterance);
    }, 60);
  };

  // Speak question when question index changes or loads
  useEffect(() => {
    let t: any = null;
    if (currentQuestion && !loadingInterview && followUpCount === 0) {
      // Speak main question only when moving to a new question ID and not in follow-up mode
      if (lastSpokenQuestionIdRef.current !== currentQuestion.id) {
        lastSpokenQuestionIdRef.current = currentQuestion.id;
        t = setTimeout(() => {
          speakQuestion(currentQuestion.questionText);
        }, 500);
      }

      // Determine if coding mode is applicable (combining category attribute and keyword fallbacks)
      const textLower = currentQuestion?.questionText?.toLowerCase() || "";
      const isCoding =
        currentQuestion?.category === "DSA" ||
        textLower.includes("write a function") ||
        textLower.includes("write code") ||
        textLower.includes("write a python") ||
        textLower.includes("write a java") ||
        textLower.includes("write a javascript") ||
        textLower.includes("write a c++") ||
        textLower.includes("coding question") ||
        textLower.includes("dsa coding") ||
        textLower.includes("implement a function") ||
        textLower.includes("implement an algorithm") ||
        textLower.includes("sliding window") ||
        textLower.includes("linked list") ||
        textLower.includes("binary tree");
      setIsCodingMode(isCoding);
      
      // Load saved answer if candidate already answered this question, otherwise reset
      if (currentQuestion.answer) {
        setAnswerText(currentQuestion.answer.answerText || "");
        if (isCoding) {
          setCodeContent(currentQuestion.answer.answerText || "");
        } else {
          setCodeContent("");
        }
      } else {
        setAnswerText("");
        if (isCoding) {
          setCodeContent(
            `// Coding Sandbox - Write your code response here\nfunction solution() {\n  // Implement your algorithm...\n  return;\n}`
          );
        } else {
          setCodeContent("");
        }
      }

      // Reset chat hint assistant for new question
      setChatMessages([
        {
          role: "assistant",
          text: `Hi there! I am your AI interviewer. Let me know if you need any clarifying hints for this question.`,
        },
      ]);

      return () => {
        if (t) clearTimeout(t);
        if (typeof window !== "undefined" && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      };
    }
  }, [currentIdx, currentQuestion, loadingInterview, isMuted]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Sync Monaco editor text to submitted answerText state
  useEffect(() => {
    if (isCodingMode && codeContent) {
      setAnswerText(codeContent);
    }
  }, [codeContent, isCodingMode]);

  // Scroll Hint Chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const hasWebSpeechTranscribedRef = useRef<boolean>(false);
  const [isTranscribingAudio, setIsTranscribingAudio] = useState(false);

  // Initialize SpeechRecognition on mount
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
      } else {
        setBrowserSupportNotice("Voice dictation is limited on this browser. You can type your answers directly in Text Mode.");
        setInputMode("text");
      }
    }
  }, [isCodingMode]);

  // Mutation: Submit answer
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
      setCodeContent("");
      setErrorMsg(null);
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

  // Mutation: Complete Interview
  const completeInterviewMutation = useMutation({
    mutationFn: async () => {
      // Turn off camera stream immediately for privacy
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
      setIsRecording(true);

      // Cross-platform MediaRecorder setup with safe fallback for iOS Safari & Android Mobile
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
        // Fallback for iOS Safari: Instantiate MediaRecorder without explicit mimeType
        recorder = new MediaRecorder(stream);
      }

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        // Fallback audio transcription via Gemini if browser Web Speech API produced no text or is unsupported on mobile
        if ((!hasWebSpeechTranscribedRef.current || !recognition) && audioChunksRef.current.length > 0) {
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
      recorder.start();

      baseAnswerTextRef.current = answerText;
      isRecordingRef.current = true;
      setIsRecording(true);

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          const activeRecog = recognition || new SpeechRecognition();
          activeRecog.continuous = !isMobile;
          activeRecog.interimResults = true;
          activeRecog.lang = "en-US";

          activeRecog.onresult = (event: any) => {
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

          activeRecog.onerror = (event: any) => {
            console.error("Speech recognition error:", event.error);
          };

          activeRecog.onend = () => {
            if (isRecordingRef.current) {
              try { activeRecog.start(); } catch (e) {}
            } else {
              setIsRecording(false);
            }
          };

          setRecognition(activeRecog);
          activeRecog.start();
        } catch (e) {
          console.warn("WebSpeech recognition start failed:", e);
        }
      }
    } catch (err: any) {
      console.error("Microphone access error:", err);
      const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
      const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
      if (!isHttps && !isLocal) {
        setErrorMsg("Microphone access requires HTTPS or localhost on mobile devices. Please enable camera/microphone permissions in your mobile browser settings.");
      } else {
        setErrorMsg("Microphone access denied or unsupported. Please enable mic permissions in your browser.");
      }
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

  // Submit AI hint query
  const handleRequestHint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isGeneratingHint) return;

    const userText = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", text: userText }]);
    setIsGeneratingHint(true);

    try {
      // Map history to server client DTO formats
      const mappedHistory = chatMessages.map((c) => ({
        role: c.role,
        text: c.text,
      }));

      const res = await apiClient.post(
        `/api/v1/interviews/${interviewId}/questions/${currentQuestion.id}/hint`,
        mappedHistory
      );

      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", text: res.data.hint },
      ]);
    } catch (err) {
      console.error(err);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "I'm sorry, I encountered an issue connecting to the hint assistant. Try again.",
        },
      ]);
    } finally {
      setIsGeneratingHint(false);
    }
  };

  if (loadingInterview) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <Loader2 className="h-10 w-10 text-violet-500 animate-spin" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white">Loading Virtual Interview Room...</h3>
          <p className="text-xs text-zinc-500 mt-1">Configuring audio systems and questions...</p>
        </div>
      </div>
    );
  }

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
        <Link
          href="/interview"
          className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm transition-colors"
        >
          Return to Launcher
        </Link>
      </div>
    );
  }

  const isLastQuestion = currentIdx === totalQuestions - 1;

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

  const handleAnswerSubmit = async () => {
    if (!answerText.trim()) {
      setErrorMsg("Please type or record an answer before submitting.");
      return;
    }
    
    // Mute microphone while processing
    const wasRecording = isRecording;
    if (isRecording) {
      stopRecording();
    }

    if (followUpCount < 2) {
      setIsGeneratingFollowUp(true);
      setErrorMsg(null);
      
      const updatedAnswers = [...currentBlockAnswers, answerText];
      const updatedHistory = [...followUpQuestionsHistory];
      
      try {
        const res = await apiClient.post(
          `/api/v1/interviews/${interviewId}/questions/${currentQuestion.id}/followup`,
          {
            answerText: answerText,
            history: updatedHistory
          }
        );
        
        const nextFollowUp = res.data.followupQuestion;
        
        // Append response and updated question history
        setCurrentBlockAnswers(updatedAnswers);
        setFollowUpQuestionsHistory([...updatedHistory, nextFollowUp]);
        setFollowUpQuestionText(nextFollowUp);
        setFollowUpCount(prev => prev + 1);
        
        // Reset answer fields
        setAnswerText("");
        setCodeContent("");
        
        // Speak follow-up question
        activeSpokenTextRef.current = nextFollowUp;
        speakQuestion(nextFollowUp);
        
        // Re-enable microphone automatically if they were recording
        if (wasRecording) {
          setTimeout(() => {
            startRecording();
          }, 800);
        }
        
      } catch (err: any) {
        console.error(err);
        setErrorMsg("Failed to generate follow-up question. Skipping to next question.");
        submitFinalAnswer(updatedAnswers, updatedHistory);
      } finally {
        setIsGeneratingFollowUp(false);
      }
    } else {
      const finalAnswers = [...currentBlockAnswers, answerText];
      submitFinalAnswer(finalAnswers, followUpQuestionsHistory);
    }
  };

  const submitFinalAnswer = (answersList: string[], historyList: string[]) => {
    let concatenatedText = `Main Response: ${answersList[0] || ""}`;
    if (answersList.length > 1 && historyList.length > 0) {
      concatenatedText += `\n\nFollow-up 1: ${historyList[0]}\nResponse: ${answersList[1]}`;
    }
    if (answersList.length > 2 && historyList.length > 1) {
      concatenatedText += `\n\nFollow-up 2: ${historyList[1]}\nResponse: ${answersList[2]}`;
    }

    submitAnswerMutation.mutate({
      questionId: currentQuestion.id,
      answerText: concatenatedText,
    });
  };

  const handleCompleteEarly = () => {
    setShowCompleteModal(true);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="relative min-h-[80vh] flex flex-col gap-6">
      
      {/* Top Header Status */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-950/40 border border-zinc-900 rounded-2xl p-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className={`h-2.5 w-2.5 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`} />
          <div>
            <h2 className="text-sm font-semibold text-white">Virtual Interview Room Live</h2>
            <p className="text-[10px] text-zinc-500 mt-0.5">Session ID: {interviewId}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {/* Mute Voice Toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
              isMuted
                ? "bg-red-500/10 border-red-500/20 text-red-400"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
            }`}
            title={isMuted ? "Unmute AI Interviewer Voice" : "Mute AI Interviewer Voice"}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>

          {/* Webcam Toggle */}
          <button
            onClick={() => setUseWebcam(!useWebcam)}
            className={`p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
              !useWebcam
                ? "bg-red-500/10 border-red-500/20 text-red-400"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
            }`}
            title={useWebcam ? "Turn Off Webcam Feed" : "Turn On Webcam Feed"}
          >
            {useWebcam ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          </button>

          {/* Hint Chat Button */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 border border-violet-500/20 hover:border-violet-500/30 text-white text-xs font-semibold cursor-pointer transition-all shadow-md shadow-violet-600/10"
          >
            <MessageCircle className="h-4 w-4" />
            AI Hint Assistant
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* LEFT COLUMN: Sidebar Webcam, Progress and AI Interactor */}
        <div className="lg:col-span-1 flex flex-col gap-5">
          {/* AI INTERVIEWER CARD WITH AUDIO PULSE */}
          <div className="glass-card rounded-2xl p-5 border border-zinc-800/80 flex flex-col items-center gap-4 text-center">
            <div className="relative">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-600/20">
                <Brain className="h-8 w-8 text-white" />
              </div>
              {isAiSpeaking && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-violet-500"></span>
                </span>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-xs text-white">AI Technical Interviewer</h3>
              <p className="text-[10px] text-violet-400 font-semibold mt-1 uppercase tracking-wide">
                {isAiSpeaking ? "Speaking question..." : "Listening response..."}
              </p>
            </div>

            {/* Vocal waves animation */}
            <div className="flex justify-center items-end gap-1 h-6 w-full px-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((bar) => {
                // Generate random heights when speaking
                const heightClass = isAiSpeaking
                  ? `animate-bounce`
                  : "h-1";
                const delay = `${(bar % 4) * 0.15}s`;
                return (
                  <span
                    key={bar}
                    style={{
                      height: isAiSpeaking ? "100%" : "3px",
                      animationDelay: delay,
                      animationDuration: "0.6s",
                    }}
                    className={`w-1 rounded-full bg-violet-500/80 ${heightClass}`}
                  />
                );
              })}
            </div>

            {/* Voice Accent & Model Selector Dropdown */}
            {voices.length > 0 && (
              <div className="w-full px-2 mt-1">
                <select
                  value={selectedVoiceUri}
                  onChange={(e) => setSelectedVoiceUri(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 rounded-lg p-1.5 outline-none focus:border-violet-500 cursor-pointer text-center"
                >
                  <option value="">🎙️ Auto (Neural / Natural Voice)</option>
                  {voices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => speakQuestion(followUpQuestionText || currentQuestion?.questionText)}
              className="text-[10px] text-zinc-500 hover:text-zinc-300 font-semibold transition-colors flex items-center gap-1 bg-zinc-950/40 hover:bg-zinc-900 border border-zinc-900 px-2.5 py-1 rounded-lg cursor-pointer"
            >
              <Volume2 className="h-3 w-3" />
              Replay Question Voice
            </button>
          </div>

          {/* USER CAMERA FEED FRAME */}
          <div className="glass-card rounded-2xl border border-zinc-800/80 overflow-hidden">
            <div className="bg-zinc-950/80 px-4 py-2 border-b border-zinc-900 flex justify-between items-center">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Candidate Stream</span>
              <span className="flex h-1.5 w-1.5 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${useWebcam ? 'bg-red-400' : 'bg-zinc-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${useWebcam ? 'bg-red-500' : 'bg-zinc-500'}`}></span>
              </span>
            </div>

            <div className="relative aspect-video bg-zinc-950 flex items-center justify-center">
              {useWebcam ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="text-center p-4">
                  <VideoOff className="h-6 w-6 text-zinc-600 mx-auto mb-1.5" />
                  <p className="text-[9px] text-zinc-500">Camera Feed is Disabled</p>
                </div>
              )}
            </div>
          </div>

          {/* PROGRESS LIST */}
          <div className="glass-card rounded-2xl p-5 border border-zinc-800/80 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Brain className="h-4.5 w-4.5 text-violet-400" />
              <h3 className="font-semibold text-xs text-white">Progress Checklist</h3>
            </div>

            <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
              {questions.map((q: any, i: number) => {
                const isCurrent = i === currentIdx;
                const isAnswered = q.answered;
                return (
                  <button
                    key={q.id}
                    onClick={() => updateIndex(i)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-[11px] font-medium text-left transition-all ${
                      isCurrent
                        ? "bg-violet-600/10 border-violet-500/30 text-violet-400"
                        : "bg-zinc-950/40 border-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-900/30"
                    }`}
                  >
                    <span className="truncate max-w-[130px]">
                      Q{i + 1}: {q.questionText}
                    </span>
                    <span className="shrink-0 ml-1.5">
                      {isAnswered ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <span className="text-[8px] opacity-40">Pending</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="border-t border-zinc-900 pt-3">
              <button
                onClick={handleCompleteEarly}
                disabled={completeInterviewMutation.isPending || submitAnswerMutation.isPending}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/20 border border-red-500/25 text-red-400 text-[10px] font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                <Flag className="h-3 w-3" />
                Complete Early
              </button>
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN: Focus question and response layout */}
        <div className="lg:col-span-3 flex flex-col gap-4 relative">
          
          {/* Evaluating overlay spinner */}
          {(submitAnswerMutation.isPending || completeInterviewMutation.isPending) && (
            <div className="absolute inset-0 z-20 rounded-2xl bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center gap-4 animate-in fade-in duration-200">
              <Loader2 className="h-10 w-10 text-violet-500 animate-spin" />
              <div className="text-center">
                <h4 className="font-semibold text-white text-sm">
                  {completeInterviewMutation.isPending
                    ? "Finalizing Performance Report..."
                    : "AI Evaluator Grading Answer..."}
                </h4>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  Analyzing technical precision, coding structure, and core explanations...
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

          {/* Main Question Panel */}
          <div className="glass-card rounded-2xl border border-zinc-800/80 overflow-hidden">
            <div className="bg-zinc-950/80 px-6 py-3 border-b border-zinc-900 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-violet-400 animate-pulse" />
                <span className="text-[10px] text-zinc-400 font-bold tracking-wider uppercase">
                  {followUpCount > 0 ? `Follow-up ${followUpCount} of 2` : `Question ${currentIdx + 1} of ${totalQuestions}`}
                </span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                currentQuestion?.difficulty === "SENIOR"
                  ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                  : currentQuestion?.difficulty === "JUNIOR"
                  ? "bg-sky-500/10 border-sky-500/20 text-sky-400"
                  : "bg-zinc-500/10 border-zinc-850 text-zinc-400"
              }`}>
                {currentQuestion?.difficulty} Level
              </span>
            </div>
 
            <div className="p-6 md:p-7 flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-violet-600/15 border border-violet-500/20 text-violet-400 shrink-0">
                <MessageSquare className="h-5.5 w-5.5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base md:text-lg font-medium text-white leading-relaxed">
                  {followUpQuestionText || currentQuestion?.questionText}
                </h3>
              </div>
            </div>
          </div>

          {/* Tab Selector for STAR Guide & Answer Interface */}
          <div className="flex gap-2.5 border-b border-zinc-900 pb-1">
            <button
              onClick={() => setActiveTab("answer")}
              className={`pb-2 px-3 text-xs font-semibold transition-all border-b-2 ${
                activeTab === "answer"
                  ? "border-violet-500 text-violet-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Response Desk
            </button>
            {(interview?.interviewType === "HR" || interview?.interviewType === "BEHAVIORAL") && (
              <button
                onClick={() => setActiveTab("star")}
                className={`pb-2 px-3 text-xs font-semibold transition-all border-b-2 ${
                  activeTab === "star"
                    ? "border-violet-500 text-violet-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                💡 STAR Method Guide
              </button>
            )}
          </div>

          {/* Browser Support Notice Banner */}
          {browserSupportNotice && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 px-4 py-2 rounded-xl text-xs flex items-center gap-2">
              <Info className="h-4 w-4 shrink-0 text-amber-400" />
              <span>{browserSupportNotice}</span>
            </div>
          )}

          {/* Tab Content: STAR Helper */}
          {activeTab === "star" && (
            <div className="glass-card rounded-2xl p-5 border border-zinc-800/80 bg-zinc-950/30 text-xs text-zinc-400 leading-relaxed animate-in fade-in duration-200 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Info className="h-4 w-4 text-violet-400" />
                <span>Structure your answer using the STAR Framework</span>
              </div>
              <p>
                For technical scenarios or behavioral tasks, structured responses earn higher AI metrics:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1.5">
                <div className="p-3 bg-zinc-900/40 border border-zinc-900 rounded-xl">
                  <span className="text-violet-400 font-bold block mb-0.5">S - Situation</span>
                  Describe the situation, challenge, or the background context of the problem.
                </div>
                <div className="p-3 bg-zinc-900/40 border border-zinc-900 rounded-xl">
                  <span className="text-violet-400 font-bold block mb-0.5">T - Task</span>
                  Detail what goals were set, your responsibilities, or the design requirements.
                </div>
                <div className="p-3 bg-zinc-900/40 border border-zinc-900 rounded-xl">
                  <span className="text-violet-400 font-bold block mb-0.5">A - Action</span>
                  Explain the precise steps, coding techniques, code choices, or architectures you designed.
                </div>
                <div className="p-3 bg-zinc-900/40 border border-zinc-900 rounded-xl">
                  <span className="text-violet-400 font-bold block mb-0.5">R - Result</span>
                  State the outcome, performance numbers (e.g., speed up, test safety), or what you learned.
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: Answer Workspace (Monaco Editor Split vs Regular Text Area) */}
          {activeTab === "answer" && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              
              {/* CODE SANDBOX SPLIT LAYOUT (IF CODING/DSA) */}
              {isCodingMode ? (
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 items-stretch min-h-[420px]">
                  
                  {/* Left Notes area */}
                  <div className="xl:col-span-2 flex flex-col gap-3 glass-card border border-zinc-800/80 p-4 rounded-2xl bg-zinc-950/30">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Concept Notes</h4>
                      <div className="flex items-center gap-1.5">
                        {isRecording ? (
                          <button
                            onClick={stopRecording}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-bold animate-pulse cursor-pointer"
                          >
                            <MicOff className="h-3 w-3" /> Stop Mic
                          </button>
                        ) : (
                          <button
                            onClick={startRecording}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-600/20 border border-violet-500/20 text-violet-300 text-[9px] font-bold hover:text-white cursor-pointer"
                          >
                            <Mic className="h-3 w-3" /> Dictate Code Explain
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-[10px] text-zinc-500 leading-normal">
                      Write your code logic in the editor. You can also click the dictate button above to speak your algorithmic thinking; it will be appended as comments in the sandbox!
                    </p>

                    <textarea
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      placeholder="Write general pseudo-code, notes, or complexity analysis here..."
                      className="w-full flex-1 p-3 rounded-xl bg-zinc-950/60 border border-zinc-900 text-white placeholder-zinc-600 text-xs outline-none focus:border-violet-500 transition-all resize-none mt-1"
                    />
                  </div>

                  {/* Right Monaco Editor panel */}
                  <div className="xl:col-span-3 flex flex-col glass-card border border-zinc-800/80 rounded-2xl overflow-hidden min-h-[380px]">
                    <div className="bg-zinc-950/90 px-4 py-2 border-b border-zinc-900 flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <Code className="h-4 w-4 text-violet-400" />
                        <span className="text-[10px] text-white font-semibold">Interactive Code Editor</span>
                      </div>
                      
                      <select
                        value={codeLanguage}
                        onChange={(e) => setCodeLanguage(e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 rounded px-2 py-0.5 outline-none focus:border-violet-500 cursor-pointer"
                      >
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                      </select>
                    </div>

                    <div className="flex-1 w-full relative">
                      <Editor
                        height="100%"
                        language={codeLanguage}
                        theme="vs-dark"
                        value={codeContent}
                        onChange={(value) => setCodeContent(value || "")}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 12,
                          lineNumbers: "on",
                          automaticLayout: true,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* REGULAR TEXT RESPONSE WORKSPACE WITH VOICE / TEXT TOGGLE */
                <div className="glass-card rounded-2xl p-5 border border-zinc-800/80 flex flex-col gap-4">
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setInputMode("voice")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          inputMode === "voice"
                            ? "bg-violet-600 text-white shadow-md shadow-violet-600/20"
                            : "bg-zinc-900 text-zinc-400 hover:text-white"
                        }`}
                      >
                        <Mic className="h-3.5 w-3.5" />
                        Voice Agent Mode
                      </button>
                      <button
                        onClick={() => setInputMode("text")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          inputMode === "text"
                            ? "bg-violet-600 text-white shadow-md shadow-violet-600/20"
                            : "bg-zinc-900 text-zinc-400 hover:text-white"
                        }`}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Text Typing Mode
                      </button>
                    </div>

                    {inputMode === "voice" && (
                      <div className="flex items-center gap-2">
                        {isRecording ? (
                          <button
                            onClick={stopRecording}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 hover:border-red-500/30 text-red-400 text-xs font-semibold cursor-pointer animate-pulse"
                          >
                            <MicOff className="h-3.5 w-3.5" />
                            Stop Dictation
                          </button>
                        ) : (
                          <button
                            onClick={startRecording}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/15 border border-violet-500/20 hover:border-violet-500/30 text-violet-300 hover:text-violet-200 text-xs font-semibold cursor-pointer transition-colors"
                          >
                            <Mic className="h-3.5 w-3.5" />
                            Start Voice Dictation
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <textarea
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    rows={7}
                    placeholder={
                      inputMode === "voice"
                        ? "Click 'Start Voice Dictation' to speak your answer, or type directly here..."
                        : "Type your detailed technical response here. Ensure to cover core concepts, design trade-offs, and examples..."
                    }
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950/50 border border-zinc-850 text-white placeholder-zinc-650 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all resize-y min-h-[160px]"
                  />

                  {answerText.trim().length > 0 && answerText.trim().length < 10 && (
                    <p className="text-[11px] text-amber-400 font-medium">
                      ⚠️ Please enter at least 10 characters for a valid interview response.
                    </p>
                  )}

                  {isRecording && (
                    <div className="flex items-center gap-3 py-1 px-2.5 rounded-lg bg-violet-900/10 border border-violet-500/20 w-fit animate-pulse">
                      <span className="h-2 w-2 rounded-full bg-violet-400 animate-ping" />
                      <span className="text-[10px] text-violet-300 font-medium">
                        Listening to microphone input...
                      </span>
                    </div>
                  )}

                  {isTranscribingAudio && (
                    <div className="flex items-center gap-3 py-1 px-2.5 rounded-lg bg-violet-900/20 border border-violet-500/30 w-fit animate-pulse">
                      <Loader2 className="h-3 w-3 text-violet-400 animate-spin" />
                      <span className="text-[10px] text-violet-300 font-medium">
                        Transcribing audio via AI...
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Controls */}
              <div className="flex justify-between items-center border-t border-zinc-900 pt-4 mt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrev}
                    disabled={currentIdx === 0}
                    className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={currentIdx === totalQuestions - 1}
                    className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                  >
                    Skip
                    <SkipForward className="h-3.5 w-3.5" />
                  </button>
                </div>

                <button
                  onClick={handleAnswerSubmit}
                  disabled={submitAnswerMutation.isPending || isGeneratingFollowUp || answerText.trim().length < 10}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-bold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-violet-600/25 animate-pulse"
                >
                  {submitAnswerMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving Evaluation...
                    </>
                  ) : isGeneratingFollowUp ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      AI Interviewer is thinking...
                    </>
                  ) : followUpCount < 2 ? (
                    <>
                      Submit Answer (Follow-up {followUpCount + 1}/2)
                      <Send className="h-3.5 w-3.5 fill-current" />
                    </>
                  ) : isLastQuestion ? (
                    <>
                      Submit & Complete
                      <Send className="h-3.5 w-3.5 fill-current" />
                    </>
                  ) : (
                    <>
                      Submit & Move Next
                      <Send className="h-3.5 w-3.5 fill-current" />
                    </>
                  )}
                </button>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* COLLAPSIBLE SIDE PANEL: AI HINT ASSISTANT CHAT PANEL */}
      {isChatOpen && (
        <div className="fixed top-0 right-0 z-40 w-[350px] h-full bg-zinc-950 border-l border-zinc-900 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="px-5 py-4 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/40">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4.5 w-4.5 text-violet-400" />
              <h3 className="font-semibold text-xs text-white">AI Interviewer Chat</h3>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="p-1 rounded hover:bg-zinc-850 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Subtitle */}
          <div className="px-5 py-2.5 border-b border-zinc-900/60 bg-violet-950/10 text-[9px] text-violet-300 leading-normal flex items-start gap-2">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-violet-400" />
            <span>Need advice or clarification? Ask me here. I can provide clues, but I cannot write the final code.</span>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
            {chatMessages.map((msg, idx) => {
              const isAssistant = msg.role === "assistant";
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-2.5 max-w-[85%] ${
                    isAssistant ? "self-start" : "self-end flex-row-reverse"
                  }`}
                >
                  <div className={`p-2 rounded-xl text-xs leading-relaxed ${
                    isAssistant
                      ? "bg-zinc-900 text-zinc-350 border border-zinc-850"
                      : "bg-violet-600 text-white"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              );
            })}
            
            {isGeneratingHint && (
              <div className="flex items-center gap-2 text-zinc-500 text-[10px] italic">
                <Loader2 className="h-3 w-3 animate-spin text-violet-500" />
                Interviewer is thinking...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input form */}
          <form onSubmit={handleRequestHint} className="p-4 border-t border-zinc-900 bg-zinc-950">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask for hints or ask a question..."
                className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs outline-none focus:border-violet-500 transition-colors"
                disabled={isGeneratingHint}
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isGeneratingHint}
                className="p-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirm End Interview Early Modal */}
      <ConfirmModal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        onConfirm={() => {
          setShowCompleteModal(false);
          completeInterviewMutation.mutate();
        }}
        title="End Interview Session Early?"
        description="Are you sure you want to end this interview session early? All submitted answers will be evaluated and aggregated into your performance report."
        confirmText="End Session & Generate Report"
        cancelText="Continue Interview"
        variant="info"
        isLoading={completeInterviewMutation.isPending}
      />
    </motion.div>
  );
}

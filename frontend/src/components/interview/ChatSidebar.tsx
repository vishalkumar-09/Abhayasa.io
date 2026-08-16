"use client";

import React, { useRef, useEffect } from "react";
import { MessageSquare, Sparkles, Send, Loader2, X, Brain } from "lucide-react";

interface ChatMsg {
  role: "user" | "assistant";
  text: string;
}

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMsg[];
  chatInput: string;
  setChatInput: (val: string) => void;
  onSendMessage: () => void;
  onAskHint: () => void;
  isGeneratingHint: boolean;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = React.memo(({
  isOpen,
  onClose,
  messages,
  chatInput,
  setChatInput,
  onSendMessage,
  onAskHint,
  isGeneratingHint,
}) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 md:w-96 bg-zinc-950/95 border-l border-zinc-800 backdrop-blur-2xl z-50 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400">
            <Brain className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-xs text-white">AI Co-Pilot & Hints</h3>
            <p className="text-[10px] text-zinc-500">Ask questions or request concept hints</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Quick Hint Action Button */}
      <div className="p-3 border-b border-zinc-900 bg-zinc-950/40">
        <button
          onClick={onAskHint}
          disabled={isGeneratingHint}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/30 text-violet-300 text-xs font-semibold transition-all disabled:opacity-50"
        >
          {isGeneratingHint ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Generating Hint...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5 text-violet-400" />
              <span>Get AI Hint for This Question</span>
            </>
          )}
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-zinc-500 gap-2">
            <MessageSquare className="h-8 w-8 text-zinc-700" />
            <p className="text-xs">No chat history yet. Request a hint or ask any technical query.</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col gap-1 max-w-[85%] ${
                msg.role === "user" ? "ml-auto items-end" : "items-start"
              }`}
            >
              <div
                className={`p-3 rounded-2xl text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-violet-600 text-white rounded-br-none"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-bl-none"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-950 flex items-center gap-2">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSendMessage()}
          placeholder="Ask AI interviewer..."
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
        />
        <button
          onClick={onSendMessage}
          className="p-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-all shrink-0"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
});

ChatSidebar.displayName = "ChatSidebar";

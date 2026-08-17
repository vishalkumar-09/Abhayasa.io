"use client";

import React, { useRef, useEffect } from "react";
import { MessageSquare, Sparkles, Send, Loader2, Bot, User } from "lucide-react";

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
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-[#0d1525]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 bg-[#111827]">
        <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-indigo-400" />
          AI Co-Pilot & Hints
        </h3>
        <p className="text-xs text-slate-400 mt-1">Ask questions or request concept hints</p>
      </div>

      {/* Quick Hint Action */}
      <div className="p-3 border-b border-slate-800/50 bg-[#0a0f1e]">
        <button
          onClick={onAskHint}
          disabled={isGeneratingHint}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-semibold transition-colors disabled:opacity-50"
        >
          {isGeneratingHint ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Generating Hint...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              <span>Get AI Hint for This Question</span>
            </>
          )}
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center mb-3">
              <Bot className="h-6 w-6 text-slate-500" />
            </div>
            <p className="text-sm font-medium text-slate-300">No chat history yet</p>
            <p className="text-xs text-slate-500 mt-1">Request a hint or ask any technical query.</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div className={`shrink-0 h-6 w-6 rounded-full flex items-center justify-center ${
                msg.role === "user" ? "bg-indigo-600" : "bg-slate-700"
              }`}>
                {msg.role === "user" ? <User className="h-3.5 w-3.5 text-white" /> : <Bot className="h-3.5 w-3.5 text-slate-300" />}
              </div>
              <div
                className={`px-3 py-2 rounded-xl text-sm leading-relaxed max-w-[85%] ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-tr-sm"
                    : "bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-800 bg-[#111827]">
        <div className="relative flex items-center">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSendMessage()}
            placeholder="Ask AI interviewer..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-3 pr-10 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
          />
          <button
            onClick={onSendMessage}
            className="absolute right-1.5 p-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
});

ChatSidebar.displayName = "ChatSidebar";

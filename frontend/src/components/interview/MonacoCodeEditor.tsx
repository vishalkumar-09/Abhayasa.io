"use client";

import React from "react";
import Editor from "@monaco-editor/react";
import { Code, Sparkles } from "lucide-react";

interface MonacoCodeEditorProps {
  codeContent: string;
  setCodeContent: (code: string) => void;
  codeLanguage: string;
  setCodeLanguage: (lang: string) => void;
}

export const MonacoCodeEditor: React.FC<MonacoCodeEditorProps> = React.memo(({
  codeContent,
  setCodeContent,
  codeLanguage,
  setCodeLanguage,
}) => {
  return (
    <div className="glass-card rounded-2xl border border-zinc-800/80 overflow-hidden flex flex-col h-[400px]">
      {/* Editor Header Bar */}
      <div className="px-4 py-2.5 bg-zinc-950 border-b border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code className="h-4 w-4 text-violet-400" />
          <span className="text-xs font-semibold text-zinc-200">Interactive Coding Sandbox</span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={codeLanguage}
            onChange={(e) => setCodeLanguage(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-300 px-2.5 py-1 focus:outline-none focus:border-violet-500"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="typescript">TypeScript</option>
            <option value="sql">SQL</option>
          </select>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 bg-zinc-950">
        <Editor
          height="100%"
          language={codeLanguage}
          value={codeContent}
          theme="vs-dark"
          onChange={(val) => setCodeContent(val || "")}
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            lineNumbers: "on",
            padding: { top: 12 },
          }}
        />
      </div>
    </div>
  );
});

MonacoCodeEditor.displayName = "MonacoCodeEditor";

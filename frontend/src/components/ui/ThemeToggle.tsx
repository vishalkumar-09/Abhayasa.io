"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { motion } from "framer-motion";

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
      title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
      aria-label={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
    >
      {theme === "dark" ? (
        <>
          <Sun className="h-4 w-4 text-amber-400" />
          <span className="text-xs font-medium text-slate-400 hidden sm:inline">Light</span>
        </>
      ) : (
        <>
          <Moon className="h-4 w-4 text-indigo-500" />
          <span className="text-xs font-medium text-slate-600 hidden sm:inline">Dark</span>
        </>
      )}
    </motion.button>
  );
};

"use client";

import React from 'react';
import { Check, Zap, Lock } from 'lucide-react';

export default function UpgradePage() {
  return (
    <div className="flex flex-col items-center justify-center max-w-5xl mx-auto py-12 gap-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-50">Abhayasa Pro</h1>
        <p className="text-lg font-medium text-indigo-400 mt-1">Prepare without limits.</p>
        <p className="text-base text-slate-400 mt-3 max-w-2xl mx-auto">
          Advanced AI insights, voice-based practice, and unlimited mock sessions — coming soon.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Free Tier */}
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-8 flex flex-col relative">
          <div className="absolute top-0 right-0 -mt-3 mr-6 px-3 py-1 bg-slate-800 text-slate-300 text-xs font-semibold rounded-full border border-slate-700">
            Current Plan
          </div>
          <h3 className="text-xl font-semibold text-slate-100">Free Forever</h3>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-4xl font-bold text-slate-50">$0</span>
            <span className="text-sm font-medium text-slate-500">/month</span>
          </div>
          <p className="mt-4 text-sm text-slate-400">Everything you need to get started with basic interview prep.</p>
          
          <ul className="mt-8 space-y-4 flex-1">
            {[
              "5 interviews per month",
              "Basic feedback report",
              "Text-based answers only",
              "1 resume profile",
              "1 target job description"
            ].map((feature, i) => (
              <li key={i} className="flex items-start gap-3">
                <Check className="h-5 w-5 text-slate-600 shrink-0" />
                <span className="text-sm text-slate-300">{feature}</span>
              </li>
            ))}
          </ul>
          
          <button disabled className="mt-8 w-full bg-slate-800 border border-slate-700 text-slate-400 font-medium text-sm px-4 py-3 rounded-lg cursor-not-allowed">
            Current Plan
          </button>
        </div>

        {/* Pro Tier */}
        <div className="bg-[#111827] border-2 border-indigo-500/50 rounded-2xl p-8 flex flex-col relative shadow-[0_0_40px_rgba(99,102,241,0.1)]">
          <div className="absolute top-0 right-0 -mt-3 mr-6 px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded-full border border-indigo-500/30 flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Coming Soon
          </div>
          <h3 className="text-xl font-semibold text-slate-100">Pro</h3>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-4xl font-bold text-slate-50">$19</span>
            <span className="text-sm font-medium text-slate-500">/month</span>
          </div>
          <p className="mt-4 text-sm text-slate-400">Advanced tools for serious job seekers aiming for top tech roles.</p>
          
          <ul className="mt-8 space-y-4 flex-1">
            {[
              "Unlimited interviews",
              "Full competency breakdown reports",
              "Voice interviews with real-time feedback",
              "Unlimited resumes & job descriptions",
              "Advanced AI behavioral analysis"
            ].map((feature, i) => (
              <li key={i} className="flex items-start gap-3">
                <Check className="h-5 w-5 text-indigo-400 shrink-0" />
                <span className="text-sm text-slate-300">{feature}</span>
              </li>
            ))}
          </ul>
          
          <button disabled className="mt-8 w-full bg-slate-800 border border-slate-700 text-slate-400 font-medium text-sm px-4 py-3 rounded-lg cursor-not-allowed flex items-center justify-center gap-2">
            <Lock className="h-4 w-4" />
            Coming Soon
          </button>
        </div>
      </div>

      <p className="text-sm text-slate-500 text-center flex items-center gap-2">
        Pro plan features are currently in development. We will notify you when available.
      </p>
    </div>
  );
}

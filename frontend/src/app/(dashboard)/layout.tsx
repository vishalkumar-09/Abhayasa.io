"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  PlayCircle,
  LogOut,
  Menu,
  X,
  User,
  ShieldCheck,
  ChevronRight
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Upload Resume", href: "/upload-resume", icon: FileText },
    { name: "Job Descriptions", href: "/job-description", icon: Briefcase },
    { name: "Start Interview", href: "/interview", icon: PlayCircle },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-violet-600/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-fuchsia-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-zinc-950 border-r border-zinc-800/80 shrink-0 z-20">
        {/* Brand Logo */}
        <div className="h-16 flex items-center px-6 border-b border-zinc-800/80">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="p-1.5 rounded-lg bg-violet-600/10 border border-violet-500/20 group-hover:border-violet-500/40 transition-all">
              <ShieldCheck className="h-5 w-5 text-violet-400" />
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              InterviewForge
            </span>
          </Link>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? "bg-violet-600/10 border border-violet-500/20 text-violet-400"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 shrink-0 transition-transform ${
                    isActive ? "text-violet-400 scale-105" : "text-zinc-500 group-hover:text-zinc-300"
                  }`} />
                  {item.name}
                </div>
                {isActive && <ChevronRight className="h-3.5 w-3.5 text-violet-400" />}
              </Link>
            );
          })}
        </nav>

        {/* User profile / Logout */}
        <div className="p-4 border-t border-zinc-800/80 flex flex-col gap-3">
          {user && (
            <div className="flex items-center gap-3 px-2 py-1.5">
              <div className="h-9 w-9 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                <User className="h-4.5 w-4.5 text-violet-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-zinc-500 truncate capitalize">{user.role.toLowerCase()}</p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/5 border border-transparent hover:border-red-500/10 transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar overlay & drawer */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-30 flex">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={toggleSidebar} />

          {/* Drawer content */}
          <div className="relative flex flex-col w-72 max-w-xs bg-zinc-950 border-r border-zinc-800/80 z-40 animate-in slide-in-from-left duration-250">
            <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-violet-400" />
                <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                  InterviewForge
                </span>
              </div>
              <button onClick={toggleSidebar} className="text-zinc-400 hover:text-white p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={toggleSidebar}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-violet-600/10 border border-violet-500/20 text-violet-400"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent"
                    }`}
                  >
                    <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-violet-400" : "text-zinc-500"}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-zinc-800/80 flex flex-col gap-3">
              {user && (
                <div className="flex items-center gap-3 px-2 py-1.5">
                  <div className="h-9 w-9 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                    <User className="h-4.5 w-4.5 text-violet-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{user.name}</p>
                    <p className="text-xs text-zinc-500 truncate capitalize">{user.role.toLowerCase()}</p>
                  </div>
                </div>
              )}
              <button
                onClick={() => {
                  toggleSidebar();
                  logout();
                }}
                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/5 border border-transparent hover:border-red-500/10 transition-all cursor-pointer"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Mobile Header */}
        <header className="h-16 border-b border-zinc-800/60 bg-zinc-950/60 backdrop-blur-md flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="md:hidden text-zinc-400 hover:text-white p-1 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-base font-semibold text-zinc-200 capitalize">
              {pathname === "/dashboard"
                ? "Overview"
                : pathname.split("/")[1]?.replace("-", " ") || "InterviewForge"}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick status indicator or visual ornament */}
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              AI Engine Online
            </span>
          </div>
        </header>

        {/* Page children */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

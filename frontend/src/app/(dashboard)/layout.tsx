"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { AbhayasaLogo } from "@/components/AbhayasaLogo";
import {
  LayoutDashboard,
  ListChecks,
  FileText,
  Briefcase,
  Play,
  LogOut,
  Menu,
  X
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
    { name: "My Interviews", href: "/interviews", icon: ListChecks },
    { name: "Upload Resume", href: "/upload-resume", icon: FileText },
    { name: "Job Descriptions", href: "/job-description", icon: Briefcase },
    { name: "Start Interview", href: "/interview", icon: Play },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Dashboard";
    if (pathname === "/interviews") return "My Interviews";
    if (pathname === "/upload-resume") return "Upload Resume";
    if (pathname === "/job-description") return "Job Descriptions";
    if (pathname === "/interview") return "Start Interview";
    if (pathname === "/upgrade") return "Upgrade to Pro";
    return pathname.split("/")[1]?.replace("-", " ") || "Abhayasa";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-50 flex transition-colors duration-300">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-[#0d1525] border-r border-slate-800 shrink-0 z-20">
        {/* Brand Logo */}
        <div className="h-16 flex items-center px-4 border-b border-slate-800">
          <Link href="/dashboard" className="flex items-center">
            <AbhayasaLogo width={144} />
          </Link>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 py-6 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all group ${
                  isActive
                    ? "bg-indigo-600/10 border-l-2 border-indigo-500 text-indigo-400"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-l-2 border-transparent"
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-200"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User profile / Logout */}
        <div className="p-4 border-t border-slate-800 flex flex-col gap-2">
          {user && (
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 text-white font-medium text-sm">
                {getInitials(user.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-50 truncate">{user.name}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors cursor-pointer"
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
          <div className="relative flex flex-col w-64 bg-[#0d1525] border-r border-slate-800 z-40">
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
              <Link href="/dashboard" onClick={toggleSidebar}>
                <AbhayasaLogo width={128} />
              </Link>
              <button onClick={toggleSidebar} className="text-slate-400 hover:text-slate-200 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 py-6 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={toggleSidebar}
                    className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-indigo-600/10 border-l-2 border-indigo-500 text-indigo-400"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-l-2 border-transparent"
                    }`}
                  >
                    <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-indigo-400" : "text-slate-400"}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-800 flex flex-col gap-2">
              {user && (
                <div className="flex items-center gap-3 px-2 py-2">
                  <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 text-white font-medium text-sm">
                    {getInitials(user.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-50 truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  </div>
                </div>
              )}
              <button
                onClick={() => {
                  toggleSidebar();
                  logout();
                }}
                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors cursor-pointer"
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
        {/* Header */}
        <header className="h-16 border-b border-slate-800 bg-[#0a0f1e] flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="md:hidden text-slate-400 hover:text-slate-200 p-1 hover:bg-slate-800/50 rounded-lg transition-colors cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-semibold text-slate-100 capitalize">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              AI Engine Online
            </span>
          </div>
        </header>

        {/* Page children */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#0a0f1e]">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

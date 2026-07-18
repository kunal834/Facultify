"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import DashboardNav from "@/components/dashboards/DashboardNav";
import DashboardSidebar from "@/components/dashboards/DashboardSidebar";
import { LayoutDashboard, Users, FileText, PlusCircle, Sparkles, CheckSquare, Settings, BookMarked } from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard",     href: "/teacher",              icon: LayoutDashboard },
  { label: "My Students",   href: "/teacher/students",     icon: Users },
  { label: "My Tests",      href: "/teacher/tests",        icon: FileText },
  { label: "Create Test",   href: "/teacher/create-test",  icon: PlusCircle },
  { label: "AI Generator",  href: "/teacher/ai-generator", icon: Sparkles },
  { label: "Question Bank", href: "/teacher/question-bank",icon: BookMarked },
  { label: "Grading Center",href: "/teacher/checking",     icon: CheckSquare },
  { label: "Settings",      href: "/teacher/settings",     icon: Settings },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { activeSession, sessionLoading, initSession } = useAppStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initSession().finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready || sessionLoading) return;
    if (!activeSession || activeSession.role !== "teacher") router.replace("/dashboard");
  }, [ready, sessionLoading, activeSession, router]);

  if (!ready || sessionLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F8FAFF]">
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <span className="h-5 w-5 rounded-full border-2 border-slate-300 border-t-green-500 animate-spin" />
          Loading…
        </div>
      </div>
    );
  }

  if (!activeSession || activeSession.role !== "teacher") return null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 p-4 gap-4">
      <DashboardSidebar items={NAV_ITEMS} role="teacher" />
      <div className="flex-1 flex flex-col bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-2xl relative">
        <DashboardNav />
        <main className="flex-1 overflow-y-auto px-8 pb-8 pt-2">{children}</main>
      </div>
    </div>
  );
}

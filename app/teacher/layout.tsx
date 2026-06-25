"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import DashboardNav from "@/components/dashboards/DashboardNav";
import DashboardSidebar from "@/components/dashboards/DashboardSidebar";
import { LayoutDashboard, Users, FileText, PlusCircle, Sparkles, CheckSquare } from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard",     href: "/teacher",              icon: LayoutDashboard },
  { label: "My Students",   href: "/teacher/students",     icon: Users },
  { label: "My Tests",      href: "/teacher/tests",        icon: FileText },
  { label: "Create Test",   href: "/teacher/create-test",  icon: PlusCircle },
  { label: "AI Generator",  href: "/teacher/ai-generator", icon: Sparkles },
  { label: "Grading Center",href: "/teacher/checking",     icon: CheckSquare },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { activeSession, sessionLoading, initSession } = useAppStore();

  useEffect(() => { initSession(); }, []);

  useEffect(() => {
    if (sessionLoading) return;
    if (!activeSession) { router.replace("/auth/login"); return; }
    if (activeSession.role !== "teacher") { router.replace(`/${activeSession.role}`); }
  }, [sessionLoading, activeSession]);

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <span className="h-5 w-5 rounded-full border-2 border-slate-300 border-t-green-500 animate-spin" />
          Loading…
        </div>
      </div>
    );
  }

  if (!activeSession || activeSession.role !== "teacher") return null;

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <DashboardNav />
      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar items={NAV_ITEMS} role="teacher" />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

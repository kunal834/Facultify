"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  FileText,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Zap,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatsCard from "@/components/dashboards/StatsCard";
import PageHeader from "@/components/dashboards/PageHeader";
import { useAppStore } from "@/store/app-store";
import {
  getStudentAnalytics,
  getStudentTests,
  getStudentSubmissions,
} from "@/lib/supabase-service";
import { formatDate, cn } from "@/lib/utils";
import type { StudentAnalytics, MockTest, Submission } from "@/lib/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColorClass(pct: number): string {
  if (pct >= 80) return "text-emerald-600";
  if (pct >= 60) return "text-amber-500";
  return "text-red-500";
}

function scoreBgClass(pct: number): string {
  if (pct >= 80) return "bg-emerald-50 border-emerald-200";
  if (pct >= 60) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
}

function statusLabel(status: MockTest["status"]): { label: string; className: string } {
  if (status === "active")
    return { label: "Live now", className: "bg-emerald-100 text-emerald-700" };
  return { label: "Scheduled", className: "bg-indigo-100 text-indigo-700" };
}

function Pulse({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-slate-200", className)}
      aria-hidden="true"
    />
  );
}

// ─── Custom chart tooltip ─────────────────────────────────────────────────────

interface ChartPayloadItem {
  value: number;
  payload: { name: string; score: number; fullTitle?: string };
}

function ScoreTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ChartPayloadItem[];
}) {
  if (!active || !payload?.length) return null;
  const { fullTitle, score } = payload[0].payload;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-lg text-xs">
      {fullTitle && (
        <p className="font-semibold text-slate-800 mb-0.5 max-w-[160px] leading-snug">
          {fullTitle}
        </p>
      )}
      <p className={cn("font-bold text-lg leading-none mt-1", scoreColorClass(score))}>
        {score}%
      </p>
    </div>
  );
}

// ─── Test card ────────────────────────────────────────────────────────────────

function UpcomingTestCard({ test }: { test: MockTest }) {
  const badge = statusLabel(test.status);
  const scheduledDate = test.scheduledAt ? formatDate(test.scheduledAt) : null;

  return (
    <div className="group flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-50">
      {/* Left accent bar */}
      <div
        className={cn(
          "mt-0.5 w-1 shrink-0 self-stretch rounded-full",
          test.status === "active" ? "bg-emerald-500" : "bg-indigo-400"
        )}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
              badge.className
            )}
          >
            {badge.label}
          </span>
          <span className="text-xs text-slate-400">{test.subject}</span>
        </div>

        <p className="font-semibold text-sm text-slate-900 leading-snug truncate">
          {test.title}
        </p>

        <div className="flex flex-wrap items-center gap-3 mt-2">
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Clock className="h-3 w-3" />
            {test.durationMinutes} min
          </span>
          <span className="text-xs text-slate-400">•</span>
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <BookOpen className="h-3 w-3" />
            {test.totalMarks} marks
          </span>
          {scheduledDate && (
            <>
              <span className="text-xs text-slate-400">•</span>
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <CalendarDays className="h-3 w-3" />
                {scheduledDate}
              </span>
            </>
          )}
        </div>
      </div>

      {/* CTA */}
      <Button
        size="sm"
        asChild
        className="shrink-0 self-center gap-1.5 bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500"
      >
        <Link href={`/student/test/${test.id}`}>
          <Zap className="h-3.5 w-3.5" />
          Start Test
        </Link>
      </Button>
    </div>
  );
}

// ─── Result row ───────────────────────────────────────────────────────────────

function ResultRow({ sub, testTitle }: { sub: Submission; testTitle?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border p-3.5 transition-colors",
        scoreBgClass(sub.percentage)
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">
          {testTitle ?? "Test result"}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          {sub.submittedAt ? formatDate(sub.submittedAt) : "—"}
          {" · "}
          <span className="tabular-nums">
            {sub.totalScore}/{sub.maxScore} marks
          </span>
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 text-xl font-bold tabular-nums",
          scoreColorClass(sub.percentage)
        )}
      >
        {sub.percentage}%
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentDashboard() {
  const { activeSession } = useAppStore();
  const student = activeSession?.role === "student" ? activeSession.user : null;
  const studentId = student?.id ?? "";
  const firstName = student?.name?.split(" ")[0] ?? "Student";
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
  const track = (student?.examTrack as string) ?? "general";
  const mockConfig: Record<string, { title: string; rank: string; total: string; pct: string; status: string; cutoffText: string }> = {
    jee: {
      title: "JEE Advanced 2026 - National Live Mock 4",
      rank: "#482",
      total: "12,850",
      pct: "96.24%",
      status: "Borderline Safe",
      cutoffText: "vs JEE 2025 cutoff (91.4%)"
    },
    neet: {
      title: "NEET 2026 All-India Live Biology-focused Mock",
      rank: "#1,208",
      total: "85,340",
      pct: "98.58%",
      status: "Safe (Score 620)",
      cutoffText: "vs NEET 2025 cutoff (595)"
    },
    ssc: {
      title: "SSC CGL 2026 Tier-1 National Speed Mock",
      rank: "#84",
      total: "42,900",
      pct: "99.80%",
      status: "Highly Safe",
      cutoffText: "vs CGL 2025 Cutoff (138 marks)"
    },
    upsc: {
      title: "UPSC Civil Services 2026 Prelims GS Mock 2",
      rank: "#832",
      total: "31,000",
      pct: "97.31%",
      status: "Borderline (GS 98.5)",
      cutoffText: "vs General Cutoff (92.4)"
    },
    general: {
      title: "CUET 2026 Language & General Test Mock",
      rank: "#210",
      total: "8,200",
      pct: "97.43%",
      status: "Safe (Score 182)",
      cutoffText: "vs CUET predicted averages"
    }
  };

  const currentMock = mockConfig[track] ?? mockConfig.general;
  const [tests, setTests] = useState<MockTest[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const alive = useRef(true);
  useEffect(() => {
    if (!studentId) return;
    alive.current = true;
    setLoading(true);

    Promise.all([
      getStudentAnalytics(studentId),
      getStudentTests(studentId),
      getStudentSubmissions(studentId),
    ]).then(([a, t, s]) => {
      if (!alive.current) return;
      setAnalytics(a);
      setTests(t);
      setSubmissions(s);
      setLoading(false);
    });

    return () => {
      alive.current = false;
    };
  }, [studentId]);

  // Derived data
  const upcoming = tests.filter(
    (t) => t.status === "published" || t.status === "active"
  );
  // Sort: active first, then by scheduledAt ascending
  const sortedUpcoming = [...upcoming].sort((a, b) => {
    if (a.status === "active" && b.status !== "active") return -1;
    if (b.status === "active" && a.status !== "active") return 1;
    return (a.scheduledAt ?? "").localeCompare(b.scheduledAt ?? "");
  });

  const recentSubs = submissions
    .filter((s) => s.status === "graded" || s.status === "submitted")
    .slice(0, 3);

  // Build a testId→title map for result labels
  const testMap = new Map(tests.map((t) => [t.id, t.title]));

  const chartData =
    analytics?.scoreHistory.slice(-5).map((s) => ({
      name:
        s.testTitle.length > 14
          ? s.testTitle.substring(0, 13) + "…"
          : s.testTitle,
      fullTitle: s.testTitle,
      score: Math.round((s.score / s.maxScore) * 100),
    })) ?? [];

  const avgScore = analytics?.overallScore ?? 0;
  const avgScoreColor =
    avgScore >= 80 ? "green" : avgScore >= 60 ? "orange" : ("red" as const);

  return (
    <div className="animate-fade-in space-y-6 pb-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">Hello, {firstName}!</h1>
          <p className="text-sm text-gray-500 font-medium">
            {loading
              ? "Loading your dashboard…"
              : upcoming.length > 0
              ? `${upcoming.length} test${upcoming.length > 1 ? "s" : ""} waiting for you`
              : "You're all caught up."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="rounded-full">
            <Link href="/student/tests">
              <FileText className="h-4 w-4 mr-2" />
              My Tests
            </Link>
          </Button>
        </div>
      </div>

      {/* Row 1: Area Chart (Portfolio) + Stats Cards List (Your Assets) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Score Trend Chart Card */}
        <Card className="col-span-1 lg:col-span-2 rounded-[2rem] border border-gray-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.015)] p-6 bg-white flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Score Trend</h2>
              <p className="text-xs font-semibold text-gray-500">Your last {chartData.length} completed tests</p>
            </div>
          </div>
          <div className="w-full">
            {loading ? (
              <div className="h-[240px] animate-pulse rounded-2xl bg-slate-100" />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 8, right: 8, left: -20, bottom: 4 }}
                >
                  <defs>
                    <linearGradient id="studentScoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B6FFF" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3B6FFF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <Tooltip content={<ScoreTooltip />} cursor={{ stroke: "#3B6FFF", strokeWidth: 1 }} />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#3B6FFF"
                    strokeWidth={2.5}
                    fill="url(#studentScoreGrad)"
                    dot={{ r: 4, fill: "#3B6FFF", strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: "#3B6FFF", strokeWidth: 2, stroke: "#fff" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] flex flex-col items-center justify-center border border-dashed border-gray-200 rounded-2xl p-6 text-center text-slate-400">
                <TrendingUp className="w-10 h-10 mb-2 opacity-50 text-indigo-500" />
                <p className="text-sm font-semibold">No performance data yet</p>
                <p className="text-xs">Take your first mock test to generate score graphs.</p>
              </div>
            )}
          </div>
        </Card>

        {/* Stats List Card */}
        <div className="flex flex-col gap-4">
          <h2 className="text-base font-bold text-gray-900 px-1">Your Metrics</h2>
          {loading ? (
            <div className="space-y-4">
              <Pulse className="h-24 w-full" />
              <Pulse className="h-24 w-full" />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between p-4 bg-blue-50/40 border border-blue-100/60 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-blue-100 flex items-center justify-center shadow-sm">
                    <FileText className="w-5 h-5 text-[#3B6FFF]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Tests Attempted</p>
                    <p className="text-xs font-semibold text-gray-500">total tests taken</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-slate-900">{analytics?.testsAttempted ?? 0}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-green-50/40 border border-green-100/60 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-green-100 flex items-center justify-center shadow-sm">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Average Score</p>
                    <p className="text-xs font-semibold text-gray-500">
                      {avgScore >= 80
                        ? "Outstanding performance"
                        : avgScore >= 60
                        ? "Good — keep improving"
                        : "Room to grow"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-slate-900">{avgScore}%</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-50/40 border border-purple-100/60 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-purple-100 flex items-center justify-center shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Tests Passed</p>
                    <p className="text-xs font-semibold text-gray-500">of {analytics?.testsAttempted ?? 0} attempted</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-slate-900">{analytics?.testsPassed ?? 0}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Upcoming Tests & Recent Results + Daily Streak Promo Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Left column: Live Mock AIR Rank + Upcoming Tests Card */}
        <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">
          {/* AIR Rank Standing (Anxiety cut-off card) */}
          <div className="rounded-[2rem] border border-red-100 bg-gradient-to-r from-red-50/50 via-pink-50/10 to-white p-6 shadow-[0_12px_30px_rgba(239,68,68,0.03)] flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-[0.1em] bg-red-100 text-red-600">
                Live Mock Standings
              </span>
              <h3 className="text-lg font-black text-slate-900 leading-snug">{currentMock.title}</h3>
              <div className="flex flex-wrap items-center gap-4 mt-1">
                <span className="text-sm font-bold text-slate-700">AIR Rank: <span className="text-red-600 font-extrabold">{currentMock.rank}</span> of {currentMock.total}</span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-sm font-bold text-slate-950">Percentile: {currentMock.pct}</span>
              </div>
            </div>
            
            <div className="bg-white border border-red-100 p-4 rounded-2xl shadow-sm text-center shrink-0 min-w-[160px]">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700">
                Cut-Off Status
              </span>
              <p className="text-base font-black text-orange-600 mt-1.5">{currentMock.status}</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{currentMock.cutoffText}</p>
            </div>
          </div>

          {/* Upcoming Tests Table-like container */}
          <Card className="w-full rounded-[2rem] border border-gray-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.015)] p-6 bg-white flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Upcoming Tests</h2>
                <p className="text-xs font-semibold text-gray-500">Practice tests waiting for your submission</p>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-xs text-[#3B6FFF] hover:text-blue-800 hover:bg-blue-50/50 rounded-full">
                <Link href="/student/tests">
                  All tests
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </Button>
            </div>

            <div className="space-y-3">
              {loading ? (
                <>
                  <Pulse className="h-16" />
                  <Pulse className="h-16" />
                </>
              ) : sortedUpcoming.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center gap-2 border border-dashed border-gray-100 rounded-2xl p-6">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                  <p className="text-sm font-semibold text-slate-700">No scheduled tests right now</p>
                  <p className="text-xs text-slate-400">All tests taken! Keep checking back for updates.</p>
                </div>
              ) : (
                sortedUpcoming.map((t) => (
                  <UpcomingTestCard key={t.id} test={t} />
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Gamified Streak Card (Ad Banner look) */}
        <div className="rounded-[2rem] border border-slate-900 bg-slate-950 text-white p-6 sm:p-8 flex flex-col justify-between shadow-[0_15px_40px_rgba(0,0,0,0.15)] relative overflow-hidden group min-h-[250px]">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl opacity-15 pointer-events-none"
            style={{ background: "radial-gradient(circle, #3B6FFF 0%, #7C3AED 100%)" }}
          />
          <div className="relative z-10 flex flex-col gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-[0.1em] bg-blue-600/30 text-blue-400 w-fit">
              Learning Streak
            </span>
            <h2 className="text-xl font-black leading-tight">Keep up the daily momentum!</h2>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Complete regular daily practices and mock tests to earn top grades, badges, and detailed learning gap checklists.
            </p>
          </div>
          <div className="relative z-10 mt-6">
            <Button asChild className="w-full rounded-full bg-white hover:bg-slate-100 text-slate-950 font-bold py-3.5 hover:shadow-lg transition-all duration-300">
              <Link href="/student/tests">
                Start Next Test
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

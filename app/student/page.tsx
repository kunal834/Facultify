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
    <div className="animate-fade-in">
      {/* ── Header ── */}
      <PageHeader
        title={`Hello, ${firstName}! Ready to ace your next test?`}
        subtitle={
          loading
            ? "Loading your dashboard…"
            : upcoming.length > 0
            ? `${upcoming.length} test${upcoming.length > 1 ? "s" : ""} waiting for you`
            : "You're all caught up."
        }
      />

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {loading ? (
          <>
            <Pulse className="h-28" />
            <Pulse className="h-28" />
            <Pulse className="h-28" />
          </>
        ) : (
          <>
            <StatsCard
              title="Tests Attempted"
              value={analytics?.testsAttempted ?? 0}
              subtitle="total tests taken"
              icon={FileText}
              color="blue"
            />
            <StatsCard
              title="Average Score"
              value={`${avgScore}%`}
              subtitle={
                avgScore >= 80
                  ? "Outstanding performance"
                  : avgScore >= 60
                  ? "Good — keep improving"
                  : "Room to grow"
              }
              icon={TrendingUp}
              color={avgScoreColor}
            />
            <StatsCard
              title="Tests Passed"
              value={analytics?.testsPassed ?? 0}
              subtitle={
                analytics
                  ? `of ${analytics.testsAttempted} attempted`
                  : "—"
              }
              icon={CheckCircle2}
              color="green"
            />
          </>
        )}
      </div>

      {/* ── Main grid: upcoming + results ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Upcoming Tests — takes 2/3 width on large screens */}
        <Card className="col-span-1 lg:col-span-2 border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700">
              Upcoming Tests
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50">
              <Link href="/student/tests">
                All tests
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <>
                <Pulse className="h-20" />
                <Pulse className="h-20" />
              </>
            ) : sortedUpcoming.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                <p className="text-sm font-medium text-slate-700">
                  No tests scheduled right now.
                </p>
                <p className="text-xs text-slate-400">
                  Check back later — your teacher will post new tests here.
                </p>
              </div>
            ) : (
              sortedUpcoming.map((t) => (
                <UpcomingTestCard key={t.id} test={t} />
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Results — 1/3 width */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700">
              Recent Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {loading ? (
              <>
                <Pulse className="h-14" />
                <Pulse className="h-14" />
                <Pulse className="h-14" />
              </>
            ) : recentSubs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                <FileText className="h-7 w-7 text-slate-300" />
                <p className="text-sm text-slate-500">No results yet.</p>
                <p className="text-xs text-slate-400">
                  Completed tests will appear here.
                </p>
              </div>
            ) : (
              recentSubs.map((s) => (
                <ResultRow
                  key={s.id}
                  sub={s}
                  testTitle={testMap.get(s.testId)}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Score Trend Chart ── */}
      {!loading && chartData.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-slate-700">
                  Score Trend
                </CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">
                  Your last {chartData.length} completed tests
                </p>
              </div>
              {/* Inline legend */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="inline-block h-2 w-6 rounded-full bg-indigo-500 opacity-70" />
                Score %
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart
                data={chartData}
                margin={{ top: 8, right: 8, left: -20, bottom: 4 }}
              >
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
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
                <Tooltip
                  content={<ScoreTooltip />}
                  cursor={{ stroke: "#4F46E5", strokeWidth: 1, strokeDasharray: "4 3" }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#4F46E5"
                  strokeWidth={2.5}
                  fill="url(#scoreGrad)"
                  dot={{ r: 4, fill: "#4F46E5", strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "#4F46E5", strokeWidth: 2, stroke: "#fff" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

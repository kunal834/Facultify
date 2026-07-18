"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Users,
  FileText,
  CheckSquare,
  TrendingUp,
  PlusCircle,
  Sparkles,
  AlertCircle,
  ArrowRight,
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import StatsCard from "@/components/dashboards/StatsCard";
import PageHeader from "@/components/dashboards/PageHeader";
import { useAppStore } from "@/store/app-store";
import { getTeacherAnalytics, getTests, getBatches } from "@/lib/supabase-service";
import { cn } from "@/lib/utils";
import type { Batch, MockTest, TeacherAnalytics } from "@/lib/types";

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  draft:     "bg-slate-100 text-slate-600 border-slate-200",
  published: "bg-blue-50  text-blue-700  border-blue-200",
  active:    "bg-green-50 text-green-700 border-green-200",
  closed:    "bg-slate-100 text-slate-500 border-slate-200",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600 border-slate-200"
      )}
    >
      {status}
    </span>
  );
}

// ─── Bar chart colour ─────────────────────────────────────────────────────────

function barFill(score: number): string {
  if (score >= 80) return "#2563eb"; // blue-600  — strong
  if (score >= 70) return "#3b82f6"; // blue-500  — good
  if (score >= 60) return "#60a5fa"; // blue-400  — fair
  return "#94a3b8";                  // slate-400 — needs attention
}

// ─── Custom chart tooltip ─────────────────────────────────────────────────────

interface TooltipEntry {
  value: number;
  payload: { testTitle: string; avgScore: number; date: string };
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
}) {
  if (!active || !payload?.length) return null;
  const { testTitle, avgScore, date } = payload[0].payload;
  return (
    <div className="rounded-lg border bg-white px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-slate-800 mb-0.5">{testTitle}</p>
      <p className="text-slate-400">{date}</p>
      <p className="text-blue-600 font-bold mt-1">{avgScore}% avg score</p>
    </div>
  );
}

// ─── Skeleton helpers ─────────────────────────────────────────────────────────

function Pulse({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-200", className)}
      aria-hidden="true"
    />
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <Pulse className="h-3 w-28" />
            <Pulse className="h-8 w-16" />
            <Pulse className="h-3 w-20" />
          </div>
          <Pulse className="h-12 w-12 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TeacherDashboard() {
  const { activeSession } = useAppStore();
  const teacher =
    activeSession?.role === "teacher" ? activeSession.user : null;
  const teacherId = teacher?.id ?? "";

  const [analytics, setAnalytics] = useState<TeacherAnalytics | null>(null);
  const [tests, setTests]         = useState<MockTest[]>([]);
  const [batches, setBatches]     = useState<Batch[]>([]);
  const [loading, setLoading]     = useState(true);

  const alive = useRef(true);
  useEffect(() => {
    if (!teacherId) return;
    alive.current = true;
    setLoading(true);

    Promise.all([
      getTeacherAnalytics(teacherId),
      getTests(teacherId),
      getBatches(teacherId),
    ]).then(([a, t, b]) => {
      if (!alive.current) return;
      setAnalytics(a);
      setTests(t.slice(0, 5));
      setBatches(b);
      setLoading(false);
    });

    return () => {
      alive.current = false;
    };
  }, [teacherId]);

  // Batch name lookup
  const batchName = (batchId: string) =>
    batches.find((b) => b.id === batchId)?.name ?? "—";

  const teacherName = teacher?.name ?? "Teacher";

  return (
    <div className="animate-fade-in space-y-6 pb-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">Welcome, {teacherName}!</h1>
          <p className="text-sm text-gray-500 font-medium">Here&apos;s what&apos;s happening across your classes today.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="rounded-full">
            <Link href="/teacher/create-test">
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Test
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="rounded-full border-gray-200">
            <Link href="/teacher/ai-generator">
              <Sparkles className="h-4 w-4 mr-2" />
              Generate with AI
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Pending grading alert ── */}
      {!loading && analytics && analytics.pendingGrading > 0 && (
        <Alert className="border-amber-200 bg-amber-50 rounded-2xl">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 font-medium">
            <strong>{analytics.pendingGrading}</strong>{" "}
            {analytics.pendingGrading === 1 ? "submission is" : "submissions are"} waiting
            for your review.{" "}
            <Link
              href="/teacher/checking"
              className="font-bold underline underline-offset-2 hover:text-amber-900"
            >
              Go to Grading Center →
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Row 1: Area Chart (Portfolio) + Stats Cards List (Your Assets) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Performance Chart Card */}
        <Card className="col-span-1 lg:col-span-2 rounded-[2rem] border border-gray-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.015)] p-6 bg-white flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Recent Test Performance</h2>
              <p className="text-xs font-semibold text-gray-500">Average score % across last {analytics?.recentTestScores.length ?? 0} tests</p>
            </div>
          </div>
          <div className="w-full">
            {analytics ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart
                  data={analytics.recentTestScores}
                  margin={{ top: 8, right: 8, left: -20, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="teacherScoreColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B6FFF" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3B6FFF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="testTitle"
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#3B6FFF", strokeWidth: 1 }} />
                  <Area type="monotone" dataKey="avgScore" stroke="#3B6FFF" strokeWidth={2.5} fillOpacity={1} fill="url(#teacherScoreColor)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] animate-pulse rounded-2xl bg-slate-100" />
            )}
          </div>
        </Card>

        {/* Stats List Card */}
        <div className="flex flex-col gap-4">
          <h2 className="text-base font-bold text-gray-900 px-1">Your Metrics</h2>
          {loading ? (
            <div className="space-y-4">
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between p-4 bg-blue-50/40 border border-blue-100/60 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-blue-100 flex items-center justify-center shadow-sm">
                    <Users className="w-5 h-5 text-[#3B6FFF]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">My Students</p>
                    <p className="text-xs font-semibold text-gray-500">across all batches</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-slate-900">{analytics?.totalStudents ?? 0}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-purple-50/40 border border-purple-100/60 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-purple-100 flex items-center justify-center shadow-sm">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Tests Created</p>
                    <p className="text-xs font-semibold text-gray-500">total tests authored</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-slate-900">{analytics?.totalTestsCreated ?? 0}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-orange-50/40 border border-orange-100/60 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-orange-100 flex items-center justify-center shadow-sm">
                    <CheckSquare className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Pending Grading</p>
                    <p className="text-xs font-semibold text-gray-500">{analytics?.pendingGrading ? "Action required" : "All caught up"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-slate-900">{analytics?.pendingGrading ?? 0}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50/40 border border-green-100/60 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-green-100 flex items-center justify-center shadow-sm">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Avg Class Score</p>
                    <p className="text-xs font-semibold text-gray-500">across all tests</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-slate-900">{analytics?.avgClassScore ?? 0}%</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Recent Tests Table + Dark AI Promo Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Recent Tests Table Card */}
        <Card className="col-span-1 lg:col-span-2 rounded-[2rem] border border-gray-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.015)] p-6 bg-white flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Recent Tests</h2>
              <p className="text-xs font-semibold text-gray-500">Status of your authored question papers</p>
            </div>
            <Button asChild variant="outline" size="sm" className="rounded-full border-gray-200">
              <Link href="/teacher/tests">View all</Link>
            </Button>
          </div>

          <div className="p-0">
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <Pulse key={i} className="h-10 w-full rounded-xl" />
                ))}
              </div>
            ) : tests.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400 font-medium">
                No tests yet.{" "}
                <Link
                  href="/teacher/create-test"
                  className="font-bold text-blue-600 hover:underline"
                >
                  Create your first test →
                </Link>
              </div>
            ) : (
              <div className="overflow-hidden border border-gray-100 rounded-2xl bg-gray-50/50">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50/50 border-b border-gray-100">
                      <TableHead className="text-gray-500 font-bold text-xs">Title</TableHead>
                      <TableHead className="text-gray-500 font-bold text-xs">Batch</TableHead>
                      <TableHead className="text-gray-500 font-bold text-xs">Status</TableHead>
                      <TableHead className="text-right text-gray-500 font-bold text-xs">Marks</TableHead>
                      <TableHead className="text-right text-gray-500 font-bold text-xs">Attempts</TableHead>
                      <TableHead className="text-right text-gray-500 font-bold text-xs pr-4">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white">
                    {tests.map((test) => (
                      <TableRow key={test.id} className="hover:bg-slate-50/30 border-b border-gray-100">
                        <TableCell className="max-w-[200px] py-3.5">
                          <span className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-slate-800 leading-snug">
                              {test.title}
                            </span>
                            {test.aiGenerated && (
                              <Badge className="bg-purple-100 text-purple-700 border-0 text-[10px] px-1.5 py-0 font-bold">
                                AI
                              </Badge>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500 whitespace-nowrap">
                          {batchName(test.batchId)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={test.status} />
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium text-slate-700 tabular-nums">
                          {test.totalMarks}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium text-slate-700 tabular-nums">
                          {test.attemptCount}
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <Link
                            href={`/teacher/tests`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            Open
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </Card>

        {/* AI Promo Banner (Ad Banner look) */}
        <div className="rounded-[2rem] border border-slate-900 bg-slate-950 text-white p-6 sm:p-8 flex flex-col justify-between shadow-[0_15px_40px_rgba(0,0,0,0.15)] relative overflow-hidden group min-h-[250px]">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl opacity-15 pointer-events-none"
            style={{ background: "radial-gradient(circle, #3B6FFF 0%, #7C3AED 100%)" }}
          />
          <div className="relative z-10 flex flex-col gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-[0.1em] bg-blue-600/30 text-blue-400 w-fit">
              AI Powerpack
            </span>
            <h2 className="text-xl font-black leading-tight">Create complete exams in seconds!</h2>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Create balanced exams tailored to specific chapters, topic bounds, and custom rubrics instantly.
            </p>
          </div>
          <div className="relative z-10 mt-6">
            <Button asChild className="w-full rounded-full bg-white hover:bg-slate-100 text-slate-950 font-bold py-3.5 hover:shadow-lg transition-all duration-300">
              <Link href="/teacher/ai-generator">
                Generate with AI
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

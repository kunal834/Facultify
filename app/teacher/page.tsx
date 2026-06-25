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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
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
    <div className="animate-fade-in">
      {/* ── Header ── */}
      <PageHeader
        title={`Welcome back, ${teacherName}!`}
        subtitle="Here's what's happening across your classes today."
      >
        <Button asChild size="sm" variant="outline">
          <Link href="/teacher/ai-generator">
            <Sparkles className="h-4 w-4 mr-2" />
            Generate with AI
          </Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/teacher/create-test">
            <PlusCircle className="h-4 w-4 mr-2" />
            Create New Test
          </Link>
        </Button>
      </PageHeader>

      {/* ── Pending grading alert ── */}
      {!loading && analytics && analytics.pendingGrading > 0 && (
        <Alert className="mb-6 border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>{analytics.pendingGrading}</strong>{" "}
            {analytics.pendingGrading === 1 ? "submission is" : "submissions are"} waiting
            for your review.{" "}
            <Link
              href="/teacher/checking"
              className="font-semibold underline underline-offset-2"
            >
              Go to Grading Center →
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatsCard
              title="My Students"
              value={analytics?.totalStudents ?? 0}
              subtitle="across all batches"
              icon={Users}
              color="blue"
            />
            <StatsCard
              title="Tests Created"
              value={analytics?.totalTestsCreated ?? 0}
              subtitle="total tests authored"
              icon={FileText}
              color="purple"
            />
            <StatsCard
              title="Pending Grading"
              value={analytics?.pendingGrading ?? 0}
              subtitle={
                analytics?.pendingGrading
                  ? "action required"
                  : "all caught up"
              }
              icon={CheckSquare}
              color={
                analytics && analytics.pendingGrading > 0 ? "orange" : "green"
              }
            />
            <StatsCard
              title="Avg Class Score"
              value={`${analytics?.avgClassScore ?? 0}%`}
              subtitle="across all tests"
              icon={TrendingUp}
              color="green"
              trend={{ value: 5, label: "vs last test" }}
            />
          </>
        )}
      </div>

      {/* ── Chart + Quick actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Bar chart — last 5 test avg scores */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">
              Recent Test Performance
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Average score % across last {analytics?.recentTestScores.length ?? 5} tests
            </p>
          </CardHeader>
          <CardContent>
            {analytics ? (
              <ResponsiveContainer width="100%" height={232}>
                <BarChart
                  data={analytics.recentTestScores}
                  margin={{ top: 8, right: 8, left: -20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f1f5f9"
                    vertical={false}
                  />
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
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: "#f8fafc" }}
                  />
                  <Bar dataKey="avgScore" radius={[4, 4, 0, 0]} maxBarSize={52}>
                    {analytics.recentTestScores.map((entry) => (
                      <Cell
                        key={entry.testTitle}
                        fill={barFill(entry.avgScore)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[232px] animate-pulse rounded-lg bg-slate-100" />
            )}
          </CardContent>
        </Card>

        {/* Quick actions + top performer */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-between" variant="default">
              <Link href="/teacher/create-test">
                <span className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Create New Test
                </span>
                <ArrowRight className="h-4 w-4 opacity-60" />
              </Link>
            </Button>
            <Button
              asChild
              className="w-full justify-between"
              variant="outline"
            >
              <Link href="/teacher/ai-generator">
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Generate with AI
                </span>
                <ArrowRight className="h-4 w-4 opacity-60" />
              </Link>
            </Button>

            {/* Top performer callout */}
            {analytics?.topPerformer && (
              <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
                <p className="text-xs font-medium text-green-600 mb-1">
                  Top Performer
                </p>
                <p className="font-bold text-slate-900 text-sm">
                  {analytics.topPerformer}
                </p>
              </div>
            )}

            {!analytics && (
              <>
                <Pulse className="h-10 w-full rounded-lg" />
                <Pulse className="h-10 w-full rounded-lg" />
                <Pulse className="mt-4 h-16 w-full rounded-xl" />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Tests Table ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-semibold text-slate-700">
            My Recent Tests
          </CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href="/teacher/tests">View all</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[0, 1, 2].map((i) => (
                <Pulse key={i} className="h-10 w-full rounded" />
              ))}
            </div>
          ) : tests.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No tests yet.{" "}
              <Link
                href="/teacher/create-test"
                className="font-medium text-blue-600 hover:underline"
              >
                Create your first test →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total Marks</TableHead>
                    <TableHead className="text-right">Attempts</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tests.map((test) => (
                    <TableRow key={test.id}>
                      {/* Title + AI badge */}
                      <TableCell className="max-w-[220px]">
                        <span className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm text-slate-800 leading-snug">
                            {test.title}
                          </span>
                          {test.aiGenerated && (
                            <Badge className="bg-purple-100 text-purple-700 border-0 text-[10px] px-1.5 py-0">
                              AI
                            </Badge>
                          )}
                        </span>
                      </TableCell>

                      {/* Batch name resolved from batches list */}
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {batchName(test.batchId)}
                      </TableCell>

                      {/* Status badge */}
                      <TableCell>
                        <StatusBadge status={test.status} />
                      </TableCell>

                      {/* Total marks */}
                      <TableCell className="text-right text-sm tabular-nums">
                        {test.totalMarks}
                      </TableCell>

                      {/* Attempt count */}
                      <TableCell className="text-right text-sm tabular-nums">
                        {test.attemptCount}
                      </TableCell>

                      {/* Open link */}
                      <TableCell className="text-right">
                        <Link
                          href={`/teacher/tests`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
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
        </CardContent>
      </Card>
    </div>
  );
}

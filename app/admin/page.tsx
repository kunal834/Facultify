"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  FileText,
  Sparkles,
  PlusCircle,
  BarChart3,
  Clock,
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
import StatsCard from "@/components/dashboards/StatsCard";
import PageHeader from "@/components/dashboards/PageHeader";
import { useAppStore } from "@/store/app-store";
import { getAdminAnalytics } from "@/lib/supabase-service";
import { createBrowserClient } from "@supabase/ssr";

const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

import { cn } from "@/lib/utils";
import type { AdminAnalytics } from "@/lib/types";

// ─── Static mock data ─────────────────────────────────────────────────────────

const ACTIVITY = [
  {
    text: "Dr. Ananya Sharma created test 'Quadratic Equations'",
    time: "2 hours ago",
    type: "test",
  },
  {
    text: "New student Arjun Patel enrolled in Class 11-A",
    time: "5 hours ago",
    type: "student",
  },
  {
    text: "Prof. Rahul Verma published Physics Mid Term",
    time: "1 day ago",
    type: "test",
  },
  {
    text: "Invoice #INV-003 generated for July 2024",
    time: "2 days ago",
    type: "billing",
  },
  {
    text: "Subscription renewed — Growth Plan active",
    time: "3 days ago",
    type: "billing",
  },
] as const;

const ACTIVITY_DOT_COLOR: Record<string, string> = {
  test: "bg-blue-500",
  student: "bg-green-500",
  billing: "bg-orange-500",
};

// Bar colors — higher score gets a deeper blue, lower gets slate
function barFill(avgScore: number): string {
  if (avgScore >= 80) return "#2563eb"; // blue-600
  if (avgScore >= 70) return "#3b82f6"; // blue-500
  if (avgScore >= 60) return "#60a5fa"; // blue-400
  return "#94a3b8"; // slate-400
}

// ─── Skeleton helpers ─────────────────────────────────────────────────────────

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-slate-200",
        className
      )}
      aria-hidden="true"
    />
  );
}

function StatsCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="h-3 w-28" />
            <SkeletonBlock className="h-8 w-16" />
            <SkeletonBlock className="h-3 w-20" />
          </div>
          <SkeletonBlock className="h-12 w-12 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

interface TooltipPayload {
  value: number;
  payload: { testTitle: string; avgScore: number; date: string };
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
}) {
  if (!active || !payload?.length) return null;
  const { testTitle, avgScore, date } = payload[0].payload;
  return (
    <div className="rounded-lg border bg-white px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-slate-800 mb-1">{testTitle}</p>
      <p className="text-slate-500">{date}</p>
      <p className="text-blue-600 font-bold mt-1">{avgScore}% avg score</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface ChartEntry { testTitle: string; avgScore: number; date: string }

export default function AdminDashboard() {
  const { activeSession } = useAppStore();
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [chartData, setChartData] = useState<ChartEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const institutionId = activeSession?.role === "admin" ? activeSession.user.id : "";
  const institutionName = activeSession?.role === "admin" ? activeSession.user.name : "Your Institution";

  useEffect(() => {
    if (!institutionId) return;
    let cancelled = false;
    setLoading(true);

    const supabase = createClient();

    Promise.all([
      getAdminAnalytics(institutionId),
      supabase
        .from("tests")
        .select("title, avg_score, created_at")
        .eq("institution_id", institutionId)
        .neq("status", "draft")
        .order("created_at", { ascending: false })
        .limit(5),
    ]).then(([a, { data: tests }]) => {
      if (cancelled) return;
      setAnalytics(a);
      setChartData(
        (tests ?? []).map((t) => ({
          testTitle: t.title,
          avgScore:  Math.round(Number(t.avg_score) || 0),
          date:      new Date(t.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        }))
      );
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [institutionId]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Dashboard — ${institutionName}`}
        subtitle="Overview of your institution's activity and performance"
      >
        <Button asChild size="sm">
          <Link href="/admin/teachers">
            <PlusCircle className="h-4 w-4 mr-2" />
            Invite Teacher
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/admin/analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            View Analytics
          </Link>
        </Button>
      </PageHeader>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {loading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            <StatsCard
              title="Active Teachers"
              value={analytics?.activeTeachers ?? 0}
              subtitle={`of ${analytics?.totalTeachers ?? "—"} total`}
              icon={Users}
              color="blue"
              trend={{ value: 12, label: "vs last month" }}
            />
            <StatsCard
              title="Enrolled Students"
              value={analytics?.totalStudents ?? 0}
              subtitle={`${analytics?.activeStudents ?? "—"} active`}
              icon={GraduationCap}
              color="green"
              trend={{ value: 8, label: "vs last month" }}
            />
            <StatsCard
              title="Tests Created"
              value={analytics?.totalTestsCreated ?? 0}
              subtitle={`${analytics?.testsThisMonth ?? "—"} this month`}
              icon={FileText}
              color="purple"
              trend={{ value: 3, label: "vs last month" }}
            />
            <StatsCard
              title="AI Credits Used"
              value={`${analytics?.aiGenerationsUsed ?? 0}/${analytics?.aiGenerationsLimit ?? 100}`}
              subtitle="generations this month"
              icon={Sparkles}
              color="orange"
            />
          </>
        )}
      </div>

      {/* ── Chart + Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar chart */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">
              Recent Test Performance
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Avg score % across last {chartData.length} tests
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 8, left: -20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="testTitle"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  width={80}
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
                <Bar dataKey="avgScore" radius={[4, 4, 0, 0]} maxBarSize={48}>
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.testTitle}
                      fill={barFill(entry.avgScore)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Activity feed */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">
              Recent Activity
            </CardTitle>
            <p className="text-xs text-muted-foreground">Last 5 events</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {ACTIVITY.map((item, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-1">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full flex-shrink-0",
                        ACTIVITY_DOT_COLOR[item.type] ?? "bg-slate-400"
                      )}
                    />
                    {i < ACTIVITY.length - 1 && (
                      <span className="w-px flex-1 bg-slate-100 min-h-[12px]" />
                    )}
                  </div>
                  <div className="pb-2">
                    <p className="text-slate-700 leading-snug">{item.text}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      {item.time}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* ── Quick actions ── */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/teachers">
            <PlusCircle className="h-4 w-4 mr-2" />
            Invite Teacher
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            View Analytics
          </Link>
        </Button>
      </div>
    </div>
  );
}

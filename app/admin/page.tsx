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
import { getAdminAnalytics } from "@/lib/supabase-service";
import { createBrowserClient } from "@supabase/ssr";

const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

import { cn, timeAgo } from "@/lib/utils";
import type { AdminAnalytics } from "@/lib/types";

// ─── Activity feed types ──────────────────────────────────────────────────────

interface ActivityItem {
  text: string;
  time: string;
  type: "test" | "student" | "teacher" | "billing";
}

const ACTIVITY_DOT_COLOR: Record<string, string> = {
  test:    "bg-blue-500",
  student: "bg-green-500",
  teacher: "bg-violet-500",
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
  const [activity, setActivity] = useState<ActivityItem[]>([]);
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
      // Chart data
      supabase
        .from("tests")
        .select("title, avg_score, created_at")
        .eq("institution_id", institutionId)
        .neq("status", "draft")
        .order("created_at", { ascending: false })
        .limit(5),
      // Activity: recent tests
      supabase
        .from("tests")
        .select("title, created_at, status, teachers(name)")
        .eq("institution_id", institutionId)
        .order("created_at", { ascending: false })
        .limit(5),
      // Activity: recent students
      supabase
        .from("students")
        .select("name, enrolled_at, batches(name)")
        .eq("institution_id", institutionId)
        .order("enrolled_at", { ascending: false })
        .limit(5),
      // Activity: recent teachers
      supabase
        .from("teachers")
        .select("name, joined_at")
        .eq("institution_id", institutionId)
        .order("joined_at", { ascending: false })
        .limit(5),
      // Activity: recent invoices
      supabase
        .from("invoices")
        .select("id, issued_at, amount")
        .eq("institution_id", institutionId)
        .order("issued_at", { ascending: false })
        .limit(3),
    ]).then(([a, { data: tests }, { data: recentTests }, { data: recentStudents }, { data: recentTeachers }, { data: recentInvoices }]) => {
      if (cancelled) return;
      setAnalytics(a);
      setChartData(
        (tests ?? []).map((t) => ({
          testTitle: t.title,
          avgScore:  Math.round(Number(t.avg_score) || 0),
          date:      new Date(t.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        }))
      );

      // Build activity feed from real data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items: { text: string; type: ActivityItem["type"]; ts: number }[] = [];

      for (const t of recentTests ?? []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const teacherName = (t as any).teachers?.name ?? "A teacher";
        const action = t.status === "draft" ? "created" : "published";
        items.push({ text: `${teacherName} ${action} test "${t.title}"`, type: "test", ts: new Date(t.created_at).getTime() });
      }
      for (const s of recentStudents ?? []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const batchName = (s as any).batches?.name ?? "a batch";
        items.push({ text: `${s.name} enrolled in ${batchName}`, type: "student", ts: new Date(s.enrolled_at).getTime() });
      }
      for (const t of recentTeachers ?? []) {
        items.push({ text: `${t.name} joined as teacher`, type: "teacher", ts: new Date(t.joined_at).getTime() });
      }
      for (const inv of recentInvoices ?? []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const amt = (inv as any).amount ? `$${Number((inv as any).amount).toFixed(0)}` : "";
        items.push({ text: `Invoice${amt ? ` of ${amt}` : ""} generated`, type: "billing", ts: new Date(inv.issued_at).getTime() });
      }

      items.sort((a, b) => b.ts - a.ts);
      setActivity(
        items.slice(0, 5).map((i) => ({ text: i.text, type: i.type, time: timeAgo(new Date(i.ts).toISOString()) }))
      );

      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [institutionId]);

  return (
    <div className="animate-fade-in space-y-6 pb-6">
      {/* Page Header mimicking the Overview title / right widgets */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">Overview</h1>
          <p className="text-sm text-gray-500 font-medium">Institution activity and performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="rounded-full">
            <Link href="/admin/teachers">
              <PlusCircle className="h-4 w-4 mr-2" />
              Invite Teacher
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="rounded-full border-gray-200">
            <Link href="/admin/analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics
            </Link>
          </Button>
        </div>
      </div>

      {/* Row 1: Area Chart (Portfolio) + Stats Cards List (Your Assets) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Performance Chart Card */}
        <Card className="col-span-1 lg:col-span-2 rounded-[2rem] border border-gray-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.015)] p-6 bg-white flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Recent Test Performance</h2>
              <p className="text-xs font-semibold text-gray-500">Average score % across last {chartData.length} tests</p>
            </div>
          </div>
          <div className="w-full">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart
                data={chartData}
                margin={{ top: 8, right: 8, left: -20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B6FFF" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3B6FFF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="testTitle"
                  tick={{ fontSize: 11, fill: "#64748b" }}
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
                <Area type="monotone" dataKey="avgScore" stroke="#3B6FFF" strokeWidth={2.5} fillOpacity={1} fill="url(#scoreColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Stats List Card */}
        <div className="flex flex-col gap-4">
          <h2 className="text-base font-bold text-gray-900 px-1">Your Metrics</h2>
          {loading ? (
            <div className="space-y-4">
              <StatsCardSkeleton />
              <StatsCardSkeleton />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between p-4 bg-blue-50/40 border border-blue-100/60 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-blue-100 flex items-center justify-center shadow-sm">
                    <Users className="w-5 h-5 text-[#3B6FFF]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Active Teachers</p>
                    <p className="text-xs font-semibold text-gray-500">of {analytics?.totalTeachers ?? "—"} total</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-slate-900">{analytics?.activeTeachers ?? 0}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-green-50/40 border border-green-100/60 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-green-100 flex items-center justify-center shadow-sm">
                    <GraduationCap className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Enrolled Students</p>
                    <p className="text-xs font-semibold text-gray-500">{analytics?.activeStudents ?? "—"} active</p>
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
                    <p className="text-xs font-semibold text-gray-500">{analytics?.testsThisMonth ?? "—"} this month</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-slate-900">{analytics?.totalTestsCreated ?? 0}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-orange-50/40 border border-orange-100/60 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-orange-100 flex items-center justify-center shadow-sm">
                    <Sparkles className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">AI Credits Used</p>
                    <p className="text-xs font-semibold text-gray-550 truncate max-w-[120px]">generations this month</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-slate-900 truncate max-w-[80px]">{analytics?.aiGenerationsUsed ?? 0}/{analytics?.aiGenerationsLimit ?? 100}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Recent Activity (Market List) + Dark Invite Banner (Earn Banner) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Recent Activity (Market list look) */}
        <Card className="col-span-1 lg:col-span-2 rounded-[2rem] border border-gray-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.015)] p-6 bg-white">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
              <p className="text-xs font-semibold text-gray-500">Latest 5 events at your institution</p>
            </div>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : activity.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6 font-medium">No activity recorded yet.</p>
            ) : (
              <div className="overflow-hidden border border-gray-100 rounded-2xl bg-gray-50/50">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 font-semibold text-xs">
                      <th className="p-3 pl-4">Type</th>
                      <th className="p-3">Event Description</th>
                      <th className="p-3 text-right pr-4">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {activity.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                        <td className="p-3 pl-4">
                          <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold capitalize", 
                            item.type === "test" && "bg-blue-50 text-blue-700",
                            item.type === "student" && "bg-green-50 text-green-700",
                            item.type === "teacher" && "bg-purple-50 text-purple-700",
                            item.type === "billing" && "bg-orange-50 text-orange-700"
                          )}>
                            {item.type}
                          </span>
                        </td>
                        <td className="p-3 text-slate-700 font-medium">{item.text}</td>
                        <td className="p-3 text-right text-gray-400 text-xs pr-4">{item.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>

        {/* Invite Banner (Ad Banner look) */}
        <div className="rounded-[2rem] border border-slate-900 bg-slate-950 text-white p-6 sm:p-8 flex flex-col justify-between shadow-[0_15px_40px_rgba(0,0,0,0.15)] relative overflow-hidden group min-h-[250px]">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl opacity-15 pointer-events-none"
            style={{ background: "radial-gradient(circle, #3B6FFF 0%, #7C3AED 100%)" }}
          />
          <div className="relative z-10 flex flex-col gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-[0.1em] bg-blue-600/30 text-blue-400 w-fit">
              Grow Your Team
            </span>
            <h2 className="text-xl font-black leading-tight">Bring your whole Faculty in minutes!</h2>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Invite teachers via dashboard, assign departments, configure roles, and watch AI speed up grading workloads.
            </p>
          </div>
          <div className="relative z-10 mt-6">
            <Button asChild className="w-full rounded-full bg-white hover:bg-slate-100 text-slate-950 font-bold py-3.5 hover:shadow-lg transition-all duration-300">
              <Link href="/admin/teachers">
                Invite Faculty
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

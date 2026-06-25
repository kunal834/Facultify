"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Award,
  Clock,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Brain,
  Star,
  AlertCircle,
  Flame,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import PageHeader from "@/components/dashboards/PageHeader";
import { useAppStore } from "@/store/app-store";
import { getStudentAnalytics } from "@/lib/supabase-service";
import { formatDate, cn, scoreColor } from "@/lib/utils";
import type { StudentAnalytics } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey = "date" | "percentage" | "title";
type SortDir = "asc" | "desc";

interface TooltipPayloadItem {
  value: number;
  payload: { label?: string; fullTitle?: string; pct?: number };
}

// ─── AI Insights (mock) ───────────────────────────────────────────────────────

const AI_INSIGHTS = [
  {
    icon: Star,
    color: "emerald",
    headline: "Strong in Algebra",
    detail: "+12% above class average. Your factoring and equation-solving speed is a real edge.",
  },
  {
    icon: AlertCircle,
    color: "amber",
    headline: "Needs focus on Trigonometry",
    detail:
      "Trigonometry sits 10 points below your average. Two targeted practice sessions could close that gap.",
  },
  {
    icon: Flame,
    color: "indigo",
    headline: "Improvement streak: 3 tests",
    detail:
      "You've scored higher on each of your last 3 tests. Consistency like this compounds fast.",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pct(score: number, max: number): number {
  if (max === 0) return 0;
  return Math.round((score / max) * 100);
}

function barColor(score: number): string {
  if (score >= 80) return "#10b981"; // emerald-500
  if (score >= 60) return "#f59e0b"; // amber-500
  return "#ef4444"; // red-500
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-slate-200", className)}
      aria-hidden="true"
    />
  );
}

// ─── Arc Gauge ────────────────────────────────────────────────────────────────
// Draws a 240-degree arc (120° → 60°) using SVG — no external paths.

function ArcGauge({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = 72;
  const cx = 100;
  const cy = 100;
  // arc spans 240 degrees: starts at 150° (lower-left), ends at 30° (lower-right)
  const startAngle = 150;
  const endAngle = 30; // going clockwise via 270 degrees to reach 30
  const totalSweep = 240;
  const filledSweep = (clamped / 100) * totalSweep;

  function polar(angle: number, r: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  }

  function arcPath(startDeg: number, sweepDeg: number, r: number) {
    const start = polar(startDeg, r);
    const endDeg = startDeg + sweepDeg;
    const end = polar(endDeg, r);
    const largeArc = sweepDeg > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  }

  const trackPath = arcPath(startAngle, totalSweep, radius);
  const fillPath = filledSweep > 0 ? arcPath(startAngle, filledSweep, radius) : "";

  const fillColor =
    clamped >= 80 ? "#10b981" : clamped >= 60 ? "#f59e0b" : "#ef4444";
  const textColorClass = scoreColor(clamped);

  return (
    <div className="flex flex-col items-center" role="img" aria-label={`Overall score: ${value}%`}>
      <svg width="200" height="160" viewBox="0 0 200 160" aria-hidden="true">
        {/* Track */}
        <path
          d={trackPath}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Fill */}
        {fillPath && (
          <path
            d={fillPath}
            fill="none"
            stroke={fillColor}
            strokeWidth="12"
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        )}
        {/* Score text */}
        <text
          x={cx}
          y={cy + 4}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="32"
          fontWeight="800"
          fill={fillColor}
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          {clamped}%
        </text>
        {/* Label */}
        <text
          x={cx}
          y={cy + 32}
          textAnchor="middle"
          fontSize="11"
          fill="#94a3b8"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          letterSpacing="0.05em"
        >
          OVERALL
        </text>
      </svg>
      <p
        className={cn(
          "text-xs font-semibold tracking-wide uppercase mt-0.5",
          textColorClass
        )}
      >
        {clamped >= 80 ? "Outstanding" : clamped >= 60 ? "Good progress" : "Room to grow"}
      </p>
    </div>
  );
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────

function StatPill({
  icon: Icon,
  label,
  value,
  sub,
  colorClass,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  colorClass?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
      <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", colorClass ?? "bg-indigo-100")}>
        <Icon className="h-4 w-4 text-indigo-600" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className="text-base font-bold leading-tight text-slate-900 truncate">{value}</p>
        {sub && <p className="text-[11px] text-slate-400 leading-tight">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Chart Tooltips ───────────────────────────────────────────────────────────

function LineTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  const score = payload[0].value;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-lg text-xs">
      {item.fullTitle && (
        <p className="font-semibold text-slate-700 mb-1 max-w-[150px] leading-snug">
          {item.fullTitle}
        </p>
      )}
      <p className={cn("text-lg font-bold tabular-nums", scoreColor(score))}>
        {score}%
      </p>
    </div>
  );
}

function BarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}) {
  if (!active || !payload?.length) return null;
  const { value, payload: item } = payload[0];
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-slate-700 mb-0.5">{item.label ?? "Subject"}</p>
      <p className={cn("text-base font-bold tabular-nums", scoreColor(value))}>
        {value}%
      </p>
    </div>
  );
}

// ─── AI Insight Card ──────────────────────────────────────────────────────────

const insightStyles: Record<
  string,
  { card: string; icon: string; heading: string }
> = {
  emerald: {
    card: "bg-emerald-50 border-emerald-200",
    icon: "bg-emerald-100 text-emerald-600",
    heading: "text-emerald-800",
  },
  amber: {
    card: "bg-amber-50 border-amber-200",
    icon: "bg-amber-100 text-amber-600",
    heading: "text-amber-800",
  },
  indigo: {
    card: "bg-indigo-50 border-indigo-200",
    icon: "bg-indigo-100 text-indigo-600",
    heading: "text-indigo-800",
  },
};

function InsightCard({
  icon: Icon,
  color,
  headline,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  headline: string;
  detail: string;
}) {
  const styles = insightStyles[color] ?? insightStyles.indigo;
  return (
    <div className={cn("rounded-2xl border p-4 flex gap-3", styles.card)}>
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
          styles.icon
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className={cn("text-sm font-bold leading-snug", styles.heading)}>
          {headline}
        </p>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{detail}</p>
      </div>
    </div>
  );
}

// ─── Sort Button ──────────────────────────────────────────────────────────────

function SortButton({
  label,
  sortKey,
  current,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={cn(
        "flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition-colors select-none",
        active ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
      )}
    >
      {label}
      {active ? (
        dir === "asc" ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
      )}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentAnalyticsPage() {
  const { activeSession } = useAppStore();
  const student = activeSession?.role === "student" ? activeSession.user : null;
  const studentId = student?.id ?? "";
  const firstName = student?.name?.split(" ")[0] ?? "Student";

  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    setLoading(true);
    getStudentAnalytics(studentId).then((a) => {
      if (!alive.current) return;
      setAnalytics(a);
      setLoading(false);
    });
    return () => {
      alive.current = false;
    };
  }, [studentId]);

  const handleSort = useCallback(
    (key: SortKey) => {
      if (key === sortKey) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("desc");
      }
    },
    [sortKey]
  );

  // Chart data
  const lineData =
    analytics?.scoreHistory.map((s) => ({
      name:
        s.testTitle.length > 13
          ? s.testTitle.substring(0, 12) + "…"
          : s.testTitle,
      fullTitle: s.testTitle,
      score: pct(s.score, s.maxScore),
    })) ?? [];

  const barData =
    analytics?.subjectBreakdown.map((s) => ({
      label: s.subject,
      avgScore: s.avgScore,
    })) ?? [];

  // Sortable table rows
  const tableRows = [...(analytics?.scoreHistory ?? [])].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "date") {
      cmp = a.date.localeCompare(b.date);
    } else if (sortKey === "percentage") {
      cmp = pct(a.score, a.maxScore) - pct(b.score, b.maxScore);
    } else if (sortKey === "title") {
      cmp = a.testTitle.localeCompare(b.testTitle);
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const overallScore = analytics?.overallScore ?? 0;
  const bestSubject = analytics?.bestSubject ?? "—";

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title={`${firstName}'s Performance`}
        subtitle="A full picture of your test history, subject strengths, and what to work on next"
      />

      {/* ── Section 1: Overall Stats Bar ─────────────────────────────────── */}
      <Card className="border-slate-200 overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row items-center gap-0 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            {/* Arc Gauge hero */}
            <div className="flex items-center justify-center px-8 py-6 sm:py-4 shrink-0">
              {loading ? (
                <Skeleton className="h-44 w-44 rounded-full" />
              ) : (
                <ArcGauge value={overallScore} />
              )}
            </div>

            {/* Stat pills */}
            <div className="flex flex-col sm:flex-row flex-1 flex-wrap gap-3 p-6">
              {loading ? (
                <>
                  <Skeleton className="h-16 w-full sm:w-48 rounded-2xl" />
                  <Skeleton className="h-16 w-full sm:w-48 rounded-2xl" />
                  <Skeleton className="h-16 w-full sm:w-48 rounded-2xl" />
                </>
              ) : (
                <>
                  <StatPill
                    icon={CheckCircle2}
                    label="Tests Passed"
                    value={`${analytics?.testsPassed ?? 0} / ${analytics?.testsAttempted ?? 0}`}
                    sub="attempted"
                    colorClass="bg-emerald-100"
                  />
                  <StatPill
                    icon={Award}
                    label="Best Subject"
                    value={bestSubject}
                    colorClass="bg-amber-100"
                  />
                  <StatPill
                    icon={Clock}
                    label="Avg Time / Test"
                    value={`${analytics?.avgTimePerTest ?? 0} min`}
                    sub="per attempt"
                    colorClass="bg-indigo-100"
                  />
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 2 & 3: Charts Row ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score History — LineChart */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-800">
              Score History
            </CardTitle>
            <CardDescription>
              Percentage across your last {lineData.length} tests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-52" />
            ) : lineData.length === 0 ? (
              <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
                No completed tests yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <LineChart
                  data={lineData}
                  margin={{ top: 8, right: 8, left: -22, bottom: 4 }}
                >
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f1f5f9"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <Tooltip
                    content={<LineTooltip />}
                    cursor={{
                      stroke: "#4f46e5",
                      strokeWidth: 1,
                      strokeDasharray: "4 3",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#4f46e5", strokeWidth: 0 }}
                    activeDot={{
                      r: 6,
                      fill: "#4f46e5",
                      stroke: "#fff",
                      strokeWidth: 2,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Subject Breakdown — Horizontal BarChart */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-800">
              Subject Breakdown
            </CardTitle>
            <CardDescription>Average score per subject area</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-52" />
            ) : barData.length === 0 ? (
              <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
                No subject data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart
                  data={barData}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f1f5f9"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={82}
                    tick={{ fontSize: 11, fill: "#475569" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<BarTooltip />} cursor={{ fill: "#f8fafc" }} />
                  <Bar dataKey="avgScore" radius={[0, 4, 4, 0]} maxBarSize={24}>
                    {barData.map((entry) => (
                      <Cell
                        key={entry.label}
                        fill={barColor(entry.avgScore)}
                        fillOpacity={0.85}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Section 4: Performance Table ─────────────────────────────────── */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-800">
                Test Results
              </CardTitle>
              <CardDescription>All completed tests — click a column header to sort</CardDescription>
            </div>
            {analytics && (
              <div className="flex items-center gap-3 text-xs text-slate-500 shrink-0">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  80%+
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />
                  60–79%
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
                  Below 60%
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {loading ? (
            <div className="space-y-3 px-6 pb-6">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : tableRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2 px-6">
              <TrendingUp className="h-8 w-8 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">No results yet.</p>
              <p className="text-xs text-slate-400">
                Completed tests will appear here once graded.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="py-3 pl-6 pr-4 text-left font-medium">
                      <SortButton
                        label="Test"
                        sortKey="title"
                        current={sortKey}
                        dir={sortDir}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="py-3 px-4 text-right font-medium">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Score
                      </span>
                    </th>
                    <th className="py-3 px-4 text-right font-medium hidden sm:table-cell">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Max
                      </span>
                    </th>
                    <th className="py-3 px-4 text-right font-medium">
                      <SortButton
                        label="%"
                        sortKey="percentage"
                        current={sortKey}
                        dir={sortDir}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="py-3 pl-4 pr-6 text-right font-medium">
                      <SortButton
                        label="Date"
                        sortKey="date"
                        current={sortKey}
                        dir={sortDir}
                        onSort={handleSort}
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row, i) => {
                    const p = pct(row.score, row.maxScore);
                    return (
                      <tr
                        key={i}
                        className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors"
                      >
                        {/* Title + mini color dot */}
                        <td className="py-3.5 pl-6 pr-4">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{ backgroundColor: barColor(p) }}
                              aria-hidden="true"
                            />
                            <span className="font-medium text-slate-800 truncate max-w-[200px]">
                              {row.testTitle}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right tabular-nums text-slate-700 font-semibold">
                          {row.score}
                        </td>
                        <td className="py-3.5 px-4 text-right tabular-nums text-slate-400 hidden sm:table-cell">
                          {row.maxScore}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span
                            className={cn(
                              "tabular-nums font-bold text-base",
                              scoreColor(p)
                            )}
                          >
                            {p}%
                          </span>
                        </td>
                        <td className="py-3.5 pl-4 pr-6 text-right text-xs text-slate-400 tabular-nums whitespace-nowrap">
                          {formatDate(row.date)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Section 5: AI Insights ────────────────────────────────────────── */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100">
              <Brain className="h-3.5 w-3.5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-slate-800">
                Study Insights
              </CardTitle>
            </div>
          </div>
          <CardDescription className="mt-1">
            Patterns detected from your recent test data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {AI_INSIGHTS.map((insight, i) => (
              <InsightCard key={i} {...insight} />
            ))}
          </div>

          {/* Strengths and weaknesses quick summary */}
          {!loading && analytics && (
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <TrendingUp className="h-5 w-5 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
                    Best Subject
                  </p>
                  <p className="text-sm font-bold text-emerald-800">
                    {analytics.bestSubject}
                  </p>
                </div>
              </div>
              <div className="flex-1 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <TrendingDown className="h-5 w-5 text-red-500 shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-red-600">
                    Needs Focus
                  </p>
                  <p className="text-sm font-bold text-red-800">
                    {analytics.weakSubject}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

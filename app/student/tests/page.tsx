"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  Award,
  CheckCircle2,
  CalendarDays,
  User,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PageHeader from "@/components/dashboards/PageHeader";
import EmptyState from "@/components/dashboards/EmptyState";
import ScoreBadge from "@/components/testing/ScoreBadge";
import { useAppStore } from "@/store/app-store";
import { getStudentTests, getStudentSubmissions } from "@/lib/supabase-service";
import { formatDate, formatDateTime, cn } from "@/lib/utils";
import type { MockTest, Submission } from "@/lib/types";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function statusPill(status: MockTest["status"]) {
  if (status === "active")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
        Live
      </span>
    );
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
      Scheduled
    </span>
  );
}

// ─── Skeleton loaders ──────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="rounded-xl border bg-white p-6 flex items-center gap-6">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-56" />
        <Skeleton className="h-4 w-80" />
        <div className="flex gap-4 pt-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-10 w-28 rounded-lg" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-44" /></TableCell>
          <TableCell><Skeleton className="h-5 w-16 rounded-full mx-auto" /></TableCell>
          <TableCell><Skeleton className="h-4 w-14 mx-auto" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20 mx-auto" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

// ─── Upcoming test card ────────────────────────────────────────────────────────

function UpcomingCard({ test, teacherName }: { test: MockTest; teacherName?: string }) {
  const isActive = test.status === "active";

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-shadow hover:shadow-md border-l-4",
        isActive ? "border-l-green-500" : "border-l-blue-400"
      )}
    >
      <CardContent className="p-0">
        <div className="flex items-center gap-6 p-5 sm:p-6">
          {/* Icon column */}
          <div
            className={cn(
              "hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
              isActive ? "bg-green-50" : "bg-blue-50"
            )}
          >
            <BookOpen
              className={cn(
                "h-6 w-6",
                isActive ? "text-green-600" : "text-blue-600"
              )}
            />
          </div>

          {/* Body */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm sm:text-base leading-snug truncate">
                {test.title}
              </h3>
              {statusPill(test.status)}
            </div>

            {/* Subject / teacher */}
            <p className="text-sm text-muted-foreground mb-2 truncate">
              {test.subject}
              {teacherName && (
                <span className="text-muted-foreground/60"> &middot; {teacherName}</span>
              )}
            </p>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {test.durationMinutes} min
              </span>
              <span className="flex items-center gap-1">
                <Award className="h-3.5 w-3.5" />
                {test.totalMarks} marks
              </span>
              <span className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                {test.questions.length} questions
              </span>
              {test.scheduledAt && (
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDateTime(test.scheduledAt)}
                </span>
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="shrink-0">
            <Button size="lg" asChild>
              <Link href={`/student/test/${test.id}`}>
                Take Test
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Completed row data helper ─────────────────────────────────────────────────

function submissionStatusBadge(status: Submission["status"]) {
  if (status === "graded")
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
        Graded
      </span>
    );
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
      Pending
    </span>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function StudentTestsPage() {
  const { activeSession } = useAppStore();
  const student = activeSession?.role === "student" ? activeSession.user : null;
  const teacherName =
    activeSession?.role === "student" ? activeSession.teacher?.name : undefined;
  const studentId = student?.id ?? "";

  const [tests, setTests] = useState<MockTest[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getStudentTests(studentId),
      getStudentSubmissions(studentId),
    ]).then(([t, s]) => {
      setTests(t);
      setSubmissions(s);
      setLoading(false);
    });
  }, [studentId]);

  // Build a fast lookup: testId → MockTest title
  const testMap = new Map(tests.map((t) => [t.id, t]));

  const attemptedIds = new Set(submissions.map((s) => s.testId));

  const upcoming = tests.filter(
    (t) =>
      !attemptedIds.has(t.id) &&
      (t.status === "published" || t.status === "active")
  );

  const completed = submissions.filter(
    (s) => s.status === "submitted" || s.status === "graded"
  );

  const totalCount = upcoming.length + completed.length;

  return (
    <div>
      <PageHeader
        title="My Tests"
        subtitle="Take upcoming tests and review your results"
      />

      <Tabs defaultValue="upcoming" className="space-y-5">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming
            {!loading && (
              <span className="ml-1.5 text-xs tabular-nums opacity-60">
                {upcoming.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed
            {!loading && (
              <span className="ml-1.5 text-xs tabular-nums opacity-60">
                {completed.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">
            All
            {!loading && (
              <span className="ml-1.5 text-xs tabular-nums opacity-60">
                {totalCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Upcoming ─────────────────────────────────────────────────── */}
        <TabsContent value="upcoming" className="space-y-4">
          {loading ? (
            <>
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : upcoming.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Nothing due right now"
              description="You're all caught up. New tests from your teacher will show up here."
            />
          ) : (
            upcoming.map((t) => (
              <UpcomingCard key={t.id} test={t} teacherName={teacherName} />
            ))
          )}
        </TabsContent>

        {/* ── Completed ────────────────────────────────────────────────── */}
        <TabsContent value="completed">
          {loading ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test</TableHead>
                      <TableHead className="text-center">Score</TableHead>
                      <TableHead className="text-center">Percentage</TableHead>
                      <TableHead className="text-center">Time Taken</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Results</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableSkeleton />
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : completed.length === 0 ? (
            <EmptyState
              icon={Award}
              title="No completed tests yet"
              description="Your scores and results will appear here once you submit a test."
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Test</TableHead>
                        <TableHead className="text-center">Score</TableHead>
                        <TableHead className="text-center">Percentage</TableHead>
                        <TableHead className="text-center">Time Taken</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead className="text-right">Results</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {completed.map((s) => {
                        const testTitle =
                          testMap.get(s.testId)?.title ?? "Test";
                        return (
                          <TableRow key={s.id}>
                            {/* Title */}
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm leading-snug">
                                  {testTitle}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {testMap.get(s.testId)?.subject ?? ""}
                                </p>
                              </div>
                            </TableCell>

                            {/* Score */}
                            <TableCell className="text-center text-sm tabular-nums font-medium">
                              {s.status === "graded"
                                ? `${s.totalScore} / ${s.maxScore}`
                                : <span className="text-muted-foreground text-xs">Pending</span>}
                            </TableCell>

                            {/* Percentage badge */}
                            <TableCell className="text-center">
                              {s.status === "graded" ? (
                                <ScoreBadge
                                  score={s.totalScore}
                                  maxScore={s.maxScore}
                                />
                              ) : (
                                submissionStatusBadge(s.status)
                              )}
                            </TableCell>

                            {/* Time taken */}
                            <TableCell className="text-center text-sm text-muted-foreground tabular-nums">
                              {s.timeTakenMinutes
                                ? `${s.timeTakenMinutes} min`
                                : "—"}
                            </TableCell>

                            {/* Submitted date */}
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              {s.submittedAt ? formatDate(s.submittedAt) : "—"}
                            </TableCell>

                            {/* View results */}
                            <TableCell className="text-right">
                              {s.status === "graded" ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  asChild
                                  className="text-primary hover:text-primary"
                                >
                                  <Link
                                    href={`/student/test/${s.testId}?review=${s.id}`}
                                  >
                                    View Results
                                  </Link>
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  Awaiting grade
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── All ──────────────────────────────────────────────────────── */}
        <TabsContent value="all" className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : totalCount === 0 ? (
            <EmptyState
              icon={FileText}
              title="No tests assigned yet"
              description="Your teacher hasn't published any tests for your batch yet. Check back soon."
            />
          ) : (
            <>
              {/* Upcoming section */}
              {upcoming.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Upcoming &mdash; {upcoming.length}
                  </h2>
                  <div className="space-y-3">
                    {upcoming.map((t) => (
                      <UpcomingCard
                        key={t.id}
                        test={t}
                        teacherName={teacherName}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Completed section */}
              {completed.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Completed &mdash; {completed.length}
                  </h2>
                  <Card>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Test</TableHead>
                              <TableHead className="text-center">Score</TableHead>
                              <TableHead className="text-center">Percentage</TableHead>
                              <TableHead className="text-center">Time Taken</TableHead>
                              <TableHead>Submitted</TableHead>
                              <TableHead className="text-right">Results</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {completed.map((s) => {
                              const testTitle =
                                testMap.get(s.testId)?.title ?? "Test";
                              return (
                                <TableRow key={s.id}>
                                  <TableCell>
                                    <div>
                                      <p className="font-medium text-sm leading-snug">
                                        {testTitle}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        {testMap.get(s.testId)?.subject ?? ""}
                                      </p>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center text-sm tabular-nums font-medium">
                                    {s.status === "graded"
                                      ? `${s.totalScore} / ${s.maxScore}`
                                      : <span className="text-muted-foreground text-xs">Pending</span>}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {s.status === "graded" ? (
                                      <ScoreBadge
                                        score={s.totalScore}
                                        maxScore={s.maxScore}
                                      />
                                    ) : (
                                      submissionStatusBadge(s.status)
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center text-sm text-muted-foreground tabular-nums">
                                    {s.timeTakenMinutes
                                      ? `${s.timeTakenMinutes} min`
                                      : "—"}
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                    {s.submittedAt ? formatDate(s.submittedAt) : "—"}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {s.status === "graded" ? (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        asChild
                                        className="text-primary hover:text-primary"
                                      >
                                        <Link
                                          href={`/student/test/${s.testId}?review=${s.id}`}
                                        >
                                          View Results
                                        </Link>
                                      </Button>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">
                                        Awaiting grade
                                      </span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

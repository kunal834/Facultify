"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  FileText,
  PlusCircle,
  MoreHorizontal,
  Eye,
  Pencil,
  Send,
  Trash2,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { useAppStore } from "@/store/app-store";
import { getTests, publishTest, deleteTest, getBatches } from "@/lib/supabase-service";
import { formatDate, cn } from "@/lib/utils";
import type { MockTest, TestStatus } from "@/lib/types";
import type { Batch } from "@/lib/types";

// ─── Types ─────────────────────────────────────────────────────────────────────

type FilterStatus = "all" | TestStatus;

// ─── Status badge config ───────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  TestStatus,
  { label: string; className: string }
> = {
  draft: {
    label: "Draft",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
  published: {
    label: "Published",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  active: {
    label: "Active",
    className: "bg-green-50 text-green-700 border-green-200",
  },
  closed: {
    label: "Closed",
    className: "bg-slate-100 text-slate-500 border-slate-200",
  },
};

const FILTER_TABS: { value: FilterStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "active", label: "Active" },
  { value: "closed", label: "Closed" },
];

// ─── Skeleton rows ─────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-4 w-40" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-28" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-20 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-8 ml-auto" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-8 ml-auto" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16 ml-auto" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell />
        </TableRow>
      ))}
    </>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function TeacherTestsPage() {
  const { activeSession } = useAppStore();
  const teacherId =
    activeSession?.role === "teacher" ? activeSession.user.id : "";

  const [tests, setTests] = useState<MockTest[]>([]);
  const [batchMap, setBatchMap] = useState<Record<string, Batch>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [deleteTarget, setDeleteTarget] = useState<MockTest | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getTests(teacherId), getBatches(teacherId)]).then(
      ([fetchedTests, fetchedBatches]) => {
        setTests(fetchedTests);
        const map: Record<string, Batch> = {};
        fetchedBatches.forEach((b) => {
          map[b.id] = b;
        });
        setBatchMap(map);
        setLoading(false);
      }
    );
  }, [teacherId]);

  const filtered =
    filter === "all" ? tests : tests.filter((t) => t.status === filter);

  const counts: Record<FilterStatus, number> = {
    all: tests.length,
    draft: tests.filter((t) => t.status === "draft").length,
    published: tests.filter((t) => t.status === "published").length,
    active: tests.filter((t) => t.status === "active").length,
    closed: tests.filter((t) => t.status === "closed").length,
  };

  async function handlePublish(t: MockTest) {
    setPublishing(t.id);
    try {
      const updated = await publishTest(t.id);
      setTests((prev) => prev.map((x) => (x.id === t.id ? updated : x)));
      toast.success(`"${t.title}" is now published.`);
    } finally {
      setPublishing(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await deleteTest(deleteTarget.id);
    setTests((prev) => prev.filter((t) => t.id !== deleteTarget.id));
    toast.success(`"${deleteTarget.title}" deleted.`);
    setDeleteTarget(null);
  }

  return (
    <div>
      <PageHeader
        title="My Tests"
        subtitle={
          loading
            ? "Loading…"
            : `${tests.length} test${tests.length !== 1 ? "s" : ""} total`
        }
      >
        <Button asChild>
          <Link href="/teacher/create-test">
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Test
          </Link>
        </Button>
      </PageHeader>

      {/* Filter tabs */}
      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as FilterStatus)}
        className="mb-4"
      >
        <TabsList>
          {FILTER_TABS.map(({ value, label }) => (
            <TabsTrigger key={value} value={value}>
              {label}
              {!loading && (
                <span className="ml-1.5 text-xs tabular-nums opacity-60">
                  {counts[value]}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Table card */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 && !loading ? (
            <EmptyState
              icon={FileText}
              title={
                filter === "all" ? "No tests yet" : `No ${filter} tests`
              }
              description={
                filter === "all"
                  ? "Create your first test to get started. You can write questions manually or let AI generate them."
                  : `You have no tests in ${filter} state right now.`
              }
              action={
                filter === "all"
                  ? { label: "Create your first test", href: "/teacher/create-test" }
                  : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Questions</TableHead>
                    <TableHead className="text-right">Total Marks</TableHead>
                    <TableHead className="text-right">Duration</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableSkeleton />
                  ) : (
                    filtered.map((t) => {
                      const status = STATUS_CONFIG[t.status];
                      const batch = batchMap[t.batchId];
                      return (
                        <TableRow key={t.id} className="group">
                          {/* Title */}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm leading-snug">
                                {t.title}
                              </span>
                              {t.aiGenerated && (
                                <Badge
                                  variant="outline"
                                  className="bg-purple-50 text-purple-700 border-purple-200 text-xs px-1.5 py-0"
                                >
                                  AI
                                </Badge>
                              )}
                            </div>
                          </TableCell>

                          {/* Subject */}
                          <TableCell className="text-sm text-muted-foreground">
                            {t.subject}
                          </TableCell>

                          {/* Batch */}
                          <TableCell className="text-sm text-muted-foreground">
                            {batch ? batch.name : (
                              <span className="italic opacity-50">—</span>
                            )}
                          </TableCell>

                          {/* Status badge */}
                          <TableCell>
                            <span
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
                                status.className
                              )}
                            >
                              {status.label}
                            </span>
                          </TableCell>

                          {/* Questions */}
                          <TableCell className="text-right text-sm tabular-nums">
                            {t.questions.length}
                          </TableCell>

                          {/* Total Marks */}
                          <TableCell className="text-right text-sm tabular-nums">
                            {t.totalMarks}
                          </TableCell>

                          {/* Duration */}
                          <TableCell className="text-right text-sm text-muted-foreground tabular-nums">
                            {t.durationMinutes} min
                          </TableCell>

                          {/* Created */}
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {formatDate(t.createdAt)}
                          </TableCell>

                          {/* Actions */}
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 focus:opacity-100 data-[state=open]:opacity-100 transition-opacity"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                {/* View / Edit */}
                                <DropdownMenuItem asChild>
                                  <Link href={`/teacher/create-test?id=${t.id}`}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    View / Edit
                                  </Link>
                                </DropdownMenuItem>

                                {/* Publish — only for drafts */}
                                {t.status === "draft" && (
                                  <DropdownMenuItem
                                    onClick={() => handlePublish(t)}
                                    disabled={publishing === t.id}
                                  >
                                    <Send className="h-4 w-4 mr-2" />
                                    {publishing === t.id
                                      ? "Publishing…"
                                      : "Publish"}
                                  </DropdownMenuItem>
                                )}

                                {/* View Submissions */}
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/teacher/checking?testId=${t.id}`}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Submissions
                                  </Link>
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                {/* Delete */}
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                  onClick={() => setDeleteTarget(t)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete &ldquo;{deleteTarget?.title}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the test and all its questions.
              Existing student submissions will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 focus-visible:ring-red-600"
            >
              Delete test
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

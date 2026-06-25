"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Users,
  UserPlus,
  Trash2,
  Search,
  Plus,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  getStudents,
  getBatches,
  addStudent,
  removeStudent,
  createBatch,
} from "@/lib/supabase-service";
import { getInitials, cn } from "@/lib/utils";
import type { Student, Batch } from "@/lib/types";

// ─── Score badge ──────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const colorClass =
    score >= 80
      ? "bg-green-100 text-green-700 border-green-200"
      : score >= 60
      ? "bg-yellow-100 text-yellow-700 border-yellow-200"
      : score === 0
      ? "bg-slate-100 text-slate-500 border-slate-200"
      : "bg-red-100 text-red-700 border-red-200";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tabular-nums",
        colorClass
      )}
    >
      {score === 0 ? "—" : `${score}%`}
    </span>
  );
}

// ─── Avatar with colour derived from name ─────────────────────────────────────

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-teal-100 text-teal-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
  "bg-cyan-100 text-cyan-700",
];

function studentColor(name: string) {
  const idx =
    name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

// ─── Expandable batch card ─────────────────────────────────────────────────────

function BatchCard({
  batch,
  students,
  onRemove,
}: {
  batch: Batch;
  students: Student[];
  onRemove: (s: Student) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const avgScore =
    students.length > 0
      ? Math.round(
          students.reduce((acc, s) => acc + s.overallScore, 0) / students.length
        )
      : 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-0">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">{batch.name}</p>
              <p className="text-xs text-muted-foreground">{batch.subject}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
              <span>
                <span className="font-medium text-foreground">{students.length}</span>{" "}
                {students.length === 1 ? "student" : "students"}
              </span>
              {students.length > 0 && (
                <>
                  <span className="text-slate-300">·</span>
                  <span>
                    avg <ScoreBadge score={avgScore} />
                  </span>
                </>
              )}
            </div>
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </button>
      </CardHeader>

      {expanded && (
        <CardContent className="p-0 border-t">
          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No students in this batch yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Roll No.</TableHead>
                  <TableHead className="text-right">Overall Score</TableHead>
                  <TableHead className="text-right">Tests Attempted</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback
                            className={cn(
                              "text-xs font-semibold",
                              studentColor(s.name)
                            )}
                          >
                            {getInitials(s.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm leading-tight">
                            {s.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {s.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-mono text-muted-foreground">
                      {s.rollNumber}
                    </TableCell>
                    <TableCell className="text-right">
                      <ScoreBadge score={s.overallScore} />
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {s.testsAttempted}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-red-600"
                        onClick={() => onRemove(s)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="sr-only">Remove {s.name}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TeacherStudentsPage() {
  const { activeSession } = useAppStore();
  const teacher = activeSession?.role === "teacher" ? activeSession.user : null;
  const teacherId = teacher?.id ?? "";
  const institutionId = teacher?.institutionId ?? "";

  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [studentOpen, setStudentOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [studentForm, setStudentForm] = useState({
    name: "",
    email: "",
    rollNumber: "",
    batchId: "",
  });
  const [batchForm, setBatchForm] = useState({ name: "", subject: "" });

  useEffect(() => {
    Promise.all([getStudents(teacherId), getBatches(teacherId)]).then(
      ([s, b]) => {
        setStudents(s);
        setBatches(b);
        setLoading(false);
      }
    );
  }, [teacherId]);

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAddStudent() {
    if (!studentForm.name || !studentForm.email || !studentForm.batchId) {
      toast.error("Name, email, and batch are required.");
      return;
    }
    setSubmitting(true);
    try {
      const s = await addStudent({
        name: studentForm.name,
        email: studentForm.email,
        rollNumber: studentForm.rollNumber || `R${Date.now()}`,
        batchId: studentForm.batchId,
        teacherId,
        institutionId,
        isActive: true,
      });
      setStudents((prev) => [...prev, s]);
      toast.success(`${s.name} added to your class.`);
      setStudentOpen(false);
      setStudentForm({ name: "", email: "", rollNumber: "", batchId: "" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateBatch() {
    if (!batchForm.name || !batchForm.subject) {
      toast.error("Batch name and subject are required.");
      return;
    }
    setSubmitting(true);
    try {
      const b = await createBatch({
        name: batchForm.name,
        subject: batchForm.subject,
        teacherId,
        institutionId,
      });
      setBatches((prev) => [...prev, b]);
      toast.success(`Batch "${b.name}" created.`);
      setBatchOpen(false);
      setBatchForm({ name: "", subject: "" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await removeStudent(deleteTarget.id);
    setStudents((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    toast.success(`${deleteTarget.name} removed from your class.`);
    setDeleteTarget(null);
  }

  const getBatchName = (id: string) =>
    batches.find((b) => b.id === id)?.name ?? "—";

  return (
    <div>
      <PageHeader
        title="Student Management"
        subtitle={`${students.length} student${students.length !== 1 ? "s" : ""} across ${batches.length} batch${batches.length !== 1 ? "es" : ""}`}
      >
        <Button variant="outline" onClick={() => setBatchOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Batch
        </Button>
        <Button onClick={() => setStudentOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Student
        </Button>
      </PageHeader>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">
            All Students ({students.length})
          </TabsTrigger>
          <TabsTrigger value="batches">By Batch</TabsTrigger>
        </TabsList>

        {/* ── All Students ─────────────────────────────────────────────────── */}
        <TabsContent value="all" className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-9"
              placeholder="Search by name, email, or roll no."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-12 bg-slate-100 animate-pulse rounded-lg"
                    />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <EmptyState
                  icon={GraduationCap}
                  title={
                    search
                      ? "No matching students"
                      : "No students yet"
                  }
                  description={
                    search
                      ? "Try a different name, email, or roll number."
                      : "Add your first student to get started."
                  }
                  action={
                    !search
                      ? {
                          label: "Add Student",
                          onClick: () => setStudentOpen(true),
                        }
                      : undefined
                  }
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Roll No.</TableHead>
                        <TableHead>Batch</TableHead>
                        <TableHead className="text-right">
                          Overall Score
                        </TableHead>
                        <TableHead className="text-right">
                          Tests Attempted
                        </TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarFallback
                                  className={cn(
                                    "text-xs font-semibold",
                                    studentColor(s.name)
                                  )}
                                >
                                  {getInitials(s.name)}
                                </AvatarFallback>
                              </Avatar>
                              <p className="font-medium text-sm whitespace-nowrap">
                                {s.name}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {s.email}
                          </TableCell>
                          <TableCell className="text-sm font-mono text-muted-foreground">
                            {s.rollNumber}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-normal text-xs">
                              {getBatchName(s.batchId)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <ScoreBadge score={s.overallScore} />
                          </TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground tabular-nums">
                            {s.testsAttempted}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">
                                    Actions for {s.name}
                                  </span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                  onClick={() => setDeleteTarget(s)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove student
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── By Batch ─────────────────────────────────────────────────────── */}
        <TabsContent value="batches">
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-slate-100 animate-pulse rounded-xl"
                />
              ))}
            </div>
          ) : batches.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No batches yet"
              description="Create a batch to organise your students by class or subject."
              action={{
                label: "Create Batch",
                onClick: () => setBatchOpen(true),
              }}
            />
          ) : (
            <div className="space-y-4">
              {batches.map((b) => {
                const batchStudents = students.filter(
                  (s) => s.batchId === b.id
                );
                return (
                  <BatchCard
                    key={b.id}
                    batch={b}
                    students={batchStudents}
                    onRemove={setDeleteTarget}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Add Student Dialog ─────────────────────────────────────────────── */}
      <Dialog open={studentOpen} onOpenChange={setStudentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Student</DialogTitle>
            <DialogDescription>
              Enrol a new student and assign them to one of your batches.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="student-name">Full Name *</Label>
              <Input
                id="student-name"
                placeholder="e.g. Priya Sharma"
                value={studentForm.name}
                onChange={(e) =>
                  setStudentForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="student-email">Email *</Label>
              <Input
                id="student-email"
                type="email"
                placeholder="student@college.edu"
                value={studentForm.email}
                onChange={(e) =>
                  setStudentForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="student-roll">Roll Number</Label>
              <Input
                id="student-roll"
                placeholder="e.g. CS2024001"
                value={studentForm.rollNumber}
                onChange={(e) =>
                  setStudentForm((f) => ({ ...f, rollNumber: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="student-batch">Batch *</Label>
              <Select
                value={studentForm.batchId}
                onValueChange={(v) =>
                  setStudentForm((f) => ({ ...f, batchId: v }))
                }
              >
                <SelectTrigger id="student-batch">
                  <SelectValue placeholder="Select a batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.length === 0 ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                      No batches — create one first.
                    </div>
                  ) : (
                    batches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}{" "}
                        <span className="text-muted-foreground">
                          · {b.subject}
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStudentOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddStudent} disabled={submitting}>
              {submitting ? "Adding..." : "Add Student"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create Batch Dialog ────────────────────────────────────────────── */}
      <Dialog open={batchOpen} onOpenChange={setBatchOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Batch</DialogTitle>
            <DialogDescription>
              A batch groups students by class, section, or subject.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="batch-name">Batch Name *</Label>
              <Input
                id="batch-name"
                placeholder="e.g. Class 11 — Section A"
                value={batchForm.name}
                onChange={(e) =>
                  setBatchForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="batch-subject">Subject *</Label>
              <Input
                id="batch-subject"
                placeholder="e.g. Mathematics"
                value={batchForm.subject}
                onChange={(e) =>
                  setBatchForm((f) => ({ ...f, subject: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBatch} disabled={submitting}>
              {submitting ? "Creating..." : "Create Batch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Remove Confirmation ────────────────────────────────────────────── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {deleteTarget?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <strong>{deleteTarget?.name}</strong> from your class. Their
              existing submissions will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Remove student
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

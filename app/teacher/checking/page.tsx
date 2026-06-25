"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  CheckSquare,
  Clock,
  User,
  ChevronRight,
  CheckCircle2,
  XCircle,
  BookOpenCheck,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/dashboards/PageHeader";
import { useAppStore } from "@/store/app-store";
import { getTests, getSubmissions, gradeTextAnswer } from "@/lib/supabase-service";
import { cn } from "@/lib/utils";
import type {
  MockTest,
  Submission,
  Question,
  SubmissionAnswer,
} from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type SubFilter = "all" | "pending" | "graded";

interface GradeEntry {
  marks: string;
  feedback: string;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SubmissionStatusBadge({ status }: { status: Submission["status"] }) {
  const config: Record<Submission["status"], { label: string; className: string }> = {
    not_started: { label: "Not started",  className: "bg-slate-100 text-slate-500 border-slate-200" },
    in_progress:  { label: "In progress",  className: "bg-blue-50  text-blue-700  border-blue-200"  },
    submitted:    { label: "Pending",      className: "bg-amber-50 text-amber-700 border-amber-200" },
    graded:       { label: "Graded",       className: "bg-green-50 text-green-700 border-green-200" },
  };
  const { label, className } = config[status] ?? config.not_started;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        className
      )}
    >
      {label}
    </span>
  );
}

function ScoreRing({ percentage }: { percentage: number }) {
  const color =
    percentage >= 75 ? "text-green-600" :
    percentage >= 50 ? "text-amber-600" :
    "text-red-600";
  return (
    <span className={cn("text-2xl font-bold tabular-nums leading-none", color)}>
      {percentage}
      <span className="text-sm font-normal text-muted-foreground">%</span>
    </span>
  );
}

// ─── Left panel — submission list ─────────────────────────────────────────────

interface SubmissionListProps {
  tests: MockTest[];
  selectedTestId: string;
  onSelectTest: (id: string) => void;
  submissions: Submission[];
  loadingSubmissions: boolean;
  selectedSub: Submission | null;
  onSelectSub: (sub: Submission) => void;
  filter: SubFilter;
  onFilterChange: (f: SubFilter) => void;
}

function SubmissionList({
  tests,
  selectedTestId,
  onSelectTest,
  submissions,
  loadingSubmissions,
  selectedSub,
  onSelectSub,
  filter,
  onFilterChange,
}: SubmissionListProps) {
  const filtered = submissions.filter((s) => {
    if (filter === "all") return true;
    if (filter === "pending") return s.status === "submitted" || s.status === "in_progress";
    if (filter === "graded") return s.status === "graded";
    return true;
  });

  const counts = {
    all: submissions.length,
    pending: submissions.filter((s) => s.status === "submitted" || s.status === "in_progress").length,
    graded: submissions.filter((s) => s.status === "graded").length,
  };

  return (
    <Card className="flex flex-col overflow-hidden">
      {/* Test selector + filter */}
      <CardHeader className="pb-3 border-b space-y-3">
        <Select value={selectedTestId} onValueChange={onSelectTest}>
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Select a test to review" />
          </SelectTrigger>
          <SelectContent>
            {tests.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filter pills */}
        <div className="flex gap-1.5">
          {(["all", "pending", "graded"] as SubFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-medium capitalize transition-colors",
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {f}
              <span
                className={cn(
                  "rounded-full px-1 tabular-nums text-[10px]",
                  filter === f ? "bg-primary-foreground/20 text-primary-foreground" : "bg-background text-muted-foreground"
                )}
              >
                {counts[f]}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>

      {/* List */}
      <ScrollArea className="flex-1">
        {loadingSubmissions ? (
          <div className="p-3 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <Filter className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {submissions.length === 0
                ? "No submissions yet for this test."
                : "No submissions match this filter."}
            </p>
          </div>
        ) : (
          filtered.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelectSub(s)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 border-b text-left transition-colors",
                "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                selectedSub?.id === s.id
                  ? "bg-blue-50 border-l-[3px] border-l-blue-500 pl-[13px]"
                  : "border-l-[3px] border-l-transparent"
              )}
            >
              {/* Avatar */}
              <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-slate-500" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate text-slate-800">
                  {s.studentName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <SubmissionStatusBadge status={s.status} />
                  {s.status === "graded" && (
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {s.totalScore}/{s.maxScore}
                    </span>
                  )}
                </div>
              </div>

              <ChevronRight className="h-4 w-4 text-muted-foreground/60 shrink-0" />
            </button>
          ))
        )}
      </ScrollArea>
    </Card>
  );
}

// ─── Single question grading row ──────────────────────────────────────────────

interface QuestionRowProps {
  index: number;
  question: Question;
  answer: SubmissionAnswer;
  gradeEntry: GradeEntry;
  saving: boolean;
  onGradeChange: (questionId: string, update: Partial<GradeEntry>) => void;
  onSave: (questionId: string) => void;
}

function QuestionRow({
  index,
  question,
  answer,
  gradeEntry,
  saving,
  onGradeChange,
  onSave,
}: QuestionRowProps) {
  const isText = question.type === "text";
  const isAutoGraded = !isText;
  const alreadySaved = answer.marksAwarded !== undefined;

  return (
    <div className="space-y-3 py-5">
      {/* Question header */}
      <div className="flex items-start gap-3">
        <span className="shrink-0 mt-0.5 h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
          {index + 1}
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-800 leading-relaxed">
            {question.text}
          </p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-500 font-medium uppercase tracking-wide">
              {question.type === "true_false" ? "True / False" : question.type}
            </span>
            <span className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-500">
              {question.marks} {question.marks === 1 ? "mark" : "marks"}
            </span>
            <span className={cn(
              "inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium capitalize",
              question.difficulty === "easy"   ? "bg-green-50  border-green-200  text-green-700" :
              question.difficulty === "medium" ? "bg-amber-50  border-amber-200  text-amber-700" :
                                                 "bg-red-50    border-red-200    text-red-700"
            )}>
              {question.difficulty}
            </span>
          </div>
        </div>
      </div>

      {/* MCQ / True-False answer */}
      {isAutoGraded && (
        <div className="ml-9 space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Student&apos;s answer:
          </p>
          {question.options?.map((opt) => {
            const isSelected = answer.selectedOptionId === opt.id;
            const isCorrect = opt.isCorrect;
            return (
              <div
                key={opt.id}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm border",
                  isSelected && isCorrect
                    ? "bg-green-50 border-green-200 text-green-800"
                    : isSelected && !isCorrect
                    ? "bg-red-50 border-red-200 text-red-800"
                    : isCorrect
                    ? "bg-green-50/60 border-green-100 text-green-700"
                    : "border-transparent text-slate-500"
                )}
              >
                {/* Radio indicator */}
                <span
                  className={cn(
                    "h-4 w-4 rounded-full border flex items-center justify-center shrink-0",
                    isSelected && isCorrect  ? "border-green-500 bg-green-500" :
                    isSelected && !isCorrect ? "border-red-500   bg-red-500"   :
                                              "border-slate-300"
                  )}
                >
                  {isSelected && (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </span>
                <span className="flex-1">{opt.text}</span>
                {isCorrect && (
                  <span className="text-xs text-green-600 font-medium shrink-0">
                    Correct answer
                  </span>
                )}
              </div>
            );
          })}

          {/* Result pill */}
          <div className="pt-1">
            {answer.isCorrect ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Correct — {question.marks} {question.marks === 1 ? "mark" : "marks"} awarded
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600">
                <XCircle className="h-3.5 w-3.5" />
                Incorrect — 0 marks
              </span>
            )}
          </div>
        </div>
      )}

      {/* Text answer — teacher grading */}
      {isText && (
        <div className="ml-9 space-y-3">
          {/* Student's answer */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">
              Student&apos;s answer:
            </p>
            <Textarea
              readOnly
              value={answer.textAnswer || ""}
              placeholder="No answer provided"
              rows={4}
              className="resize-none text-sm bg-slate-50 text-slate-800 cursor-default focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          {/* Expected answer reference */}
          {question.correctAnswer && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">
                Model answer:
              </p>
              <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800 leading-relaxed">
                {question.correctAnswer}
              </div>
            </div>
          )}

          {/* Grading inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor={`marks-${question.id}`} className="text-xs font-medium">
                Marks awarded (0–{question.marks})
              </Label>
              <Input
                id={`marks-${question.id}`}
                type="number"
                min={0}
                max={question.marks}
                step={0.5}
                value={gradeEntry.marks}
                onChange={(e) =>
                  onGradeChange(question.id, { marks: e.target.value })
                }
                className="h-9 text-sm"
                placeholder="0"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor={`feedback-${question.id}`} className="text-xs font-medium">
                Feedback <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Textarea
                id={`feedback-${question.id}`}
                rows={2}
                value={gradeEntry.feedback}
                onChange={(e) =>
                  onGradeChange(question.id, { feedback: e.target.value })
                }
                className="text-sm resize-none"
                placeholder="Write feedback for the student..."
              />
            </div>
          </div>

          {/* Save row */}
          <div className="flex items-center gap-3 pt-0.5">
            <Button
              size="sm"
              onClick={() => onSave(question.id)}
              disabled={saving}
              className="h-8 text-xs"
            >
              {saving ? "Saving…" : "Save Marks"}
            </Button>

            {alreadySaved && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {answer.marksAwarded} / {question.marks} saved
                {answer.teacherFeedback && " · Feedback added"}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Right panel — grading workspace ─────────────────────────────────────────

interface GradingPanelProps {
  submission: Submission | null;
  test: MockTest | undefined;
  grades: Record<string, GradeEntry>;
  savingId: string | null;
  onGradeChange: (questionId: string, update: Partial<GradeEntry>) => void;
  onSave: (questionId: string) => void;
}

function GradingPanel({
  submission,
  test,
  grades,
  savingId,
  onGradeChange,
  onSave,
}: GradingPanelProps) {
  if (!submission) {
    return (
      <Card className="col-span-1 lg:col-span-2 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
          <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
            <BookOpenCheck className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="font-semibold text-base text-slate-700">
            Select a submission to begin grading
          </h3>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-xs">
            Pick a student&apos;s submission from the list on the left. Auto-graded questions are
            already marked; text answers need your review.
          </p>
        </div>
      </Card>
    );
  }

  const pendingTextQuestions = test?.questions.filter((q) => {
    if (q.type !== "text") return false;
    const ans = submission.answers.find((a) => a.questionId === q.id);
    return ans?.marksAwarded === undefined;
  }).length ?? 0;

  return (
    <Card className="col-span-1 lg:col-span-2 flex flex-col overflow-hidden">
      {/* Submission header */}
      <div className="border-b px-5 py-4 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-slate-500" />
              </div>
              <h2 className="font-semibold text-slate-900">
                {submission.studentName}
              </h2>
              <SubmissionStatusBadge status={submission.status} />
            </div>

            <div className="flex items-center gap-4 mt-2 ml-10.5 flex-wrap">
              {submission.timeTakenMinutes > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {submission.timeTakenMinutes} min
                </span>
              )}
              {pendingTextQuestions > 0 && (
                <span className="text-xs text-amber-600 font-medium">
                  {pendingTextQuestions} text {pendingTextQuestions === 1 ? "answer" : "answers"} need grading
                </span>
              )}
            </div>
          </div>

          {/* Score */}
          <div className="text-right shrink-0">
            <div className="flex items-baseline gap-1 justify-end">
              <span className="text-3xl font-bold tabular-nums text-slate-900">
                {submission.totalScore}
              </span>
              <span className="text-lg text-muted-foreground font-normal">
                /{submission.maxScore}
              </span>
            </div>
            <ScoreRing percentage={submission.percentage} />
          </div>
        </div>
      </div>

      {/* Question list */}
      <ScrollArea className="flex-1">
        <div className="px-5 divide-y divide-border">
          {submission.answers.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No answers recorded for this submission.
            </div>
          ) : (
            submission.answers.map((answer, i) => {
              const question = test?.questions.find(
                (q) => q.id === answer.questionId
              );
              if (!question) return null;

              const gradeEntry: GradeEntry = grades[question.id] ?? {
                marks: answer.marksAwarded !== undefined ? String(answer.marksAwarded) : "",
                feedback: answer.teacherFeedback ?? "",
              };

              return (
                <QuestionRow
                  key={answer.questionId}
                  index={i}
                  question={question}
                  answer={answer}
                  gradeEntry={gradeEntry}
                  saving={savingId === question.id}
                  onGradeChange={onGradeChange}
                  onSave={onSave}
                />
              );
            })
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CheckingCenterPage() {
  const { activeSession } = useAppStore();
  const teacherId =
    activeSession?.role === "teacher" ? activeSession.user.id : "";

  const [tests, setTests] = useState<MockTest[]>([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [selectedTestId, setSelectedTestId] = useState<string>("");

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);

  const [filter, setFilter] = useState<SubFilter>("all");
  const [grades, setGrades] = useState<Record<string, GradeEntry>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  // Load teacher's non-draft tests
  useEffect(() => {
    setLoadingTests(true);
    getTests(teacherId).then((fetched) => {
      const nonDraft = fetched.filter((t) => t.status !== "draft");
      setTests(nonDraft);
      if (nonDraft[0]) setSelectedTestId(nonDraft[0].id);
      setLoadingTests(false);
    });
  }, [teacherId]);

  // Load submissions when test changes
  useEffect(() => {
    if (!selectedTestId) return;
    setLoadingSubmissions(true);
    setSelectedSub(null);
    setGrades({});
    getSubmissions(selectedTestId).then((subs) => {
      setSubmissions(subs);
      setLoadingSubmissions(false);
    });
  }, [selectedTestId]);

  // When a new submission is selected, seed the grade entries from existing data
  const handleSelectSub = useCallback((sub: Submission) => {
    setSelectedSub(sub);
    const initial: Record<string, GradeEntry> = {};
    sub.answers.forEach((a) => {
      initial[a.questionId] = {
        marks: a.marksAwarded !== undefined ? String(a.marksAwarded) : "",
        feedback: a.teacherFeedback ?? "",
      };
    });
    setGrades(initial);
  }, []);

  const handleGradeChange = useCallback(
    (questionId: string, update: Partial<GradeEntry>) => {
      setGrades((prev) => ({
        ...prev,
        [questionId]: { ...prev[questionId], ...update },
      }));
    },
    []
  );

  async function handleSaveGrade(questionId: string) {
    if (!selectedSub) return;
    const g = grades[questionId];
    if (!g) return;

    const selectedTest = tests.find((t) => t.id === selectedTestId);
    const question = selectedTest?.questions.find((q) => q.id === questionId);
    const marks = parseFloat(g.marks);

    if (isNaN(marks) || marks < 0 || marks > (question?.marks ?? 0)) {
      toast.error(
        `Marks must be between 0 and ${question?.marks ?? "the maximum"}.`
      );
      return;
    }

    setSavingId(questionId);
    try {
      const updated = await gradeTextAnswer(
        selectedSub.id,
        questionId,
        marks,
        g.feedback ?? ""
      );
      // Update submissions list and selected submission in one pass
      setSubmissions((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      );
      setSelectedSub(updated);
      toast.success("Marks saved.");
    } catch {
      toast.error("Failed to save marks. Please try again.");
    } finally {
      setSavingId(null);
    }
  }

  const selectedTest = tests.find((t) => t.id === selectedTestId);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Grading Center"
        subtitle="Review student submissions and award marks for text answers."
      />

      {loadingTests ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
          <Card className="flex flex-col overflow-hidden">
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-9 w-full rounded" />
              <Skeleton className="h-8 w-full rounded" />
            </CardContent>
          </Card>
          <Card className="col-span-1 lg:col-span-2 flex flex-col overflow-hidden">
            <CardContent className="flex-1 flex items-center justify-center">
              <Skeleton className="h-8 w-48" />
            </CardContent>
          </Card>
        </div>
      ) : tests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpenCheck className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="font-semibold text-slate-700 mb-1">No published tests</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Publish a test first. Once students submit their answers, they will
              appear here for grading.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
          <SubmissionList
            tests={tests}
            selectedTestId={selectedTestId}
            onSelectTest={setSelectedTestId}
            submissions={submissions}
            loadingSubmissions={loadingSubmissions}
            selectedSub={selectedSub}
            onSelectSub={handleSelectSub}
            filter={filter}
            onFilterChange={setFilter}
          />

          <GradingPanel
            submission={selectedSub}
            test={selectedTest}
            grades={grades}
            savingId={savingId}
            onGradeChange={handleGradeChange}
            onSave={handleSaveGrade}
          />
        </div>
      )}
    </div>
  );
}

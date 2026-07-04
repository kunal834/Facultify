"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Flag,
  ChevronLeft,
  ChevronRight,
  Send,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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
import ScoreBadge from "@/components/testing/ScoreBadge";
import { useAppStore } from "@/store/app-store";
import {
  getTest,
  startTest,
  submitTest,
  getSubmission,
  isResultVisible,
} from "@/lib/supabase-service";
import { cn, formatDateTime } from "@/lib/utils";
import type { MockTest, Question, SubmissionAnswer, Submission } from "@/lib/types";

// ─── Time formatting ──────────────────────────────────────────────────────────

function formatMMSS(seconds: number): string {
  const m = Math.floor(Math.max(0, seconds) / 60);
  const s = Math.max(0, seconds) % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ─── Difficulty badge colours ─────────────────────────────────────────────────

const difficultyStyle: Record<string, string> = {
  easy: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border border-amber-200",
  hard: "bg-red-50 text-red-700 border border-red-200",
};

const difficultyLabel: Record<string, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

// ─── Question status colours (navigation grid) ────────────────────────────────

function navButtonClass(
  status: "unanswered" | "answered" | "flagged",
  isCurrent: boolean
): string {
  if (isCurrent) {
    return "bg-blue-600 text-white border-blue-600 shadow ring-2 ring-blue-300 ring-offset-1 scale-[1.08]";
  }
  if (status === "answered") {
    return "bg-blue-500 text-white border-blue-500 hover:bg-blue-600";
  }
  if (status === "flagged") {
    return "bg-amber-400 text-amber-950 border-amber-400 hover:bg-amber-500";
  }
  return "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200";
}

// ─── Option button for MCQ / True-False ───────────────────────────────────────

function OptionButton({
  label,
  optionId,
  selected,
  onSelect,
}: {
  label: string;
  optionId: string;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(optionId)}
      className={cn(
        "group w-full flex items-center gap-4 px-5 py-4 rounded-xl border-2 text-left",
        "transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
        selected
          ? "border-blue-500 bg-blue-50 text-blue-900"
          : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-slate-50"
      )}
    >
      {/* Radio circle */}
      <span
        className={cn(
          "flex-shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors",
          selected
            ? "border-blue-500 bg-blue-500"
            : "border-slate-400 group-hover:border-blue-400"
        )}
      >
        {selected && <span className="h-2 w-2 rounded-full bg-white" />}
      </span>
      <span className="text-base leading-snug">{label}</span>
    </button>
  );
}

// ─── True / False large buttons ───────────────────────────────────────────────

function TrueFalseButton({
  label,
  optionId,
  selected,
  onSelect,
}: {
  label: string;
  optionId: string;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(optionId)}
      className={cn(
        "flex-1 py-6 rounded-2xl border-2 font-semibold text-xl transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
        selected
          ? "border-blue-500 bg-blue-600 text-white shadow-md"
          : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50"
      )}
    >
      {label}
    </button>
  );
}

// ─── Review mode: read-only option row (shows correct answer + student's pick) ─

function ReviewOptionRow({
  label,
  isCorrectOption,
  isSelected,
}: {
  label: string;
  isCorrectOption: boolean;
  isSelected: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 px-5 py-4 rounded-xl border-2",
        isCorrectOption
          ? "border-emerald-400 bg-emerald-50"
          : isSelected
          ? "border-red-400 bg-red-50"
          : "border-slate-200 bg-white"
      )}
    >
      {isCorrectOption ? (
        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
      ) : isSelected ? (
        <XCircle className="h-5 w-5 text-red-500 shrink-0" />
      ) : (
        <span className="h-5 w-5 shrink-0 rounded-full border-2 border-slate-300" />
      )}
      <span className="text-base leading-snug text-slate-700">{label}</span>
      {isSelected && (
        <span className="ml-auto text-xs font-medium text-slate-400 shrink-0">
          Your answer
        </span>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ActiveTestPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 bg-slate-50 flex items-center justify-center z-50">
          <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ActiveTestPageInner />
    </Suspense>
  );
}

function ActiveTestPageInner() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const reviewId = searchParams.get("review");
  const { activeSession } = useAppStore();

  // Resolve studentId from store; fall back to mock default
  const student = activeSession?.role === "student" ? activeSession.user : null;
  const studentId = student?.id ?? "";

  // ── Core data state ─────────────────────────────────────────────────────────
  const [test, setTest] = useState<MockTest | null>(null);
  const [activeSubmission, setActiveSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Answer / navigation state ────────────────────────────────────────────────
  const [answers, setAnswers] = useState<Record<string, SubmissionAnswer>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [flagged, setFlagged] = useState<Set<string>>(new Set());

  // ── Submission UI state ──────────────────────────────────────────────────────
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Timer state ──────────────────────────────────────────────────────────────
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // ── Load test + submission ────────────────────────────────────────────────────
  useEffect(() => {
    if (!params.id) return;
    let cancelled = false;

    async function load() {
      const t = await getTest(params.id as string);
      if (cancelled) return;
      setTest(t ?? null);

      // Explicit review link (from the "View Results" button) — read-only, no timer.
      if (reviewId) {
        const sub = await getSubmission(reviewId);
        if (cancelled) return;
        setActiveSubmission(sub ?? null);
        setLoading(false);
        return;
      }

      const sub = await startTest(params.id as string, studentId);
      if (cancelled) return;
      setActiveSubmission(sub);

      // Already finished — never re-enter the live exam UI, even without ?review=.
      if (sub.status === "submitted" || sub.status === "graded") {
        setLoading(false);
        return;
      }

      // Hydrate any already-saved answers (resume in-progress attempt)
      if (sub.answers?.length) {
        const restored: Record<string, SubmissionAnswer> = {};
        sub.answers.forEach((a) => {
          restored[a.questionId] = a;
        });
        setAnswers(restored);
      }

      if (t) {
        setTimeLeft(t.durationMinutes * 60);
      }

      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [params.id, studentId, reviewId]);

  const isReviewMode =
    !!activeSubmission &&
    (activeSubmission.status === "submitted" ||
      activeSubmission.status === "graded");

  // ── Countdown tick ───────────────────────────────────────────────────────────
  const handleAutoSubmit = useCallback(() => {
    toast.warning("Time's up — submitting your test automatically.");
    // Trigger submission flow
    setShowConfirm(false);
    void (async () => {
      if (!activeSubmission) return;
      setSubmitting(true);
      const timeTakenMs = Date.now() - startTimeRef.current;
      const timeTakenMinutes = Math.max(1, Math.round(timeTakenMs / 60000));
      const answerList = Object.values(answers);
      try {
        await submitTest(activeSubmission.id, answerList, timeTakenMinutes);
        toast.success("Test submitted.");
        router.push("/student/analytics");
      } catch {
        toast.error("Could not submit. Please try again.");
        setSubmitting(false);
      }
    })();
  }, [activeSubmission, answers, router]);

  useEffect(() => {
    if (loading || !test || isReviewMode) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, test, isReviewMode, handleAutoSubmit]);

  // ── Answer handlers ───────────────────────────────────────────────────────────
  const handleSelectOption = useCallback(
    (questionId: string, optionId: string) => {
      setAnswers((prev) => ({
        ...prev,
        [questionId]: {
          questionId,
          selectedOptionId: optionId,
          timeSpentSeconds: 0,
        },
      }));
    },
    []
  );

  const handleTextAnswer = useCallback(
    (questionId: string, text: string) => {
      setAnswers((prev) => ({
        ...prev,
        [questionId]: {
          questionId,
          textAnswer: text,
          timeSpentSeconds: 0,
        },
      }));
    },
    []
  );

  // ── Flag toggle ───────────────────────────────────────────────────────────────
  const toggleFlag = useCallback((questionId: string) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  }, []);

  // ── Question status for nav grid ──────────────────────────────────────────────
  const getQuestionStatus = (
    questionId: string
  ): "unanswered" | "answered" | "flagged" => {
    if (flagged.has(questionId)) return "flagged";
    const a = answers[questionId];
    if (a && (a.selectedOptionId || (a.textAnswer && a.textAnswer.trim() !== "")))
      return "answered";
    return "unanswered";
  };

  // ── Manual submit ─────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!activeSubmission) return;
    setSubmitting(true);
    const timeTakenMs = Date.now() - startTimeRef.current;
    const timeTakenMinutes = Math.max(1, Math.round(timeTakenMs / 60000));
    const answerList = Object.values(answers);
    try {
      await submitTest(activeSubmission.id, answerList, timeTakenMinutes);
      toast.success("Test submitted successfully!");
      router.push("/student/analytics");
    } catch {
      toast.error("Submission failed — please try again.");
      setSubmitting(false);
    }
  }, [activeSubmission, answers, router]);

  // ── Computed ──────────────────────────────────────────────────────────────────
  const isWarning = timeLeft <= 300 && timeLeft > 60;
  const isCritical = timeLeft <= 60;
  const timerProgress =
    test && test.durationMinutes > 0
      ? (timeLeft / (test.durationMinutes * 60)) * 100
      : 100;

  // ── Loading state ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-50 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500 font-medium">Preparing your test…</p>
        </div>
      </div>
    );
  }

  // ── Error / empty state ───────────────────────────────────────────────────────
  if (!test || test.questions.length === 0) {
    return (
      <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center gap-5">
        <AlertTriangle className="h-12 w-12 text-amber-400" />
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-800">Test not available</p>
          <p className="text-sm text-slate-500 mt-1">
            This test has no questions or could not be loaded.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/student/tests")}>
          Back to Tests
        </Button>
      </div>
    );
  }

  // ── Review link requested but submission couldn't be loaded ───────────────────
  if (reviewId && !activeSubmission) {
    return (
      <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center gap-5">
        <AlertTriangle className="h-12 w-12 text-amber-400" />
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-800">
            Result not found
          </p>
          <p className="text-sm text-slate-500 mt-1">
            We couldn&apos;t load this submission.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/student/tests")}>
          Back to Tests
        </Button>
      </div>
    );
  }

  // ── Review mode (already submitted/graded) ────────────────────────────────────
  if (isReviewMode && activeSubmission) {
    const resultVisible = isResultVisible(test, activeSubmission);

    if (!resultVisible) {
      return (
        <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center gap-5">
          <Clock className="h-12 w-12 text-blue-400" />
          <div className="text-center max-w-sm">
            <p className="text-lg font-semibold text-slate-800">
              Results not declared yet
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Your teacher hasn&apos;t released the results for{" "}
              <strong>{test.title}</strong> yet. Check back soon.
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push("/student/tests")}>
            Back to Tests
          </Button>
        </div>
      );
    }

    const answersByQuestion = new Map(
      activeSubmission.answers.map((a) => [a.questionId, a])
    );

    return (
      <div className="min-h-screen bg-slate-50">
        {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
        <header className="bg-white border-b border-slate-200 px-5 py-4 shadow-sm sticky top-0 z-20">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => router.push("/student/tests")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="font-semibold text-sm leading-tight truncate text-slate-800">
                {test.title}
              </h1>
              <p className="text-xs text-slate-400 truncate">
                {test.subject} &middot; Test Results
              </p>
            </div>
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          {/* ── Score summary ────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-wrap items-center gap-6">
            <ScoreBadge
              score={activeSubmission.totalScore}
              maxScore={activeSubmission.maxScore}
            />
            <div className="flex-1 min-w-[180px] grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">
                  Status
                </p>
                <p className="font-medium text-slate-700 capitalize">
                  {activeSubmission.status}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">
                  Time Taken
                </p>
                <p className="font-medium text-slate-700">
                  {activeSubmission.timeTakenMinutes
                    ? `${activeSubmission.timeTakenMinutes} min`
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">
                  Submitted
                </p>
                <p className="font-medium text-slate-700">
                  {activeSubmission.submittedAt
                    ? formatDateTime(activeSubmission.submittedAt)
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">
                  Questions
                </p>
                <p className="font-medium text-slate-700">
                  {test.questions.length}
                </p>
              </div>
            </div>
          </div>

          {/* ── Per-question breakdown ───────────────────────────────────── */}
          {test.questions.map((q, i) => {
            const answer = answersByQuestion.get(q.id);
            return (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8"
              >
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                      Question {i + 1} of {test.questions.length}
                    </span>
                    <Badge
                      className={cn(
                        "text-xs font-medium capitalize rounded-full",
                        difficultyStyle[q.difficulty]
                      )}
                    >
                      {difficultyLabel[q.difficulty]}
                    </Badge>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs font-medium rounded-full shrink-0",
                      (answer?.marksAwarded ?? 0) >= q.marks
                        ? "text-emerald-700 border-emerald-300 bg-emerald-50"
                        : (answer?.marksAwarded ?? 0) > 0
                        ? "text-amber-700 border-amber-300 bg-amber-50"
                        : "text-red-700 border-red-300 bg-red-50"
                    )}
                  >
                    {answer?.marksAwarded ?? 0} / {q.marks} marks
                  </Badge>
                </div>

                <p className="text-lg font-medium leading-relaxed text-slate-800 mb-8">
                  {q.text}
                </p>

                {(q.type === "mcq" || q.type === "true_false") &&
                  q.options && (
                    <div className={cn(q.type === "true_false" ? "flex gap-4" : "space-y-3")}>
                      {q.options.map((option) => (
                        <ReviewOptionRow
                          key={option.id}
                          label={option.text}
                          isCorrectOption={option.isCorrect}
                          isSelected={answer?.selectedOptionId === option.id}
                        />
                      ))}
                    </div>
                  )}

                {q.type === "text" && (
                  <div className="space-y-3">
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
                        Your answer
                      </p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">
                        {answer?.textAnswer?.trim() || "No answer submitted"}
                      </p>
                    </div>
                    {answer?.teacherFeedback && (
                      <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                        <p className="text-xs font-medium text-blue-500 uppercase tracking-wide mb-1">
                          Teacher feedback
                        </p>
                        <p className="text-sm text-blue-800">
                          {answer.teacherFeedback}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex justify-center pb-4">
            <Button variant="outline" asChild>
              <Link href="/student/tests">Back to Tests</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Derived values ────────────────────────────────────────────────────────────
  const question: Question = test.questions[currentQuestion];
  const totalQuestions = test.questions.length;
  const answeredCount = Object.values(answers).filter(
    (a) => a.selectedOptionId || (a.textAnswer && a.textAnswer.trim() !== "")
  ).length;
  const unansweredCount = totalQuestions - answeredCount;
  const currentAnswer = answers[question.id];

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-slate-50 flex flex-col overflow-hidden">
      {/* ── TOP BAR ─────────────────────────────────────────────────────────── */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-5 shrink-0 z-20 shadow-sm">
        {/* Left: brand + title */}
        <div className="flex items-center gap-3 min-w-0 max-w-[35%]">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold select-none">F</span>
          </div>
          <div className="min-w-0">
            <h1 className="font-semibold text-sm leading-tight truncate text-slate-800">
              {test.title}
            </h1>
            <p className="text-xs text-slate-400 truncate">{test.subject}</p>
          </div>
        </div>

        {/* Center: countdown timer */}
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1.5">
            <Clock
              className={cn(
                "h-3.5 w-3.5",
                isCritical
                  ? "text-red-500"
                  : isWarning
                  ? "text-amber-500"
                  : "text-slate-400"
              )}
            />
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
              Time Remaining
            </span>
          </div>
          <span
            className={cn(
              "text-2xl font-mono font-bold tabular-nums leading-none",
              isCritical
                ? "text-red-600 animate-pulse"
                : isWarning
                ? "text-amber-600"
                : "text-slate-700"
            )}
          >
            {formatMMSS(timeLeft)}
          </span>
          <Progress
            value={timerProgress}
            className={cn(
              "h-1 w-24 mt-0.5",
              isCritical
                ? "[&>div]:bg-red-500"
                : isWarning
                ? "[&>div]:bg-amber-500"
                : "[&>div]:bg-blue-500"
            )}
          />
        </div>

        {/* Right: question counter + submit */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500 hidden sm:block tabular-nums">
            <span className="font-semibold text-slate-700">{currentQuestion + 1}</span>
            <span className="text-slate-400"> / {totalQuestions}</span>
          </span>
          <Button
            onClick={() => setShowConfirm(true)}
            disabled={submitting}
            className="gap-1.5 bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{submitting ? "Submitting…" : "Submit Test"}</span>
          </Button>
        </div>
      </header>

      {/* ── MAIN CONTENT ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT: Question area (70%) ──────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-8 w-full">
            {/* Question card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 animate-fade-in">
              {/* Question header row */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                    Question {currentQuestion + 1} of {totalQuestions}
                  </span>
                  <Badge
                    className={cn(
                      "text-xs font-medium capitalize rounded-full",
                      difficultyStyle[question.difficulty]
                    )}
                  >
                    {difficultyLabel[question.difficulty]}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-xs font-medium rounded-full"
                  >
                    {question.marks}{" "}
                    {question.marks === 1 ? "mark" : "marks"}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="text-xs font-medium rounded-full capitalize"
                  >
                    {question.type === "true_false"
                      ? "True / False"
                      : question.type.toUpperCase()}
                  </Badge>
                </div>

                {/* Flag toggle */}
                <button
                  type="button"
                  onClick={() => toggleFlag(question.id)}
                  className={cn(
                    "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                    "transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-400",
                    flagged.has(question.id)
                      ? "bg-amber-100 text-amber-700 border border-amber-300"
                      : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200"
                  )}
                >
                  <Flag className="h-3.5 w-3.5" />
                  {flagged.has(question.id) ? "Flagged" : "Flag for review"}
                </button>
              </div>

              {/* Question text */}
              <p className="text-lg font-medium leading-relaxed text-slate-800 mb-8">
                {question.text}
              </p>

              {/* ── MCQ options ─────────────────────────────────────────────── */}
              {question.type === "mcq" && question.options && (
                <div className="space-y-3">
                  {question.options.map((option) => (
                    <OptionButton
                      key={option.id}
                      label={option.text}
                      optionId={option.id}
                      selected={currentAnswer?.selectedOptionId === option.id}
                      onSelect={(id) => handleSelectOption(question.id, id)}
                    />
                  ))}
                </div>
              )}

              {/* ── True / False options ────────────────────────────────────── */}
              {question.type === "true_false" && question.options && (
                <div className="flex gap-4">
                  {question.options.map((option) => (
                    <TrueFalseButton
                      key={option.id}
                      label={option.text}
                      optionId={option.id}
                      selected={currentAnswer?.selectedOptionId === option.id}
                      onSelect={(id) => handleSelectOption(question.id, id)}
                    />
                  ))}
                </div>
              )}

              {/* ── Text / free-form answer ─────────────────────────────────── */}
              {question.type === "text" && (
                <div className="space-y-2">
                  <label
                    htmlFor="text-answer"
                    className="text-sm font-medium text-slate-600"
                  >
                    Your answer
                  </label>
                  <Textarea
                    id="text-answer"
                    placeholder="Write your answer here…"
                    className="min-h-[180px] resize-y text-base leading-relaxed"
                    value={currentAnswer?.textAnswer ?? ""}
                    onChange={(e) =>
                      handleTextAnswer(question.id, e.target.value)
                    }
                  />
                </div>
              )}
            </div>

            {/* ── Prev / Next navigation ─────────────────────────────────────── */}
            <div className="flex items-center justify-between mt-5">
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentQuestion((i) => Math.max(0, i - 1))
                }
                disabled={currentQuestion === 0}
                className="gap-1.5"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <span className="text-xs text-slate-400 tabular-nums">
                {answeredCount} of {totalQuestions} answered
              </span>

              {currentQuestion < totalQuestions - 1 ? (
                <Button
                  onClick={() =>
                    setCurrentQuestion((i) =>
                      Math.min(totalQuestions - 1, i + 1)
                    )
                  }
                  className="gap-1.5 bg-blue-600 hover:bg-blue-700"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={() => setShowConfirm(true)}
                  disabled={submitting}
                  className="gap-1.5 bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4" />
                  Submit
                </Button>
              )}
            </div>
          </div>
        </main>

        {/* ── RIGHT: Question navigator (30%) ────────────────────────────────── */}
        <aside className="w-64 shrink-0 border-l border-slate-200 bg-white overflow-y-auto flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Question Navigator
            </p>
          </div>

          {/* Legend */}
          <div className="px-4 pt-3 pb-2 flex flex-col gap-1.5 text-xs text-slate-500">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500 inline-block" />
              Answered
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400 inline-block" />
              Flagged
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-200 inline-block" />
              Unanswered
            </span>
          </div>

          {/* Number grid */}
          <div className="px-4 pt-2 pb-4 grid grid-cols-5 gap-1.5">
            {test.questions.map((q, i) => {
              const status = getQuestionStatus(q.id);
              const isCurrent = i === currentQuestion;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentQuestion(i)}
                  className={cn(
                    "h-9 w-full rounded-lg text-xs font-semibold transition-all duration-150 border",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1",
                    navButtonClass(status, isCurrent)
                  )}
                  aria-label={`Go to question ${i + 1}, ${status}`}
                  aria-current={isCurrent ? "true" : undefined}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          {/* Summary counts */}
          <div className="mt-auto p-4 border-t border-slate-100 space-y-2.5">
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2 text-slate-500">
                <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                Answered
              </span>
              <span className="font-semibold text-blue-600 tabular-nums">
                {answeredCount}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2 text-slate-500">
                <Flag className="h-3.5 w-3.5 text-amber-500" />
                Flagged
              </span>
              <span className="font-semibold text-amber-600 tabular-nums">
                {flagged.size}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2 text-slate-500">
                <span className="h-3.5 w-3.5 rounded-full border-2 border-slate-300 inline-block" />
                Unanswered
              </span>
              <span className="font-semibold text-slate-400 tabular-nums">
                {unansweredCount}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-100">
              <span className="text-slate-500">Total</span>
              <span className="font-semibold text-slate-700 tabular-nums">
                {totalQuestions}
              </span>
            </div>
          </div>
        </aside>
      </div>

      {/* ── SUBMIT CONFIRMATION DIALOG ───────────────────────────────────────── */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit your test?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-slate-600">
                <p>
                  You are about to submit{" "}
                  <strong className="text-slate-800">{test.title}</strong>.
                  Once submitted, you cannot change your answers.
                </p>
                <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Questions answered</span>
                    <span className="font-semibold text-slate-800">
                      {answeredCount} / {totalQuestions}
                    </span>
                  </div>
                  {unansweredCount > 0 && (
                    <p className="text-amber-700 text-xs font-medium flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      {unansweredCount} question
                      {unansweredCount !== 1 ? "s" : ""} left unanswered.
                    </p>
                  )}
                  {flagged.size > 0 && (
                    <p className="text-amber-700 text-xs font-medium flex items-center gap-1.5">
                      <Flag className="h-3.5 w-3.5 shrink-0" />
                      {flagged.size} question
                      {flagged.size !== 1 ? "s are" : " is"} still flagged.
                    </p>
                  )}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>
              Review answers
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500"
            >
              {submitting ? "Submitting…" : "Submit test"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Check,
  ChevronRight,
  ChevronLeft,
  FileText,
  Send,
  X,
  BookOpen,
  Clock,
  Users,
  Target,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import {
  createTest,
  addQuestionToTest,
  publishTest,
  getBatches,
} from "@/lib/supabase-service";
import type {
  MockTest,
  Question,
  QuestionType,
  DifficultyLevel,
  Batch,
  CreateTestFormData,
} from "@/lib/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Test Details", hint: "Name, batch, timing" },
  { id: 2, label: "Add Questions", hint: "Build your question bank" },
  { id: 3, label: "Review & Publish", hint: "Confirm and go live" },
] as const;

const DIFFICULTY_STYLES: Record<DifficultyLevel, string> = {
  easy: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  hard: "bg-red-50 text-red-700 border-red-200",
};

const TYPE_STYLES: Record<QuestionType, string> = {
  mcq: "bg-blue-50 text-blue-700 border-blue-200",
  text: "bg-violet-50 text-violet-700 border-violet-200",
  true_false: "bg-orange-50 text-orange-700 border-orange-200",
};

const TYPE_LABELS: Record<QuestionType, string> = {
  mcq: "Multiple Choice",
  text: "Written Answer",
  true_false: "True / False",
};

// ─── Question form state ──────────────────────────────────────────────────────

interface QForm {
  text: string;
  type: QuestionType;
  marks: number;
  difficulty: DifficultyLevel;
  options: { text: string; isCorrect: boolean }[];
  correctAnswer: string;
  explanation: string;
}

const DEFAULT_QFORM: QForm = {
  text: "",
  type: "mcq",
  marks: 5,
  difficulty: "medium",
  options: [
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ],
  correctAnswer: "",
  explanation: "",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepProgress({ current }: { current: number }) {
  return (
    <div className="mb-8">
      {/* Mobile: compact circles */}
      <div className="flex items-center gap-0 sm:hidden">
        {STEPS.map((s, i) => {
          const done = current > s.id;
          const active = current === s.id;
          return (
            <div key={s.id} className="flex items-center flex-1">
              <div
                className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all shrink-0",
                  done
                    ? "bg-blue-600 border-blue-600 text-white"
                    : active
                    ? "border-blue-600 text-blue-600 bg-white"
                    : "border-slate-200 text-slate-400 bg-white"
                )}
              >
                {done ? <Check className="h-3 w-3" /> : s.id}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-2 rounded-full transition-all duration-500",
                    current > s.id ? "bg-blue-600" : "bg-slate-200"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop: labeled stepper */}
      <div className="hidden sm:flex items-start gap-0">
        {STEPS.map((s, i) => {
          const done = current > s.id;
          const active = current === s.id;
          return (
            <div key={s.id} className="flex items-start flex-1">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300",
                    done
                      ? "bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-200"
                      : active
                      ? "border-blue-600 text-blue-600 bg-white ring-4 ring-blue-50"
                      : "border-slate-200 text-slate-400 bg-white"
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : s.id}
                </div>
                <div className="text-center">
                  <p
                    className={cn(
                      "text-sm font-semibold leading-tight",
                      active
                        ? "text-blue-600"
                        : done
                        ? "text-slate-700"
                        : "text-slate-400"
                    )}
                  >
                    {s.label}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{s.hint}</p>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-3 mt-[18px] rounded-full transition-all duration-500",
                    current > s.id ? "bg-blue-600" : "bg-slate-200"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuestionCard({
  question,
  index,
  onDelete,
}: {
  question: Question;
  index: number;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        "group relative flex gap-4 p-4 rounded-xl border bg-white",
        "border-l-[3px]",
        question.type === "mcq"
          ? "border-l-blue-500"
          : question.type === "text"
          ? "border-l-violet-500"
          : "border-l-orange-500"
      )}
    >
      <div className="shrink-0 flex flex-col items-center pt-0.5">
        <span className="text-xs font-bold text-slate-400 tabular-nums w-6 text-center">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border",
              TYPE_STYLES[question.type]
            )}
          >
            {TYPE_LABELS[question.type]}
          </span>
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border capitalize",
              DIFFICULTY_STYLES[question.difficulty]
            )}
          >
            {question.difficulty}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border bg-slate-50 text-slate-600 border-slate-200 tabular-nums">
            {question.marks} {question.marks === 1 ? "mark" : "marks"}
          </span>
        </div>
        <p className="text-sm text-slate-800 leading-relaxed line-clamp-2">
          {question.text}
        </p>
        {question.options && question.options.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {question.options.map((o) => (
              <span
                key={o.id}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px]",
                  o.isCorrect
                    ? "bg-emerald-50 text-emerald-700 font-medium"
                    : "bg-slate-50 text-slate-500"
                )}
              >
                {o.isCorrect && <Check className="h-2.5 w-2.5" />}
                {o.text || <span className="italic opacity-60">empty</span>}
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={onDelete}
        aria-label="Delete question"
        className="shrink-0 h-7 w-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function MarksCounter({ count, total }: { count: number; total: number }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200">
      <Target className="h-4 w-4 text-slate-400" />
      <div className="text-sm">
        <span className="font-bold text-slate-900 tabular-nums">{count}</span>
        <span className="text-slate-400 mx-1">
          {count === 1 ? "question" : "questions"}
        </span>
        <span className="text-slate-300 mx-1">·</span>
        <span className="font-bold text-blue-600 tabular-nums">{total}</span>
        <span className="text-slate-400 ml-1">total marks</span>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CreateTestPage() {
  const router = useRouter();
  const { activeSession } = useAppStore();
  const teacher = activeSession?.role === "teacher" ? activeSession.user : null;
  const teacherId = teacher?.id ?? "";
  const institutionId = teacher?.institutionId ?? "";

  const [step, setStep] = useState(1);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [test, setTest] = useState<MockTest | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showQForm, setShowQForm] = useState(false);
  const [qForm, setQForm] = useState<QForm>(DEFAULT_QFORM);
  const [submitting, setSubmitting] = useState(false);

  const [details, setDetails] = useState<CreateTestFormData & { closesAt?: string }>({
    title: "",
    description: "",
    subject: "",
    batchId: "",
    durationMinutes: 60,
    scheduledAt: "",
    closesAt: "",
  });

  const qFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getBatches(teacherId).then((b) => {
      setBatches(b);
    });
  }, [teacherId]);

  useEffect(() => {
    if (showQForm && qFormRef.current) {
      qFormRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showQForm]);

  // ── Step 1 ──────────────────────────────────────────────────────────────────

  async function handleCreateTest() {
    if (!details.title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (!details.subject.trim()) {
      toast.error("Subject is required.");
      return;
    }
    if (!details.batchId) {
      toast.error("Please select a batch.");
      return;
    }
    setSubmitting(true);
    try {
      const t = await createTest({
        title: details.title.trim(),
        description: details.description.trim(),
        subject: details.subject.trim(),
        batchId: details.batchId,
        teacherId,
        institutionId,
        status: "draft",
        totalMarks: 0,
        durationMinutes: details.durationMinutes,
        scheduledAt: details.scheduledAt || undefined,
        closesAt: details.closesAt || undefined,
        aiGenerated: false,
      });
      setTest(t);
      setStep(2);
      toast.success("Test created. Now add your questions.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Step 2 ──────────────────────────────────────────────────────────────────

  async function handleAddQuestion() {
    if (!qForm.text.trim()) {
      toast.error("Question text cannot be empty.");
      return;
    }
    if (!test) return;

    if (qForm.type === "mcq") {
      const filled = qForm.options.filter((o) => o.text.trim());
      if (filled.length < 2) {
        toast.error("Add at least 2 options.");
        return;
      }
      if (!qForm.options.some((o) => o.isCorrect)) {
        toast.error("Mark the correct option.");
        return;
      }
    }

    if (qForm.type === "true_false") {
      if (!qForm.options.some((o) => o.isCorrect)) {
        toast.error("Select the correct answer (True or False).");
        return;
      }
    }

    const newQ = await addQuestionToTest(test.id, {
      order: questions.length + 1,
      type: qForm.type,
      text: qForm.text.trim(),
      marks: qForm.marks,
      difficulty: qForm.difficulty,
      options:
        qForm.type === "true_false"
          ? [
              {
                id: "tf_true",
                text: "True",
                isCorrect: qForm.options[0]?.isCorrect ?? false,
              },
              {
                id: "tf_false",
                text: "False",
                isCorrect: !qForm.options[0]?.isCorrect,
              },
            ]
          : qForm.type === "mcq"
          ? qForm.options
              .filter((o) => o.text.trim())
              .map((o, i) => ({
                id: `opt_${i}`,
                text: o.text.trim(),
                isCorrect: o.isCorrect,
              }))
          : undefined,
      correctAnswer:
        qForm.type === "text" ? qForm.correctAnswer.trim() : undefined,
      explanation: qForm.explanation.trim() || undefined,
      aiGenerated: false,
    });
    setQuestions((prev) => [...prev, newQ]);
    setQForm(DEFAULT_QFORM);
    setShowQForm(false);
    toast.success("Question added.");
  }

  function handleDeleteQuestion(id: string) {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  // ── Step 3 ──────────────────────────────────────────────────────────────────

  async function handlePublish() {
    if (!test) return;
    if (questions.length === 0) {
      toast.error("Add at least one question before publishing.");
      return;
    }
    setSubmitting(true);
    try {
      await publishTest(test.id);
      toast.success(`"${test.title}" is now live.`);
      router.push("/teacher/tests");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveDraft() {
    toast.success("Saved as draft. You can publish it any time.");
    router.push("/teacher/tests");
  }

  const totalMarks = questions.reduce((acc, q) => acc + q.marks, 0);
  const batchName =
    batches.find((b) => b.id === (test?.batchId ?? details.batchId))?.name ?? "—";

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Page heading */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
          <FileText className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Create Test</h1>
          <p className="text-sm text-muted-foreground">
            Build a structured assessment for your students
          </p>
        </div>
      </div>

      <StepProgress current={step} />

      {/* ── STEP 1: Test Details ─────────────────────────────────────────────── */}
      {step === 1 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Test Details</CardTitle>
            <p className="text-sm text-muted-foreground">
              These settings define how the test appears to students and when it&apos;s available.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g. Quadratic Equations — Mid Term"
                value={details.title}
                onChange={(e) => setDetails((d) => ({ ...d, title: e.target.value }))}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief overview visible to students before they start"
                value={details.description}
                onChange={(e) => setDetails((d) => ({ ...d, description: e.target.value }))}
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Subject + Batch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="subject">
                  Subject <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="subject"
                  placeholder="Mathematics"
                  value={details.subject}
                  onChange={(e) => setDetails((d) => ({ ...d, subject: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  Batch <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={details.batchId}
                  onValueChange={(v) => setDetails((d) => ({ ...d, batchId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {batches.length === 0 && (
                      <SelectItem value="_none" disabled>
                        No batches found
                      </SelectItem>
                    )}
                    {batches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="duration"
                  type="number"
                  min={5}
                  max={300}
                  className="w-28"
                  value={details.durationMinutes}
                  onChange={(e) =>
                    setDetails((d) => ({
                      ...d,
                      durationMinutes: parseInt(e.target.value) || 60,
                    }))
                  }
                />
                <span className="text-sm text-muted-foreground">minutes</span>
              </div>
            </div>

            {/* Schedule */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="scheduledAt">
                  Opens at{" "}
                  <span className="text-slate-400 font-normal">(optional)</span>
                </Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={details.scheduledAt}
                  onChange={(e) => setDetails((d) => ({ ...d, scheduledAt: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="closesAt">
                  Closes at{" "}
                  <span className="text-slate-400 font-normal">(optional)</span>
                </Label>
                <Input
                  id="closesAt"
                  type="datetime-local"
                  value={details.closesAt}
                  onChange={(e) => setDetails((d) => ({ ...d, closesAt: e.target.value }))}
                />
              </div>
            </div>

            <Separator />

            <Button
              onClick={handleCreateTest}
              disabled={submitting}
              className="w-full"
              size="lg"
            >
              {submitting ? (
                "Creating test…"
              ) : (
                <>
                  Continue to Questions
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── STEP 2: Add Questions ────────────────────────────────────────────── */}
      {step === 2 && test && (
        <div className="space-y-4">
          {/* Header bar */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{test.title}</h2>
              <p className="text-sm text-muted-foreground">
                {test.subject} · {batchName}
              </p>
            </div>
            <Button
              onClick={() => setStep(3)}
              disabled={questions.length === 0}
              size="sm"
            >
              Review test
              <ChevronRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>

          {/* Marks counter */}
          <MarksCounter count={questions.length} total={totalMarks} />

          {/* Empty state */}
          {questions.length === 0 && !showQForm && (
            <div className="flex flex-col items-center justify-center py-16 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-center">
              <BookOpen className="h-10 w-10 text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-600 mb-1">No questions yet</p>
              <p className="text-xs text-slate-400 max-w-xs">
                Add your first question. You can mix MCQ, written, and true/false types.
              </p>
            </div>
          )}

          {/* Question list */}
          {questions.length > 0 && (
            <div className="space-y-2.5">
              {questions.map((q, i) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  index={i}
                  onDelete={() => handleDeleteQuestion(q.id)}
                />
              ))}
            </div>
          )}

          {/* Question form */}
          {showQForm ? (
            <div
              ref={qFormRef}
              className="rounded-xl border border-blue-100 bg-blue-50/40 shadow-sm overflow-hidden"
            >
              {/* Form header */}
              <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-blue-100">
                <p className="text-sm font-semibold text-slate-800">
                  New question
                  {questions.length > 0 && (
                    <span className="ml-2 text-slate-400 font-normal">
                      #{questions.length + 1}
                    </span>
                  )}
                </p>
                <button
                  onClick={() => {
                    setShowQForm(false);
                    setQForm(DEFAULT_QFORM);
                  }}
                  aria-label="Discard question"
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Question text */}
                <div className="space-y-1.5">
                  <Label htmlFor="qtext">
                    Question <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="qtext"
                    placeholder="Write your question clearly and concisely…"
                    value={qForm.text}
                    onChange={(e) => setQForm((f) => ({ ...f, text: e.target.value }))}
                    rows={3}
                    className="resize-none bg-white"
                  />
                </div>

                {/* Type / Marks / Difficulty */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>Type</Label>
                    <Select
                      value={qForm.type}
                      onValueChange={(v) => {
                        const t = v as QuestionType;
                        setQForm((f) => ({
                          ...f,
                          type: t,
                          options:
                            t === "true_false"
                              ? [
                                  { text: "True", isCorrect: false },
                                  { text: "False", isCorrect: false },
                                ]
                              : t === "mcq"
                              ? DEFAULT_QFORM.options
                              : f.options,
                        }));
                      }}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mcq">MCQ</SelectItem>
                        <SelectItem value="text">Written</SelectItem>
                        <SelectItem value="true_false">True / False</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="qmarks">Marks</Label>
                    <Input
                      id="qmarks"
                      type="number"
                      min={1}
                      max={100}
                      value={qForm.marks}
                      onChange={(e) =>
                        setQForm((f) => ({ ...f, marks: parseInt(e.target.value) || 1 }))
                      }
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Difficulty</Label>
                    <Select
                      value={qForm.difficulty}
                      onValueChange={(v) =>
                        setQForm((f) => ({ ...f, difficulty: v as DifficultyLevel }))
                      }
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* MCQ options */}
                {qForm.type === "mcq" && (
                  <div className="space-y-2">
                    <Label>
                      Options{" "}
                      <span className="text-slate-400 font-normal text-xs">
                        — click the circle to mark the correct answer
                      </span>
                    </Label>
                    <div className="space-y-2">
                      {qForm.options.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                          <button
                            type="button"
                            aria-label={`Mark option ${i + 1} as correct`}
                            onClick={() =>
                              setQForm((f) => ({
                                ...f,
                                options: f.options.map((o, j) => ({
                                  ...o,
                                  isCorrect: j === i,
                                })),
                              }))
                            }
                            className={cn(
                              "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
                              opt.isCorrect
                                ? "border-emerald-500 bg-emerald-500"
                                : "border-slate-300 hover:border-slate-400 bg-white"
                            )}
                          >
                            {opt.isCorrect && (
                              <Check className="h-2.5 w-2.5 text-white" />
                            )}
                          </button>
                          <Input
                            placeholder={`Option ${i + 1}`}
                            value={opt.text}
                            onChange={(e) =>
                              setQForm((f) => ({
                                ...f,
                                options: f.options.map((o, j) =>
                                  j === i ? { ...o, text: e.target.value } : o
                                ),
                              }))
                            }
                            className="bg-white"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* True / False */}
                {qForm.type === "true_false" && (
                  <div className="space-y-2">
                    <Label>Correct answer</Label>
                    <RadioGroup
                      value={qForm.options[0]?.isCorrect ? "true" : "false"}
                      onValueChange={(v) =>
                        setQForm((f) => ({
                          ...f,
                          options: [
                            { text: "True", isCorrect: v === "true" },
                            { text: "False", isCorrect: v === "false" },
                          ],
                        }))
                      }
                      className="flex gap-6"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="true" id="tf_true" />
                        <Label htmlFor="tf_true" className="cursor-pointer">True</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="false" id="tf_false" />
                        <Label htmlFor="tf_false" className="cursor-pointer">False</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {/* Written answer */}
                {qForm.type === "text" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="expected">
                      Expected answer{" "}
                      <span className="text-slate-400 font-normal text-xs">
                        — for your reference when grading
                      </span>
                    </Label>
                    <Textarea
                      id="expected"
                      placeholder="Model answer…"
                      value={qForm.correctAnswer}
                      onChange={(e) =>
                        setQForm((f) => ({ ...f, correctAnswer: e.target.value }))
                      }
                      rows={3}
                      className="resize-none bg-white"
                    />
                  </div>
                )}

                {/* Explanation */}
                <div className="space-y-1.5">
                  <Label htmlFor="explanation">
                    Explanation{" "}
                    <span className="text-slate-400 font-normal text-xs">
                      — shown after the test closes (optional)
                    </span>
                  </Label>
                  <Input
                    id="explanation"
                    placeholder="Why is this the correct answer?"
                    value={qForm.explanation}
                    onChange={(e) =>
                      setQForm((f) => ({ ...f, explanation: e.target.value }))
                    }
                    className="bg-white"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <Button onClick={handleAddQuestion} className="flex-1">
                    <Plus className="h-4 w-4 mr-1.5" /> Add question
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowQForm(false);
                      setQForm(DEFAULT_QFORM);
                    }}
                  >
                    Discard
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowQForm(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-dashed border-slate-200 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <Plus className="h-4 w-4" />
              Add question
            </button>
          )}

          {/* Bottom nav */}
          {questions.length > 0 && (
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to details
              </button>
              <Button onClick={() => setStep(3)}>
                Review test
                <ChevronRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 3: Review & Publish ─────────────────────────────────────────── */}
      {step === 3 && test && (
        <div className="space-y-5">
          {/* Summary card */}
          <Card className="shadow-sm overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{test.title}</h2>
                  {test.description && (
                    <p className="text-sm text-muted-foreground mt-1">{test.description}</p>
                  )}
                </div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                  Draft
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: BookOpen, label: "Subject", value: test.subject },
                  { icon: Users, label: "Batch", value: batchName },
                  { icon: Clock, label: "Duration", value: `${test.durationMinutes} min` },
                  {
                    icon: Target,
                    label: "Total marks",
                    value: `${totalMarks} (${questions.length} Qs)`,
                  },
                ].map(({ icon: Icon, label, value }) => (
                  <div
                    key={label}
                    className="flex flex-col gap-1 px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-100"
                  >
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Icon className="h-3.5 w-3.5" />
                      <span className="text-[11px] font-medium uppercase tracking-wide">
                        {label}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800">{value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Question accordion */}
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-slate-700 mb-2">
              Questions ({questions.length})
            </p>
            {questions.map((q, i) => (
              <details
                key={q.id}
                className="group rounded-xl border bg-white overflow-hidden"
              >
                <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer list-none select-none hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-inset">
                  <span className="text-xs font-bold text-slate-400 tabular-nums w-5 shrink-0 text-center">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="flex-1 text-sm text-slate-800 font-medium truncate">
                    {q.text}
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={cn(
                        "hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium border",
                        TYPE_STYLES[q.type]
                      )}
                    >
                      {TYPE_LABELS[q.type]}
                    </span>
                    <span className="text-[11px] font-semibold tabular-nums text-slate-500">
                      {q.marks}m
                    </span>
                    <ChevronDown className="h-4 w-4 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
                  </div>
                </summary>

                <div className="px-4 pb-4 pt-1 border-t border-slate-100 bg-slate-50/60">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border",
                        TYPE_STYLES[q.type]
                      )}
                    >
                      {TYPE_LABELS[q.type]}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border capitalize",
                        DIFFICULTY_STYLES[q.difficulty]
                      )}
                    >
                      {q.difficulty}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border bg-slate-50 text-slate-600 border-slate-200">
                      {q.marks} marks
                    </span>
                  </div>

                  {q.options && q.options.length > 0 && (
                    <div className="space-y-1.5">
                      {q.options.map((o) => (
                        <div
                          key={o.id}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
                            o.isCorrect
                              ? "bg-emerald-50 text-emerald-800 font-medium"
                              : "bg-white text-slate-600 border border-slate-100"
                          )}
                        >
                          {o.isCorrect ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <span className="h-3.5 w-3.5 shrink-0" />
                          )}
                          {o.text}
                        </div>
                      ))}
                    </div>
                  )}

                  {q.correctAnswer && (
                    <div className="mt-2 p-3 rounded-lg bg-white border border-slate-100 text-sm text-slate-700">
                      <span className="text-xs font-medium text-slate-400 block mb-1">
                        Expected answer
                      </span>
                      {q.correctAnswer}
                    </div>
                  )}

                  {q.explanation && (
                    <p className="mt-2 text-xs text-slate-500 italic">
                      Explanation: {q.explanation}
                    </p>
                  )}
                </div>
              </details>
            ))}
          </div>

          <Separator />

          {/* Back + action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors self-center sm:mr-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded"
            >
              <ChevronLeft className="h-4 w-4" />
              Edit questions
            </button>
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={submitting}
              className="flex-1 sm:flex-none sm:min-w-36"
            >
              <FileText className="h-4 w-4 mr-2" />
              Save as draft
            </Button>
            <Button
              onClick={handlePublish}
              disabled={submitting || questions.length === 0}
              className="flex-1 sm:flex-none sm:min-w-36 bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? (
                "Publishing…"
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Publish now
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

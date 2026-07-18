"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, BookMarked } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import PageHeader from "@/components/dashboards/PageHeader";
import EmptyState from "@/components/dashboards/EmptyState";
import { useAppStore } from "@/store/app-store";
import { getBankQuestions, createBankQuestion, deleteBankQuestion } from "@/lib/supabase-service";
import type { BankQuestion, ExamTrack, QuestionType, DifficultyLevel } from "@/lib/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const EXAM_TRACKS: { value: ExamTrack; label: string }[] = [
  { value: "ssc", label: "SSC" },
  { value: "upsc", label: "UPSC" },
  { value: "jee", label: "JEE" },
  { value: "neet", label: "NEET" },
  { value: "cuet", label: "CUET" },
  { value: "general", label: "General" },
];

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "mcq", label: "Multiple Choice" },
  { value: "true_false", label: "True / False" },
  { value: "text", label: "Short Answer" },
];

const DIFFICULTIES: DifficultyLevel[] = ["easy", "medium", "hard"];

const EXAM_TRACK_STYLES: Record<ExamTrack, string> = {
  ssc: "bg-blue-50 text-blue-700 border-blue-200",
  upsc: "bg-purple-50 text-purple-700 border-purple-200",
  jee: "bg-amber-50 text-amber-700 border-amber-200",
  neet: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cuet: "bg-rose-50 text-rose-700 border-rose-200",
  general: "bg-slate-100 text-slate-600 border-slate-200",
};

interface FormState {
  examTrack: ExamTrack;
  topic: string;
  subject: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  marks: string;
  text: string;
  explanation: string;
  correctAnswer: string;
  options: { text: string; isCorrect: boolean }[];
}

const EMPTY_FORM: FormState = {
  examTrack: "general",
  topic: "",
  subject: "",
  type: "mcq",
  difficulty: "medium",
  marks: "1",
  text: "",
  explanation: "",
  correctAnswer: "",
  options: [
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
  ],
};

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function QuestionBankPage() {
  const { activeSession } = useAppStore();
  const teacherId = activeSession?.role === "teacher" ? activeSession.user.id : "";
  const institutionId =
    activeSession?.role === "teacher" ? activeSession.institution.id : "";

  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackFilter, setTrackFilter] = useState<ExamTrack | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  function reload() {
    if (!institutionId) return;
    setLoading(true);
    getBankQuestions(institutionId, { includesPlatformWide: true })
      .then(setQuestions)
      .finally(() => setLoading(false));
  }

  useEffect(reload, [institutionId]);

  const filtered =
    trackFilter === "all" ? questions : questions.filter((q) => q.examTrack === trackFilter);

  function updateOptionText(index: number, text: string) {
    setForm((f) => ({
      ...f,
      options: f.options.map((o, i) => (i === index ? { ...o, text } : o)),
    }));
  }

  function setCorrectOption(index: number) {
    setForm((f) => ({
      ...f,
      options: f.options.map((o, i) => ({ ...o, isCorrect: i === index })),
    }));
  }

  async function handleCreate() {
    if (!form.topic.trim() || !form.subject.trim() || !form.text.trim()) {
      toast.error("Topic, subject, and question text are required.");
      return;
    }
    if (form.type !== "text" && form.options.filter((o) => o.text.trim()).length < 2) {
      toast.error("Add at least two options.");
      return;
    }

    setSaving(true);
    try {
      await createBankQuestion(institutionId, teacherId, {
        examTrack: form.examTrack,
        topic: form.topic.trim(),
        subject: form.subject.trim(),
        type: form.type,
        difficulty: form.difficulty,
        marks: Math.max(1, parseInt(form.marks, 10) || 1),
        text: form.text.trim(),
        explanation: form.explanation.trim() || undefined,
        correctAnswer: form.type === "text" ? form.correctAnswer.trim() || undefined : undefined,
        options: form.type === "text" ? undefined : form.options.filter((o) => o.text.trim()),
      });
      toast.success("Question added to the bank.");
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      reload();
    } catch {
      toast.error("Failed to save the question. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteBankQuestion(id);
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    toast.success("Question removed from the bank.");
  }

  return (
    <div>
      <PageHeader
        title="Question Bank"
        subtitle="Reusable, tagged questions your future tests and quizzes can draw from."
      >
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Question
        </Button>
      </PageHeader>

      {/* Filter row */}
      <div className="flex items-center gap-3 mb-4">
        <Label className="text-xs text-muted-foreground shrink-0">Exam track</Label>
        <Select value={trackFilter} onValueChange={(v) => setTrackFilter(v as ExamTrack | "all")}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tracks</SelectItem>
            {EXAM_TRACKS.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookMarked}
          title="No questions yet"
          description="Add your first reusable question — daily quizzes and battles will draw from this bank."
          action={{ label: "Add Question", onClick: () => setDialogOpen(true) }}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => (
            <Card key={q.id}>
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <Badge variant="outline" className={EXAM_TRACK_STYLES[q.examTrack]}>
                      {q.examTrack.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{q.subject}</span>
                    <span className="text-xs text-muted-foreground">&middot; {q.topic}</span>
                    {!q.institutionId && (
                      <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">
                        Platform-wide
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-800 truncate">{q.text}</p>
                  <p className="text-xs text-muted-foreground mt-1 capitalize">
                    {q.type.replace("_", " ")} &middot; {q.difficulty} &middot; {q.marks} mark
                    {q.marks === 1 ? "" : "s"}
                  </p>
                </div>
                {q.institutionId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(q.id)}
                    aria-label="Delete question"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add question dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Question to Bank</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Exam Track</Label>
                <Select
                  value={form.examTrack}
                  onValueChange={(v) => setForm((f) => ({ ...f, examTrack: v as ExamTrack }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXAM_TRACKS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Difficulty</Label>
                <Select
                  value={form.difficulty}
                  onValueChange={(v) => setForm((f) => ({ ...f, difficulty: v as DifficultyLevel }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map((d) => (
                      <SelectItem key={d} value={d} className="capitalize">
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Input
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  placeholder="e.g. Polity"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Topic</Label>
                <Input
                  value={form.topic}
                  onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                  placeholder="e.g. current-affairs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Question Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    type: v as QuestionType,
                    options:
                      v === "true_false"
                        ? [
                            { text: "True", isCorrect: true },
                            { text: "False", isCorrect: false },
                          ]
                        : f.options,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Question Text</Label>
              <Textarea
                value={form.text}
                onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
                rows={3}
                placeholder="Which article of the Constitution deals with..."
              />
            </div>

            {form.type === "mcq" && (
              <div className="space-y-2">
                <Label>Options (select the correct one)</Label>
                <RadioGroup
                  value={String(form.options.findIndex((o) => o.isCorrect))}
                  onValueChange={(v) => setCorrectOption(parseInt(v, 10))}
                  className="space-y-2"
                >
                  {form.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <RadioGroupItem value={String(i)} id={`opt-${i}`} />
                      <Input
                        value={opt.text}
                        onChange={(e) => updateOptionText(i, e.target.value)}
                        placeholder={`Option ${i + 1}`}
                      />
                    </div>
                  ))}
                </RadioGroup>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setForm((f) => ({ ...f, options: [...f.options, { text: "", isCorrect: false }] }))
                  }
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add option
                </Button>
              </div>
            )}

            {form.type === "true_false" && (
              <div className="space-y-1.5">
                <Label>Correct Answer</Label>
                <RadioGroup
                  value={String(form.options.findIndex((o) => o.isCorrect))}
                  onValueChange={(v) => setCorrectOption(parseInt(v, 10))}
                  className="flex gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="0" id="tf-true" />
                    <Label htmlFor="tf-true">True</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="1" id="tf-false" />
                    <Label htmlFor="tf-false">False</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {form.type === "text" && (
              <div className="space-y-1.5">
                <Label>Expected Answer (for reference)</Label>
                <Input
                  value={form.correctAnswer}
                  onChange={(e) => setForm((f) => ({ ...f, correctAnswer: e.target.value }))}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Marks</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.marks}
                  onChange={(e) => setForm((f) => ({ ...f, marks: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Explanation (optional)</Label>
              <Textarea
                value={form.explanation}
                onChange={(e) => setForm((f) => ({ ...f, explanation: e.target.value }))}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? "Saving…" : "Add to Bank"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

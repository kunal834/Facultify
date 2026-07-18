"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, RefreshCw, Send, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/store/app-store";
import { generateAITest, getBatches, publishTest } from "@/lib/supabase-service";
import type { AIGeneratorConfig, MockTest, QuestionType, DifficultyLevel, Batch } from "@/lib/types";

type GenState = "idle" | "generating" | "done";

const LOADING_MESSAGES = [
  "Analyzing topic...",
  "Generating questions...",
  "Validating answers...",
  "Finalizing test...",
];

const DIFF_COLOR: Record<DifficultyLevel, string> = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  hard: "bg-red-100 text-red-700",
};

const TYPE_COLOR: Record<QuestionType, string> = {
  mcq: "bg-blue-100 text-blue-700",
  text: "bg-purple-100 text-purple-700",
  true_false: "bg-orange-100 text-orange-700",
};

export default function AIGeneratorPage() {
  const router = useRouter();
  const { activeSession } = useAppStore();
  const teacher = activeSession?.role === "teacher" ? activeSession.user : null;
  const teacherId = teacher?.id ?? "";
  const institutionId = teacher?.institutionId ?? "";

  const [batches, setBatches] = useState<Batch[]>([]);
  const [genState, setGenState] = useState<GenState>("idle");
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [generatedTest, setGeneratedTest] = useState<MockTest | null>(null);
  const msgIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [config, setConfig] = useState<AIGeneratorConfig>({
    topic: "",
    subject: "",
    difficulty: "medium",
    numQuestions: 8,
    questionTypes: ["mcq"],
    marksPerQuestion: 5,
    includeExplanations: true,
    gradeLevel: "Grade 11",
  });
  const [batchId, setBatchId] = useState("");

  useEffect(() => {
    getBatches(teacherId).then((b) => {
      setBatches(b);
      if (b[0]) setBatchId(b[0].id);
    });
    return () => { if (msgIntervalRef.current) clearInterval(msgIntervalRef.current); };
  }, [teacherId]);

  function toggleQType(type: QuestionType) {
    setConfig((c) => ({
      ...c,
      questionTypes: c.questionTypes.includes(type)
        ? c.questionTypes.filter((t) => t !== type)
        : [...c.questionTypes, type],
    }));
  }

  async function handleGenerate() {
    if (!config.topic || !config.subject || !batchId) {
      toast.error("Please fill in topic, subject, and select a batch.");
      return;
    }
    setGenState("generating");
    setLoadingMsg(LOADING_MESSAGES[0]);
    let msgIdx = 0;
    msgIntervalRef.current = setInterval(() => {
      msgIdx = (msgIdx + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[msgIdx]);
    }, 600);

    try {
      const activeBatch = batches.find((b) => b.id === batchId);
      const updatedConfig = {
        ...config,
        examTrack: activeBatch?.examTrack ?? "general",
      };
      const test = await generateAITest(updatedConfig, teacherId, institutionId, batchId);
      clearInterval(msgIntervalRef.current!);
      setGeneratedTest(test);
      setGenState("done");
      toast.success(`Generated "${test.title}" with ${test.questions.length} questions!`);
    } catch {
      clearInterval(msgIntervalRef.current!);
      setGenState("idle");
      toast.error("Generation failed. Please try again.");
    }
  }

  async function handlePublish() {
    if (!generatedTest) return;
    await publishTest(generatedTest.id);
    toast.success("Test published successfully!");
    router.push("/teacher/tests");
  }

  function handleSaveDraft() {
    toast.success("Test saved as draft.");
    router.push("/teacher/tests");
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <div className="h-9 w-9 rounded-xl bg-purple-600 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">AI Test Generator</h1>
          <p className="text-sm text-muted-foreground">Generate a complete test in seconds using AI</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Config Panel */}
        <Card className="h-fit">
          <CardHeader><CardTitle className="text-base font-semibold">Configure Your Test</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label>Topic / Prompt *</Label>
              <Textarea
                placeholder="e.g. Derivatives and limits with real-world applications and word problems"
                value={config.topic}
                onChange={(e) => setConfig((c) => ({ ...c, topic: e.target.value }))}
                className="resize-none"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Subject *</Label>
                <Input placeholder="Mathematics" value={config.subject} onChange={(e) => setConfig((c) => ({ ...c, subject: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Grade Level</Label>
                <Select value={config.gradeLevel} onValueChange={(v) => setConfig((c) => ({ ...c, gradeLevel: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Grade 9", "Grade 10", "Grade 11", "Grade 12", "Undergraduate"].map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Target Batch</Label>
              <Select value={batchId} onValueChange={setBatchId}>
                <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
                <SelectContent>{batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Difficulty</Label>
              <RadioGroup value={config.difficulty} onValueChange={(v) => setConfig((c) => ({ ...c, difficulty: v as DifficultyLevel }))} className="flex gap-4">
                {(["easy", "medium", "hard"] as DifficultyLevel[]).map((d) => (
                  <div key={d} className="flex items-center space-x-2">
                    <RadioGroupItem value={d} id={`diff_${d}`} />
                    <Label htmlFor={`diff_${d}`} className="capitalize cursor-pointer">{d}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Number of Questions: <span className="font-bold text-blue-600">{config.numQuestions}</span></Label>
              <Slider
                min={5} max={20} step={1} value={[config.numQuestions]}
                onValueChange={(v) => setConfig((c) => ({ ...c, numQuestions: v[0] }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground"><span>5</span><span>20</span></div>
            </div>

            <div className="space-y-1.5">
              <Label>Marks Per Question</Label>
              <Input
                type="number"
                min={2}
                max={10}
                value={config.marksPerQuestion}
                onChange={(e) => setConfig((c) => ({ ...c, marksPerQuestion: Math.min(10, Math.max(2, parseInt(e.target.value) || 2)) }))}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">Between 2 and 10 marks</p>
            </div>

            <div className="space-y-2">
              <Label>Question Types</Label>
              <div className="flex gap-4">
                {(["mcq", "text", "true_false"] as QuestionType[]).map((t) => (
                  <div key={t} className="flex items-center gap-2">
                    <Checkbox
                      id={`qt_${t}`}
                      checked={config.questionTypes.includes(t)}
                      onCheckedChange={() => toggleQType(t)}
                    />
                    <Label htmlFor={`qt_${t}`} className="capitalize cursor-pointer text-sm">
                      {t === "true_false" ? "True/False" : t.toUpperCase()}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Include Explanations</Label>
                <p className="text-xs text-muted-foreground">Show explanations after test closes</p>
              </div>
              <Switch checked={config.includeExplanations} onCheckedChange={(v) => setConfig((c) => ({ ...c, includeExplanations: v }))} />
            </div>

            <Separator />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Estimated total marks: <strong className="text-foreground">{config.numQuestions * config.marksPerQuestion}</strong></span>
            </div>

            <Button
              className="w-full bg-purple-600 hover:bg-purple-700"
              onClick={handleGenerate}
              disabled={genState === "generating"}
            >
              {genState === "generating" ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" /> Generate Test</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* RIGHT: Preview Panel */}
        <div>
          {genState === "idle" && (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 min-h-[500px]">
              <div className="h-16 w-16 rounded-2xl bg-purple-100 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-bold text-lg text-slate-800 mb-2">Configure and Generate</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Fill in the configuration panel on the left and click &ldquo;Generate Test&rdquo; to create your AI-powered test.
              </p>
            </div>
          )}

          {genState === "generating" && (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center rounded-xl border-2 border-purple-200 bg-purple-50 min-h-[500px]">
              <div className="h-16 w-16 rounded-2xl bg-purple-600 flex items-center justify-center mb-6 animate-pulse">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <div className="flex items-center gap-2 mb-4">
                <Loader2 className="h-5 w-5 text-purple-600 animate-spin" />
                <span className="font-semibold text-purple-800 text-lg">{loadingMsg}</span>
              </div>
              <p className="text-sm text-purple-600">This usually takes 2-4 seconds</p>
              <div className="mt-6 flex gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-1.5 w-6 rounded-full bg-purple-300 animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          )}

          {genState === "done" && generatedTest && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-lg">{generatedTest.title}</h2>
                  <p className="text-sm text-muted-foreground">{generatedTest.questions.length} questions · {generatedTest.totalMarks} total marks</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleGenerate}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Regenerate
                </Button>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {generatedTest.questions.map((q, i) => (
                  <Card key={q.id} className="border-l-4 border-l-purple-500">
                    <CardContent className="py-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-muted-foreground">Q{i + 1}</span>
                        <Badge className={TYPE_COLOR[q.type]}>{q.type === "true_false" ? "True/False" : q.type.toUpperCase()}</Badge>
                        <Badge className={DIFF_COLOR[q.difficulty]}>{q.difficulty}</Badge>
                        <Badge variant="outline" className="text-xs">{q.marks} marks</Badge>
                      </div>
                      <p className="text-sm font-medium">{q.text}</p>
                      {q.options && (
                        <div className="mt-2 space-y-1">
                          {q.options.map((o) => (
                            <div key={o.id} className={`flex items-center gap-2 text-xs px-2 py-1 rounded ${o.isCorrect ? "bg-green-50 text-green-700 font-medium" : "text-slate-600"}`}>
                              <span className={`h-3 w-3 rounded-full border ${o.isCorrect ? "bg-green-500 border-green-500" : "border-slate-300"}`} />
                              {o.text}
                            </div>
                          ))}
                        </div>
                      )}
                      {q.explanation && (
                        <p className="mt-2 text-xs text-muted-foreground italic">💡 {q.explanation}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex gap-3 flex-wrap">
                <Button variant="outline" className="flex-1 min-w-[120px]" onClick={handleSaveDraft}>
                  <FileText className="h-4 w-4 mr-2" /> Save as Draft
                </Button>
                <Button className="flex-1 min-w-[120px] bg-purple-600 hover:bg-purple-700" onClick={handlePublish}>
                  <Send className="h-4 w-4 mr-2" /> Publish Directly
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleGenerate}>
                  <RefreshCw className="h-4 w-4 mr-1.5" /> Regenerate
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

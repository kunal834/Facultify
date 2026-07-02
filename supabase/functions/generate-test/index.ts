import { createClient } from "jsr:@supabase/supabase-js@2";

// ─── Types (mirrored from lib/types.ts — Deno can't import Next.js modules) ───

type QuestionType    = "mcq" | "text" | "true_false";
type DifficultyLevel = "easy" | "medium" | "hard";

interface AIGeneratorConfig {
  topic:               string;
  subject:             string;
  difficulty:          DifficultyLevel;
  numQuestions:        number;
  questionTypes:       QuestionType[];
  marksPerQuestion:    number;
  includeExplanations: boolean;
  gradeLevel:          string;
}

// Shape Claude must return for each question
interface RawQuestion {
  type:          QuestionType;
  text:          string;
  difficulty:    DifficultyLevel;
  explanation?:  string;
  options?:      { text: string; isCorrect: boolean }[];  // mcq / true_false
  correctAnswer?: string;                                  // text type
}

// ─── Claude prompt builder ────────────────────────────────────────────────────

function buildPrompt(config: AIGeneratorConfig): string {
  const typeList = config.questionTypes.join(", ");
  const withExp  = config.includeExplanations
    ? "Include a concise explanation (1-2 sentences) for each question in the 'explanation' field."
    : "Omit explanations — set 'explanation' to null.";

  return `You are an expert educator creating a test for ${config.gradeLevel} students.

Topic: ${config.topic}
Subject: ${config.subject}
Difficulty: ${config.difficulty}
Number of questions: ${config.numQuestions}
Question types to use (mix them): ${typeList}
${withExp}

Return ONLY a valid JSON array of ${config.numQuestions} question objects. No prose, no markdown fences — just the raw JSON array.

Each object must follow this schema exactly:
- "type": one of "mcq", "true_false", "text"
- "text": the question text (string)
- "difficulty": "${config.difficulty}" (keep consistent)
- "explanation": string or null

For type "mcq":
  - "options": array of exactly 4 objects with "text" (string) and "isCorrect" (boolean)
  - Exactly one option must have isCorrect: true
  - Do NOT include "correctAnswer"

For type "true_false":
  - "options": array of exactly 2 objects: {"text":"True","isCorrect":<bool>} and {"text":"False","isCorrect":<bool>}
  - Exactly one must be correct
  - Do NOT include "correctAnswer"

For type "text":
  - "correctAnswer": the expected answer or key points (string, max 150 chars)
  - Do NOT include "options"

Make the questions genuinely educational, accurate, and appropriate for the difficulty level.`;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin":  "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { config, teacherId, institutionId, batchId } = await req.json() as {
      config:        AIGeneratorConfig;
      teacherId:     string;
      institutionId: string;
      batchId:       string;
    };

    if (!config?.topic || !config?.subject || !teacherId || !institutionId || !batchId) {
      return jsonError("Missing required fields", 400);
    }

    if (!config.questionTypes?.length) {
      return jsonError("Select at least one question type", 400);
    }

    // ── 1. Call AI via OpenRouter ─────────────────────────────────────────────

    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) return jsonError("OPENROUTER_API_KEY not configured", 500);

    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method:  "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type":  "application/json",
        "HTTP-Referer":  "https://facultify.app",
        "X-Title":       "Facultify AI Test Generator",
      },
      body: JSON.stringify({
        model:      "google/gemini-2.5-flash",
        max_tokens: 4096,
        messages:   [{ role: "user", content: buildPrompt(config) }],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("OpenRouter API error:", errText);
      return jsonError("AI generation failed — OpenRouter API error", 502);
    }

    const aiJson = await aiRes.json();
    // OpenRouter returns OpenAI-compatible format: choices[0].message.content
    const rawText: string = aiJson.choices?.[0]?.message?.content ?? "";

    // Strip optional markdown fences if the model wraps the JSON anyway
    const jsonText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

    let rawQuestions: RawQuestion[];
    try {
      rawQuestions = JSON.parse(jsonText);
      if (!Array.isArray(rawQuestions)) throw new Error("Not an array");
    } catch {
      console.error("Failed to parse AI response:", jsonText.slice(0, 500));
      return jsonError("AI returned an unparseable response. Try regenerating.", 502);
    }

    // ── 2. Write to Supabase using the service-role client (bypasses RLS) ─────

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Estimate duration: 2 min per MCQ/T-F, 5 min per written question
    const durationMinutes = rawQuestions.reduce((acc, q) => {
      return acc + (q.type === "text" ? 5 : 2);
    }, 0);

    const totalMarks = rawQuestions.length * config.marksPerQuestion;

    // Generate a clean title from the topic (first sentence or first 60 chars)
    const topicSentence = config.topic.split(/[.!?]/)[0].trim();
    const title = topicSentence.length > 60
      ? topicSentence.slice(0, 57) + "…"
      : topicSentence;

    // Insert test row
    const { data: testRow, error: testErr } = await supabase
      .from("tests")
      .insert({
        teacher_id:       teacherId,
        institution_id:   institutionId,
        batch_id:         batchId,
        title,
        description:      `AI-generated test on: ${config.topic}`,
        subject:          config.subject,
        status:           "draft",
        total_marks:      totalMarks,
        duration_minutes: durationMinutes,
        ai_generated:     true,
      })
      .select("id, created_at")
      .single();

    if (testErr || !testRow) {
      console.error("Test insert error:", testErr);
      return jsonError("Failed to save test to database", 500);
    }

    const testId = testRow.id as string;

    // Insert questions + options sequentially to keep order deterministic
    const savedQuestions = [];

    for (let i = 0; i < rawQuestions.length; i++) {
      const q = rawQuestions[i];

      const { data: qRow, error: qErr } = await supabase
        .from("questions")
        .insert({
          test_id:        testId,
          order:          i + 1,
          type:           q.type,
          text:           q.text,
          marks:          config.marksPerQuestion,
          difficulty:     q.difficulty ?? config.difficulty,
          correct_answer: q.type === "text" ? (q.correctAnswer ?? null) : null,
          explanation:    q.explanation ?? null,
          ai_generated:   true,
        })
        .select("id")
        .single();

      if (qErr || !qRow) {
        console.error(`Question ${i + 1} insert error:`, qErr);
        continue;
      }

      const questionId = qRow.id as string;
      const savedOptions: { id: string; text: string; isCorrect: boolean }[] = [];

      if (q.options?.length) {
        const optRows = q.options.map((o) => ({
          question_id: questionId,
          text:        o.text,
          is_correct:  o.isCorrect,
        }));

        const { data: insertedOpts, error: optErr } = await supabase
          .from("question_options")
          .insert(optRows)
          .select("id, text, is_correct");

        if (optErr) {
          console.error(`Options for Q${i + 1} insert error:`, optErr);
        } else {
          for (const o of insertedOpts ?? []) {
            savedOptions.push({
              id:        o.id as string,
              text:      o.text as string,
              isCorrect: o.is_correct as boolean,
            });
          }
        }
      }

      savedQuestions.push({
        id:            questionId,
        testId,
        order:         i + 1,
        type:          q.type,
        text:          q.text,
        marks:         config.marksPerQuestion,
        difficulty:    q.difficulty ?? config.difficulty,
        explanation:   q.explanation ?? undefined,
        correctAnswer: q.type === "text" ? (q.correctAnswer ?? undefined) : undefined,
        options:       savedOptions.length ? savedOptions : undefined,
        aiGenerated:   true,
      });
    }

    // ── 3. Return MockTest payload ─────────────────────────────────────────────

    const mockTest = {
      id:              testId,
      teacherId,
      institutionId,
      batchId,
      title,
      description:     `AI-generated test on: ${config.topic}`,
      subject:         config.subject,
      status:          "draft",
      totalMarks,
      durationMinutes,
      createdAt:       testRow.created_at,
      questions:       savedQuestions,
      aiGenerated:     true,
      attemptCount:    0,
      avgScore:        0,
    };

    return new Response(JSON.stringify(mockTest), {
      headers: {
        "Content-Type":                 "application/json",
        "Access-Control-Allow-Origin":  "*",
      },
    });

  } catch (err) {
    console.error("Unhandled error:", err);
    return jsonError("Internal server error", 500);
  }
});

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Content-Type":                "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

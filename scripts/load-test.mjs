// 100-concurrent-user load test for Facultify's backend surface.
//
// Uses Playwright's standalone `request` API (raw HTTP, no browser) to fire
// concurrent traffic at the real Supabase REST/Auth endpoints exactly as the
// browser-side lib/supabase-service.ts does, plus Playwright's `chromium` for
// the two same-origin Next.js API routes that rely on session cookies.
//
// Prerequisites: `node scripts/seed-loadtest.mjs` has been run, and the app
// is running in production mode at APP_URL (default http://localhost:3000).
//
// Run with: node scripts/load-test.mjs

import { chromium, request } from "@playwright/test";
import { readFileSync, writeFileSync } from "fs";

const ENV_PATH = "./.env.local";
const envText = readFileSync(ENV_PATH, "utf8");
const env = Object.fromEntries(
  envText
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const APP_URL = process.env.APP_URL || "http://localhost:3000";

const fixtures = JSON.parse(readFileSync("./scripts/loadtest-fixtures.json", "utf8"));

// ─── Metrics helpers ───────────────────────────────────────────────────────────

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
}

async function timeCall(fn) {
  const start = performance.now();
  try {
    const ok = await fn();
    return { ms: performance.now() - start, ok: ok !== false, error: null };
  } catch (err) {
    return { ms: performance.now() - start, ok: false, error: String(err?.message ?? err) };
  }
}

async function runLoad(name, concurrency, taskFactory, tier) {
  process.stdout.write(`Running: ${name} (concurrency ${concurrency})... `);
  const wallStart = performance.now();
  const results = await Promise.all(
    Array.from({ length: concurrency }, (_, i) => timeCall(() => taskFactory(i)))
  );
  const wallMs = performance.now() - wallStart;
  const durations = results.map((r) => r.ms).sort((a, b) => a - b);
  const errors = results.filter((r) => !r.ok);
  const stat = {
    name,
    tier,
    concurrency,
    successCount: concurrency - errors.length,
    errorCount: errors.length,
    errorRatePct: +((errors.length / concurrency) * 100).toFixed(2),
    minMs: +durations[0].toFixed(1),
    maxMs: +durations[durations.length - 1].toFixed(1),
    avgMs: +(durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1),
    p50Ms: +percentile(durations, 50).toFixed(1),
    p95Ms: +percentile(durations, 95).toFixed(1),
    p99Ms: +percentile(durations, 99).toFixed(1),
    throughputRps: +(concurrency / (wallMs / 1000)).toFixed(2),
    wallMs: +wallMs.toFixed(1),
    sampleErrors: [...new Set(errors.map((e) => e.error))].slice(0, 3),
  };
  console.log(`p50 ${stat.p50Ms}ms  p95 ${stat.p95Ms}ms  errors ${stat.errorCount}/${concurrency}`);
  return stat;
}

// ─── Supabase REST helpers (mirrors lib/supabase-service.ts) ──────────────────

function authHeaders(token) {
  return { apikey: ANON_KEY, Authorization: `Bearer ${token}` };
}

async function login(ctx, email, password) {
  const res = await ctx.post(`/auth/v1/token?grant_type=password`, {
    headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
    data: { email, password },
  });
  if (!res.ok()) throw new Error(`login failed for ${email}: ${res.status()} ${await res.text()}`);
  const body = await res.json();
  return body.access_token;
}

const QUESTION_SELECT =
  'id,test_id,"order",type,text,marks,difficulty,correct_answer,explanation,time_limit,ai_generated,question_options(id,text,is_correct)';
const TEST_SELECT = `*,questions(${QUESTION_SELECT})`;

async function main() {
  const results = [];
  const excluded = [];

  const rest = await request.newContext({ baseURL: SUPABASE_URL });
  _rest = rest;

  console.log("Logging in fixture accounts...");
  const teacherToken = await login(rest, fixtures.teacher.email, fixtures.password);
  const studentTokens = [];
  for (const s of fixtures.students) {
    studentTokens.push(await login(rest, s.email, fixtures.password));
  }
  console.log(`Logged in teacher + ${studentTokens.length} students.\n`);

  const primaryTestId = fixtures.tests[0].id;

  // ── 1. Auth: password login (100 concurrent) ─────────────────────────────
  results.push(
    await runLoad(
      "Auth login (POST /auth/v1/token)",
      100,
      (i) => {
        const acct = i % 3 === 0 ? fixtures.teacher : fixtures.students[i % fixtures.students.length];
        return rest
          .post(`/auth/v1/token?grant_type=password`, {
            headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
            data: { email: acct.email, password: fixtures.password },
          })
          .then((r) => r.ok());
      },
      "auth"
    )
  );

  // ── 2. Reads at full 100 concurrency ──────────────────────────────────────
  results.push(
    await runLoad(
      "getTests — teacher's test list",
      100,
      () =>
        rest
          .get(`/rest/v1/tests`, {
            headers: authHeaders(teacherToken),
            params: { teacher_id: `eq.${fixtures.teacher.id}`, select: TEST_SELECT, order: "created_at.desc" },
          })
          .then((r) => r.ok()),
      "read"
    )
  );

  results.push(
    await runLoad(
      "getStudentTests — student's visible tests",
      100,
      (i) => {
        const token = studentTokens[i % studentTokens.length];
        return rest
          .get(`/rest/v1/tests`, {
            headers: authHeaders(token),
            params: { batch_id: `eq.${fixtures.batchId}`, status: "neq.draft", select: TEST_SELECT, order: "created_at.desc" },
          })
          .then((r) => r.ok());
      },
      "read"
    )
  );

  results.push(
    await runLoad(
      "getBatches — teacher's batch list",
      100,
      () =>
        rest
          .get(`/rest/v1/batches`, {
            headers: authHeaders(teacherToken),
            params: { teacher_id: `eq.${fixtures.teacher.id}`, order: "created_at.desc" },
          })
          .then((r) => r.ok()),
      "read"
    )
  );

  results.push(
    await runLoad(
      "getStudents — teacher's roster",
      100,
      () =>
        rest
          .get(`/rest/v1/students`, {
            headers: authHeaders(teacherToken),
            params: { teacher_id: `eq.${fixtures.teacher.id}`, order: "enrolled_at.desc" },
          })
          .then((r) => r.ok()),
      "read"
    )
  );

  results.push(
    await runLoad(
      "getTeacherAnalytics — dashboard composite (baseline, no submissions yet)",
      100,
      () => teacherAnalyticsFlow(teacherToken),
      "read-composite"
    )
  );

  results.push(
    await runLoad(
      "getStudentAnalytics — dashboard composite (baseline)",
      100,
      (i) => studentAnalyticsFlow(studentTokens[i % studentTokens.length], fixtures.students[i % fixtures.students.length].id),
      "read-composite"
    )
  );

  // ── 3. Writes — bounded to the 20-student synthetic pool to avoid unique-
  //      constraint collisions and unrealistic row counts ───────────────────
  const startResults = await runLoadCollect(
    "startTest — student begins the seeded quiz",
    fixtures.students.length,
    (i) => startTestFlow(studentTokens[i], primaryTestId, fixtures.students[i].id),
    "write"
  );
  results.push(startResults.stat);

  results.push(
    await runLoad(
      "submitTest — student submits answers (auto-graded)",
      fixtures.students.length,
      (i) => submitTestFlow(studentTokens[i], startResults.data[i]?.submissionId, primaryTestId),
      "write"
    )
  );

  results.push(
    await runLoad(
      "addStudent — teacher enrolls a new student",
      20,
      (i) =>
        rest
          .post(`/rest/v1/students`, {
            headers: { ...authHeaders(teacherToken), Prefer: "return=minimal" },
            data: {
              institution_id: fixtures.institutionId,
              teacher_id: fixtures.teacher.id,
              batch_id: fixtures.batchId,
              name: `Load Test Extra ${i}`,
              email: `loadtest.extra${String(i).padStart(3, "0")}@facultify.test`,
              roll_number: `LT-EXTRA-${i}`,
              is_active: true,
            },
          })
          .then((r) => r.ok()),
      "write"
    )
  );

  const createdTestIds = [];
  results.push(
    await runLoad(
      "createTest — teacher creates a draft test",
      15,
      async (i) => {
        const res = await rest.post(`/rest/v1/tests`, {
          headers: { ...authHeaders(teacherToken), Prefer: "return=representation" },
          data: {
            teacher_id: fixtures.teacher.id,
            institution_id: fixtures.institutionId,
            batch_id: fixtures.batchId,
            title: `Load Test Extra ${i}`,
            description: "",
            subject: "Load Test",
            status: "draft",
            total_marks: 0,
            duration_minutes: 20,
          },
        });
        if (res.ok()) {
          const body = await res.json();
          createdTestIds.push(body[0]?.id);
        }
        return res.ok();
      },
      "write"
    )
  );

  results.push(
    await runLoad(
      "publishTest — teacher publishes a draft test",
      createdTestIds.length || 1,
      (i) =>
        rest
          .patch(`/rest/v1/tests`, {
            headers: { ...authHeaders(teacherToken), Prefer: "return=minimal" },
            params: { id: `eq.${createdTestIds[i] ?? primaryTestId}` },
            data: { status: "published" },
          })
          .then((r) => r.ok()),
      "write"
    )
  );

  // ── 4. Reads again, now backed by real submission data ────────────────────
  results.push(
    await runLoad(
      "getSubmissions — teacher views quiz submissions",
      100,
      () =>
        rest
          .get(`/rest/v1/submissions`, {
            headers: authHeaders(teacherToken),
            params: { test_id: `eq.${primaryTestId}`, select: "*,submission_answers(*)", order: "submitted_at.desc" },
          })
          .then((r) => r.ok()),
      "read"
    )
  );

  results.push(
    await runLoad(
      "getTeacherAnalytics — dashboard composite (post-submissions)",
      100,
      () => teacherAnalyticsFlow(teacherToken),
      "read-composite"
    )
  );

  results.push(
    await runLoad(
      "getStudentAnalytics — dashboard composite (post-submission)",
      fixtures.students.length,
      (i) => studentAnalyticsFlow(studentTokens[i], fixtures.students[i].id),
      "read-composite"
    )
  );

  await rest.dispose();

  // ── 5. Next.js API route — /api/auth/finalize (cookie-session, idempotent) ─
  console.log("\nLaunching headless browser to obtain a real session cookie...");
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ baseURL: APP_URL });
  const page = await ctx.newPage();
  await page.goto("/auth/login");
  await page.locator("#email-pw").fill(fixtures.teacher.email);
  await page.locator("#password").fill(fixtures.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/teacher/, { timeout: 15000 }).catch(() => {});

  results.push(
    await runLoad(
      "Next.js API: POST /api/auth/finalize",
      100,
      () => ctx.request.post("/api/auth/finalize").then((r) => r.ok()),
      "nextjs-api"
    )
  );
  await browser.close();

  excluded.push({
    endpoint: "getAdminAnalytics / getInvoices (admin-tier)",
    reason:
      "Would require a synthetic profile with role=admin on the real institution, granting read access to real teacher/student/invoice data. Skipped to keep the load test fully isolated from production data — recommend testing against a dedicated sandbox Supabase project.",
  });
  excluded.push({
    endpoint: "POST /api/invite and /api/invite-student",
    reason:
      "Both send a real transactional email via Resend on every call. Not safe to fire at load-test concurrency (100) without a sandboxed Resend key. Skipped entirely rather than risk real email traffic.",
  });

  const report = {
    generatedAt: new Date().toISOString(),
    target: APP_URL,
    supabaseProject: SUPABASE_URL,
    concurrencyModel:
      "100 virtual users for auth + read + Next.js-route endpoints; write endpoints bounded to the 15-20 synthetic accounts created for this test to avoid unique-constraint collisions and unbounded row growth.",
    results,
    excluded,
  };
  writeFileSync("./scripts/load-test-results.json", JSON.stringify(report, null, 2));
  console.log("\nResults written to scripts/load-test-results.json");
}

async function teacherAnalyticsFlow(token) {
  const [studentsRes, testsRes] = await Promise.all([
    rest_get("/rest/v1/students", token, { teacher_id: `eq.${fixtures.teacher.id}`, select: "id" }),
    rest_get("/rest/v1/tests", token, { teacher_id: `eq.${fixtures.teacher.id}`, select: "id,title,created_at,avg_score" }),
  ]);
  const tests = testsRes.ok() ? await testsRes.json() : [];
  const testIds = tests.map((t) => t.id);
  const subsRes = await rest_get("/rest/v1/submissions", token, {
    test_id: `in.(${testIds.join(",") || "00000000-0000-0000-0000-000000000000"})`,
    select: "id,status,percentage",
  });
  const topRes = await rest_get("/rest/v1/submissions", token, {
    test_id: `in.(${testIds.join(",") || "00000000-0000-0000-0000-000000000000"})`,
    status: "eq.graded",
    select: "student_id,percentage,students!inner(name)",
    order: "percentage.desc",
    limit: "1",
  });
  return studentsRes.ok() && testsRes.ok() && subsRes.ok() && topRes.ok();
}

async function studentAnalyticsFlow(token, studentId) {
  const res = await rest_get("/rest/v1/submissions", token, {
    student_id: `eq.${studentId}`,
    status: "in.(submitted,graded)",
    select: "total_score,max_score,percentage,submitted_at,time_taken_minutes,status,tests!inner(title,subject,result_delay_minutes,results_declared)",
    order: "submitted_at.desc",
    limit: "50",
  });
  return res.ok();
}

async function rest_get(path, token, params) {
  return request0().get(path, { headers: authHeaders(token), params });
}

let _rest;
function request0() {
  return _rest;
}

async function startTestFlow(token, testId, studentId) {
  const existing = await request0().get("/rest/v1/submissions", {
    headers: authHeaders(token),
    params: { test_id: `eq.${testId}`, student_id: `eq.${studentId}`, select: "id" },
  });
  const existingBody = existing.ok() ? await existing.json() : [];
  if (existingBody.length) return { submissionId: existingBody[0].id };

  const studentRes = await request0().get("/rest/v1/students", {
    headers: authHeaders(token),
    params: { id: `eq.${studentId}`, select: "name" },
  });
  const testRes = await request0().get("/rest/v1/tests", {
    headers: authHeaders(token),
    params: { id: `eq.${testId}`, select: "total_marks" },
  });
  const student = studentRes.ok() ? (await studentRes.json())[0] : null;
  const test = testRes.ok() ? (await testRes.json())[0] : null;

  const insertRes = await request0().post("/rest/v1/submissions", {
    headers: { ...authHeaders(token), Prefer: "return=representation" },
    data: {
      test_id: testId,
      student_id: studentId,
      student_name: student?.name ?? "Unknown",
      status: "in_progress",
      started_at: new Date().toISOString(),
      max_score: test?.total_marks ?? 0,
    },
  });
  if (!insertRes.ok()) return false;
  const body = await insertRes.json();
  return { submissionId: body[0]?.id };
}

async function submitTestFlow(token, submissionId, testId) {
  if (!submissionId) return false;
  const subRes = await request0().get("/rest/v1/submissions", {
    headers: authHeaders(token),
    params: {
      id: `eq.${submissionId}`,
      select: "id,test_id,status,max_score,tests!inner(total_marks,questions(id,type,marks,question_options(id,is_correct)))",
    },
  });
  if (!subRes.ok()) return false;
  const [sub] = await subRes.json();
  if (!sub) return false;
  const questions = sub.tests?.questions ?? [];

  const answerRows = questions.map((q) => {
    const opts = q.question_options ?? [];
    const chosen = opts[0];
    const isCorrect = chosen?.is_correct ?? false;
    return {
      submission_id: submissionId,
      question_id: q.id,
      selected_option_id: chosen?.id ?? null,
      is_correct: isCorrect,
      marks_awarded: isCorrect ? q.marks : 0,
      time_spent_seconds: 30,
    };
  });
  const autoScore = answerRows.reduce((a, r) => a + (r.marks_awarded ?? 0), 0);

  if (answerRows.length) {
    const upsertRes = await request0().post("/rest/v1/submission_answers", {
      headers: { ...authHeaders(token), Prefer: "resolution=merge-duplicates,return=minimal" },
      params: { on_conflict: "submission_id,question_id" },
      data: answerRows,
    });
    if (!upsertRes.ok()) return false;
  }

  const maxScore = sub.max_score || 1;
  const patchRes = await request0().patch("/rest/v1/submissions", {
    headers: { ...authHeaders(token), Prefer: "return=minimal" },
    params: { id: `eq.${submissionId}` },
    data: {
      status: "submitted",
      submitted_at: new Date().toISOString(),
      total_score: autoScore,
      percentage: Math.round((autoScore / maxScore) * 100),
      time_taken_minutes: 5,
    },
  });
  return patchRes.ok();
}

async function runLoadCollect(name, concurrency, taskFactory, tier) {
  process.stdout.write(`Running: ${name} (concurrency ${concurrency})... `);
  const wallStart = performance.now();
  const raw = await Promise.all(
    Array.from({ length: concurrency }, async (_, i) => {
      const start = performance.now();
      try {
        const value = await taskFactory(i);
        return { ms: performance.now() - start, ok: value !== false, value, error: null };
      } catch (err) {
        return { ms: performance.now() - start, ok: false, value: null, error: String(err?.message ?? err) };
      }
    })
  );
  const wallMs = performance.now() - wallStart;
  const durations = raw.map((r) => r.ms).sort((a, b) => a - b);
  const errors = raw.filter((r) => !r.ok);
  const stat = {
    name,
    tier,
    concurrency,
    successCount: concurrency - errors.length,
    errorCount: errors.length,
    errorRatePct: +((errors.length / concurrency) * 100).toFixed(2),
    minMs: +durations[0].toFixed(1),
    maxMs: +durations[durations.length - 1].toFixed(1),
    avgMs: +(durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1),
    p50Ms: +percentile(durations, 50).toFixed(1),
    p95Ms: +percentile(durations, 95).toFixed(1),
    p99Ms: +percentile(durations, 99).toFixed(1),
    throughputRps: +(concurrency / (wallMs / 1000)).toFixed(2),
    wallMs: +wallMs.toFixed(1),
    sampleErrors: [...new Set(errors.map((e) => e.error))].slice(0, 3),
  };
  console.log(`p50 ${stat.p50Ms}ms  p95 ${stat.p95Ms}ms  errors ${stat.errorCount}/${concurrency}`);
  return { stat, data: raw.map((r) => r.value) };
}

main()
  .catch((err) => {
    console.error("FATAL:", err);
    process.exit(1);
  });

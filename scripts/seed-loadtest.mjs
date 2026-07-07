// Idempotent seed script for the 100-concurrent-user load test.
// Creates an isolated "Load Test" teacher, batch, 20 students, and 3 published
// tests (5 MCQ questions each) so the load test never touches real data.
// All emails are namespaced loadtest.*@facultify.test so cleanup-loadtest.mjs
// can sweep them by pattern alone.
// Run with: node scripts/seed-loadtest.mjs

import { createClient } from "@supabase/supabase-js";
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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = "FacultifyLoadTest_2026!";
const TEACHER_EMAIL = "loadtest.teacher@facultify.test";
const STUDENT_COUNT = 20;
const TEST_COUNT = 3;
const QUESTIONS_PER_TEST = 5;

async function getOrCreateAuthUser(email, password) {
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (!createErr) return created.user;

  const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) throw new Error(`listUsers failed: ${listErr.message}`);
  const existing = list.users.find((u) => u.email === email);
  if (!existing) throw new Error(`createUser failed and user not found: ${createErr.message}`);
  return existing;
}

async function main() {
  const { data: institution, error: instErr } = await supabase
    .from("institutions")
    .select("id")
    .limit(1)
    .single();
  if (instErr || !institution) throw new Error("No institution found: " + instErr?.message);
  const institutionId = institution.id;

  // ── Teacher ────────────────────────────────────────────────────────────────
  const teacherUser = await getOrCreateAuthUser(TEACHER_EMAIL, PASSWORD);

  let { data: teacher } = await supabase
    .from("teachers")
    .select("id")
    .eq("institution_id", institutionId)
    .eq("email", TEACHER_EMAIL)
    .maybeSingle();

  if (!teacher) {
    const { data, error } = await supabase
      .from("teachers")
      .insert({
        user_id:        teacherUser.id,
        institution_id: institutionId,
        name:           "Load Test Teacher",
        email:          TEACHER_EMAIL,
        subject:        "Load Test",
      })
      .select("id")
      .single();
    if (error) throw new Error("Teacher insert failed: " + error.message);
    teacher = data;
  }

  await supabase.from("profiles").upsert(
    { id: teacherUser.id, institution_id: institutionId, role: "teacher", entity_id: teacher.id },
    { onConflict: "id" }
  );

  // ── Batch ──────────────────────────────────────────────────────────────────
  let { data: batch } = await supabase
    .from("batches")
    .select("id")
    .eq("teacher_id", teacher.id)
    .eq("name", "Load Test Batch")
    .maybeSingle();

  if (!batch) {
    const { data, error } = await supabase
      .from("batches")
      .insert({ teacher_id: teacher.id, institution_id: institutionId, name: "Load Test Batch", subject: "Load Test" })
      .select("id")
      .single();
    if (error) throw new Error("Batch insert failed: " + error.message);
    batch = data;
  }

  // ── Students ───────────────────────────────────────────────────────────────
  const students = [];
  for (let i = 1; i <= STUDENT_COUNT; i++) {
    const n = String(i).padStart(3, "0");
    const email = `loadtest.student${n}@facultify.test`;
    const user = await getOrCreateAuthUser(email, PASSWORD);

    let { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("batch_id", batch.id)
      .eq("email", email)
      .maybeSingle();

    if (!student) {
      const { data, error } = await supabase
        .from("students")
        .insert({
          user_id:        user.id,
          institution_id: institutionId,
          teacher_id:     teacher.id,
          batch_id:       batch.id,
          name:           `Load Test Student ${n}`,
          email,
          roll_number:    `LT-${n}`,
        })
        .select("id")
        .single();
      if (error) throw new Error(`Student ${n} insert failed: ` + error.message);
      student = data;
    }

    await supabase.from("profiles").upsert(
      { id: user.id, institution_id: institutionId, role: "student", entity_id: student.id },
      { onConflict: "id" }
    );

    students.push({ id: student.id, email, userId: user.id });
    process.stdout.write(`\rSeeded students: ${i}/${STUDENT_COUNT}`);
  }
  console.log();

  // ── Tests ──────────────────────────────────────────────────────────────────
  const tests = [];
  for (let i = 1; i <= TEST_COUNT; i++) {
    const title = `Load Test Quiz ${i}`;
    let { data: test } = await supabase
      .from("tests")
      .select("id")
      .eq("batch_id", batch.id)
      .eq("title", title)
      .maybeSingle();

    if (!test) {
      const { data: t, error: tErr } = await supabase
        .from("tests")
        .insert({
          teacher_id:       teacher.id,
          institution_id:   institutionId,
          batch_id:         batch.id,
          title,
          description:      "Fixture test for the 100-user load test",
          subject:          "Load Test",
          status:           "published",
          total_marks:      QUESTIONS_PER_TEST * 5,
          duration_minutes: 30,
        })
        .select("id")
        .single();
      if (tErr) throw new Error(`Test ${i} insert failed: ` + tErr.message);
      test = t;

      for (let q = 1; q <= QUESTIONS_PER_TEST; q++) {
        const { data: question, error: qErr } = await supabase
          .from("questions")
          .insert({
            test_id:    test.id,
            order:      q,
            type:       "mcq",
            text:       `Load test question ${q}: what is ${q} + ${q}?`,
            marks:      5,
            difficulty: "easy",
          })
          .select("id")
          .single();
        if (qErr) throw new Error(`Question ${q} insert failed: ` + qErr.message);

        const { error: optErr } = await supabase.from("question_options").insert([
          { question_id: question.id, text: String(q + q), is_correct: true },
          { question_id: question.id, text: String(q + q + 1), is_correct: false },
          { question_id: question.id, text: String(q + q + 2), is_correct: false },
          { question_id: question.id, text: String(q * q), is_correct: false },
        ]);
        if (optErr) throw new Error(`Options for question ${q} insert failed: ` + optErr.message);
      }
    }

    tests.push({ id: test.id, title });
  }

  // ── Persist fixture manifest for the load-test + cleanup scripts ───────────
  const manifest = {
    institutionId,
    password: PASSWORD,
    teacher: { id: teacher.id, email: TEACHER_EMAIL },
    batchId: batch.id,
    students,
    tests,
    seededAt: new Date().toISOString(),
  };
  writeFileSync("./scripts/loadtest-fixtures.json", JSON.stringify(manifest, null, 2));

  console.log("Seed complete:");
  console.log("  Teacher:", TEACHER_EMAIL, teacher.id);
  console.log("  Batch:", batch.id);
  console.log("  Students:", students.length);
  console.log("  Tests:", tests.map((t) => t.title).join(", "));
  console.log("  Manifest written to scripts/loadtest-fixtures.json");
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});

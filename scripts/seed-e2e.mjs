// Idempotent seed script for Playwright e2e fixtures.
// Creates a dedicated e2e teacher, batch, student, and one published test
// (with a single MCQ question) so e2e specs never touch real data.
// Run with: node scripts/seed-e2e.mjs

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync } from "fs";

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

const TEACHER_EMAIL = "teacher.e2e@facultify.test";
const STUDENT_EMAIL = "student.e2e@facultify.test";
const PASSWORD = "FacultifyE2E_2026!";

async function getOrCreateAuthUser(email, password) {
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (!createErr) return created.user;

  // Already exists — look it up
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
        name:           "E2E Teacher",
        email:          TEACHER_EMAIL,
        subject:        "E2E Subject",
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
    .eq("name", "E2E Batch")
    .maybeSingle();

  if (!batch) {
    const { data, error } = await supabase
      .from("batches")
      .insert({ teacher_id: teacher.id, institution_id: institutionId, name: "E2E Batch", subject: "E2E Subject" })
      .select("id")
      .single();
    if (error) throw new Error("Batch insert failed: " + error.message);
    batch = data;
  }

  // ── Student ────────────────────────────────────────────────────────────────
  const studentUser = await getOrCreateAuthUser(STUDENT_EMAIL, PASSWORD);

  let { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("batch_id", batch.id)
    .eq("email", STUDENT_EMAIL)
    .maybeSingle();

  if (!student) {
    const { data, error } = await supabase
      .from("students")
      .insert({
        user_id:        studentUser.id,
        institution_id: institutionId,
        teacher_id:     teacher.id,
        batch_id:       batch.id,
        name:           "E2E Student",
        email:          STUDENT_EMAIL,
        roll_number:    "E2E-001",
      })
      .select("id")
      .single();
    if (error) throw new Error("Student insert failed: " + error.message);
    student = data;
  }

  await supabase.from("profiles").upsert(
    { id: studentUser.id, institution_id: institutionId, role: "student", entity_id: student.id },
    { onConflict: "id" }
  );

  // Clean up test rows left behind by previous teacher-workflow spec runs
  // (each run creates a uniquely-titled test) so they don't pile up.
  await supabase
    .from("tests")
    .delete()
    .eq("batch_id", batch.id)
    .neq("title", "E2E Seed Test");

  // ── Seed test for the student-workflow spec (published, 1 MCQ question) ────
  let { data: seedTest } = await supabase
    .from("tests")
    .select("id")
    .eq("batch_id", batch.id)
    .eq("title", "E2E Seed Test")
    .maybeSingle();

  if (!seedTest) {
    const { data: t, error: tErr } = await supabase
      .from("tests")
      .insert({
        teacher_id:       teacher.id,
        institution_id:   institutionId,
        batch_id:         batch.id,
        title:            "E2E Seed Test",
        description:      "Fixture test for Playwright student-workflow spec",
        subject:          "E2E Subject",
        status:           "published",
        total_marks:      5,
        duration_minutes: 10,
      })
      .select("id")
      .single();
    if (tErr) throw new Error("Seed test insert failed: " + tErr.message);
    seedTest = t;

    const { data: q, error: qErr } = await supabase
      .from("questions")
      .insert({
        test_id:    seedTest.id,
        order:      1,
        type:       "mcq",
        text:       "What is 2 + 2?",
        marks:      5,
        difficulty: "easy",
      })
      .select("id")
      .single();
    if (qErr) throw new Error("Seed question insert failed: " + qErr.message);

    const { error: optErr } = await supabase.from("question_options").insert([
      { question_id: q.id, text: "3", is_correct: false },
      { question_id: q.id, text: "4", is_correct: true },
      { question_id: q.id, text: "5", is_correct: false },
      { question_id: q.id, text: "22", is_correct: false },
    ]);
    if (optErr) throw new Error("Seed options insert failed: " + optErr.message);
  }

  // Reset any leftover submission from a previous/interrupted e2e run so the
  // seed test always starts "Upcoming" for the student spec.
  await supabase.from("submissions").delete().eq("test_id", seedTest.id).eq("student_id", student.id);

  // ── Persist credentials for Playwright to read ──────────────────────────────
  const lines = [];
  if (!envText.includes("E2E_TEACHER_EMAIL")) lines.push(`E2E_TEACHER_EMAIL=${TEACHER_EMAIL}`);
  if (!envText.includes("E2E_STUDENT_EMAIL")) lines.push(`E2E_STUDENT_EMAIL=${STUDENT_EMAIL}`);
  if (!envText.includes("E2E_PASSWORD")) lines.push(`E2E_PASSWORD=${PASSWORD}`);
  if (lines.length) {
    writeFileSync(ENV_PATH, envText.trimEnd() + "\n\n# Playwright e2e fixtures (scripts/seed-e2e.mjs)\n" + lines.join("\n") + "\n");
  }

  console.log("Seed complete:");
  console.log("  Teacher:", TEACHER_EMAIL, teacher.id);
  console.log("  Student:", STUDENT_EMAIL, student.id);
  console.log("  Batch:", batch.id);
  console.log("  Seed test:", seedTest.id);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});

// Removes every row/auth user created by scripts/seed-loadtest.mjs and the
// load-test harness itself (including any throwaway "loadtest.extra*" rows
// created mid-run by write-endpoint tests). Sweeps by the loadtest.*@facultify.test
// email pattern and "Load Test%" naming so it doesn't depend on an exact manifest.
// Run with: node scripts/cleanup-loadtest.mjs

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

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

async function main() {
  console.log("Cleaning up load-test fixtures...");

  // Tests (cascades questions, question_options, submissions, submission_answers)
  const { data: tests, error: testsErr } = await supabase
    .from("tests")
    .select("id, title")
    .ilike("title", "Load Test%");
  if (testsErr) throw testsErr;
  if (tests?.length) {
    const { error } = await supabase.from("tests").delete().in("id", tests.map((t) => t.id));
    if (error) throw error;
    console.log(`  Deleted ${tests.length} test(s)`);
  }

  // Students
  const { data: students, error: studentsErr } = await supabase
    .from("students")
    .select("id, email, user_id")
    .ilike("email", "loadtest.%@facultify.test");
  if (studentsErr) throw studentsErr;
  if (students?.length) {
    const { error } = await supabase.from("students").delete().in("id", students.map((s) => s.id));
    if (error) throw error;
    console.log(`  Deleted ${students.length} student row(s)`);
  }

  // Batches
  const { data: batches, error: batchesErr } = await supabase
    .from("batches")
    .select("id")
    .eq("name", "Load Test Batch");
  if (batchesErr) throw batchesErr;
  if (batches?.length) {
    const { error } = await supabase.from("batches").delete().in("id", batches.map((b) => b.id));
    if (error) throw error;
    console.log(`  Deleted ${batches.length} batch(es)`);
  }

  // Teachers
  const { data: teachers, error: teachersErr } = await supabase
    .from("teachers")
    .select("id, email, user_id")
    .ilike("email", "loadtest.%@facultify.test");
  if (teachersErr) throw teachersErr;
  if (teachers?.length) {
    const { error } = await supabase.from("teachers").delete().in("id", teachers.map((t) => t.id));
    if (error) throw error;
    console.log(`  Deleted ${teachers.length} teacher row(s)`);
  }

  // Auth users (profiles cascade-delete automatically via FK on auth.users)
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) throw listErr;
  const loadtestUsers = list.users.filter((u) => (u.email ?? "").startsWith("loadtest.") && u.email.endsWith("@facultify.test"));
  for (const u of loadtestUsers) {
    const { error } = await supabase.auth.admin.deleteUser(u.id);
    if (error) console.error(`  Failed to delete auth user ${u.email}:`, error.message);
  }
  console.log(`  Deleted ${loadtestUsers.length} auth user(s)`);

  console.log("Cleanup complete.");
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});

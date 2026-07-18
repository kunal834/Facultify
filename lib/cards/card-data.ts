import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeRank, computePercentile } from "@/lib/ranking";

// Untyped inline client — same convention as app/api/billing/checkout/route.ts:
// the typed helper in lib/supabase/server.ts infers `never` for hand-rolled
// select strings against this schema, so this repo casts results explicitly
// instead of fighting the generic.
async function createAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}

interface ProfileRow {
  role: "admin" | "teacher" | "student";
  institution_id: string;
  entity_id: string;
}

export interface ResultCardData {
  submissionId: string;
  studentName: string;
  studentAvatarUrl?: string;
  testTitle: string;
  subject: string;
  score: number;
  maxScore: number;
  percentage: number;
  batchRank: number;
  batchSize: number;
  percentile: number;
  institutionName: string;
  institutionLogoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  previousPercentage?: number;
}

export type CardVariant = "topper" | "improvement" | "standard";

// A ~10-point jump vs. the student's last graded test is the bar for the
// "improvement" template — anything smaller reads as noise, not a story.
const IMPROVEMENT_THRESHOLD = 10;

export function pickCardVariant(
  data: Pick<ResultCardData, "batchRank" | "percentage" | "previousPercentage">
): CardVariant {
  if (data.batchRank <= 3) return "topper";
  if (
    data.previousPercentage !== undefined &&
    data.percentage - data.previousPercentage >= IMPROVEMENT_THRESHOLD
  ) {
    return "improvement";
  }
  return "standard";
}

export class CardAccessError extends Error {}

/**
 * Fetches everything a rank card needs for one submission, enforcing the
 * same access rule as the rest of the app: the owning student, the owning
 * teacher, or an admin of that institution. Mirrors the auth pattern in
 * app/api/billing/checkout/route.ts (session check, then a manual
 * institution/role check before touching the service-role client).
 */
export async function getResultCardData(submissionId: string): Promise<ResultCardData> {
  const authClient = await createAuthClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) throw new CardAccessError("Not authenticated");

  const { data: profileRow } = await authClient
    .from("profiles")
    .select("role, institution_id, entity_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profileRow) throw new CardAccessError("No profile for this user");
  const profile = profileRow as unknown as ProfileRow;

  const admin = createAdminClient();

  const { data: submission } = await admin
    .from("submissions")
    .select("id, test_id, student_id, status, total_score, max_score, percentage")
    .eq("id", submissionId)
    .maybeSingle();
  if (!submission) throw new CardAccessError("Submission not found");
  if (submission.status !== "graded") throw new CardAccessError("Submission is not graded yet");

  const { data: test } = await admin
    .from("tests")
    .select("id, title, subject, teacher_id, institution_id")
    .eq("id", submission.test_id)
    .maybeSingle();
  if (!test) throw new CardAccessError("Test not found");

  if (profile.institution_id !== test.institution_id) {
    throw new CardAccessError("Cross-institution access denied");
  }
  const isOwningStudent = profile.role === "student" && profile.entity_id === submission.student_id;
  const isOwningTeacher = profile.role === "teacher" && profile.entity_id === test.teacher_id;
  const isInstitutionAdmin = profile.role === "admin";
  if (!isOwningStudent && !isOwningTeacher && !isInstitutionAdmin) {
    throw new CardAccessError("Not authorized to view this submission");
  }

  const { data: student } = await admin
    .from("students")
    .select("id, name, avatar_url, batch_id")
    .eq("id", submission.student_id)
    .maybeSingle();
  if (!student) throw new CardAccessError("Student not found");

  const { data: institution } = await admin
    .from("institutions")
    .select("name, logo_url, primary_color, secondary_color")
    .eq("id", test.institution_id)
    .maybeSingle();
  if (!institution) throw new CardAccessError("Institution not found");

  // Batch leaderboard for this test: every graded submission from a student in the same batch.
  const { data: batchStudents } = await admin
    .from("students")
    .select("id")
    .eq("batch_id", student.batch_id);
  const batchStudentIds = (batchStudents ?? []).map((s: { id: string }) => s.id);

  const { data: batchSubs } = await admin
    .from("submissions")
    .select("percentage")
    .eq("test_id", test.id)
    .eq("status", "graded")
    .in("student_id", batchStudentIds.length > 0 ? batchStudentIds : [student.id]);

  const batchScores = (batchSubs ?? []).map((s: { percentage: number }) => s.percentage);
  const batchRank = computeRank(batchScores, submission.percentage);
  const percentile = computePercentile(batchScores, submission.percentage);

  // Most recent other graded submission by this student — powers the improvement variant.
  const { data: previous } = await admin
    .from("submissions")
    .select("percentage, graded_at")
    .eq("student_id", student.id)
    .eq("status", "graded")
    .neq("id", submissionId)
    .order("graded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    submissionId,
    studentName: student.name,
    studentAvatarUrl: student.avatar_url ?? undefined,
    testTitle: test.title,
    subject: test.subject,
    score: submission.total_score,
    maxScore: submission.max_score,
    percentage: submission.percentage,
    batchRank,
    batchSize: batchScores.length,
    percentile,
    institutionName: institution.name,
    institutionLogoUrl: institution.logo_url ?? undefined,
    primaryColor: institution.primary_color,
    secondaryColor: institution.secondary_color,
    previousPercentage: previous?.percentage ?? undefined,
  };
}

/**
 * Same access rule, scoped to a whole test instead of one submission — used
 * by the admin/teacher "generate topper cards" zip export.
 */
export async function getTopperCardData(testId: string, count: number): Promise<ResultCardData[]> {
  const authClient = await createAuthClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) throw new CardAccessError("Not authenticated");

  const { data: profileRow } = await authClient
    .from("profiles")
    .select("role, institution_id, entity_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profileRow) throw new CardAccessError("No profile for this user");
  const profile = profileRow as unknown as ProfileRow;
  if (profile.role !== "admin" && profile.role !== "teacher") {
    throw new CardAccessError("Only teachers and admins can generate topper cards");
  }

  const admin = createAdminClient();

  const { data: testRow } = await admin
    .from("tests")
    .select("id, institution_id, teacher_id")
    .eq("id", testId)
    .maybeSingle();
  if (!testRow) throw new CardAccessError("Test not found");
  const test = testRow as unknown as { id: string; institution_id: string; teacher_id: string };
  if (profile.institution_id !== test.institution_id) {
    throw new CardAccessError("Cross-institution access denied");
  }
  if (profile.role === "teacher" && profile.entity_id !== test.teacher_id) {
    throw new CardAccessError("Only the owning teacher can generate topper cards for this test");
  }

  const { data: topSubs } = await admin
    .from("submissions")
    .select("id")
    .eq("test_id", testId)
    .eq("status", "graded")
    .order("percentage", { ascending: false })
    .limit(count);

  const ids = (topSubs ?? []).map((s: { id: string }) => s.id);
  const results: ResultCardData[] = [];
  for (const id of ids) {
    results.push(await getResultCardData(id));
  }
  return results;
}

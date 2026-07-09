import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

function createAdminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(request: NextRequest) {
  const url   = new URL(request.url);
  const code  = url.searchParams.get("code");
  const setup = url.searchParams.get("setup") === "1";

  if (!code) {
    return NextResponse.redirect(new URL("/auth/login?error=no_code", request.url));
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
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

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/auth/login?error=exchange_failed", request.url));
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const adminDb = createAdminDb();
  const email = (user.email ?? "").toLowerCase();

  // .maybeSingle() throws (and silently returns `data: null`) if more than one
  // row matches — which happens whenever an email isn't unique across the
  // table (e.g. a student enrolled by two teachers, or the same email reused
  // in two institutions). .limit(1) + reading the first row tolerates that
  // instead of misidentifying an existing user as brand new.
  const { data: teacherRows, error: teacherErr } = await adminDb
    .from("teachers")
    .select("id, institution_id")
    .ilike("email", email)
    .limit(1);
  if (teacherErr) console.error("[auth/callback] teacher lookup error:", teacherErr);
  const teacher = teacherRows?.[0];

  if (teacher) {
    await adminDb.from("profiles").upsert(
      { id: user.id, institution_id: teacher.institution_id, role: "teacher", entity_id: teacher.id },
      { onConflict: "id" }
    );
    await adminDb.from("teachers").update({ user_id: user.id }).eq("id", teacher.id);
    const teacherDest = setup ? "/auth/set-password?next=/teacher" : "/teacher";
    return NextResponse.redirect(new URL(teacherDest, request.url));
  }

  const { data: studentRows, error: studentErr } = await adminDb
    .from("students")
    .select("id, institution_id")
    .ilike("email", email)
    .limit(1);
  if (studentErr) console.error("[auth/callback] student lookup error:", studentErr);
  const student = studentRows?.[0];

  if (student) {
    await adminDb.from("profiles").upsert(
      { id: user.id, institution_id: student.institution_id, role: "student", entity_id: student.id },
      { onConflict: "id" }
    );
    await adminDb.from("students").update({ user_id: user.id }).eq("id", student.id);
    return NextResponse.redirect(new URL("/student", request.url));
  }

  // Existing profile — route directly to their dashboard
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "teacher") return NextResponse.redirect(new URL("/teacher", request.url));
  if (profile?.role === "student") return NextResponse.redirect(new URL("/student", request.url));
  if (profile?.role === "admin")   return NextResponse.redirect(new URL("/admin",   request.url));

  return NextResponse.redirect(new URL("/onboard", request.url));
}

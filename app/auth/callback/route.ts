import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const url  = new URL(request.url);
  const code = url.searchParams.get("code");

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

  // Existing user with a profile → send to their dashboard
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    const routes: Record<string, string> = { admin: "/admin", teacher: "/teacher", student: "/student" };
    return NextResponse.redirect(new URL(routes[profile.role] ?? "/", request.url));
  }

  // Invited teacher — email matches a teachers row
  const { data: teacher } = await supabase
    .from("teachers")
    .select("id, institution_id")
    .eq("email", user.email!)
    .maybeSingle();

  if (teacher) {
    await supabase.from("profiles").insert({
      id: user.id, institution_id: teacher.institution_id, role: "teacher", entity_id: teacher.id,
    });
    await supabase.from("teachers").update({ user_id: user.id }).eq("id", teacher.id);
    return NextResponse.redirect(new URL("/teacher", request.url));
  }

  // Invited student — email matches a students row
  const { data: student } = await supabase
    .from("students")
    .select("id, institution_id")
    .eq("email", user.email!)
    .maybeSingle();

  if (student) {
    await supabase.from("profiles").insert({
      id: user.id, institution_id: student.institution_id, role: "student", entity_id: student.id,
    });
    await supabase.from("students").update({ user_id: user.id }).eq("id", student.id);
    return NextResponse.redirect(new URL("/student", request.url));
  }

  // Brand-new admin with no institution yet → onboarding wizard
  return NextResponse.redirect(new URL("/onboard", request.url));
}

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const { email, name, institutionId } = body ?? {};

  if (!email || !name || !institutionId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Verify the caller is an authenticated admin for this institution
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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, institution_id")
    .eq("id", user.id)
    .single();

  if (
    !profile ||
    (profile as { role: string; institution_id: string }).role !== "admin" ||
    (profile as { role: string; institution_id: string }).institution_id !== institutionId
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Send the invite email via the service-role admin client (bypasses RLS)
  const adminClient = createAdminClient();
  const origin =
    request.headers.get("origin") ??
    process.env.NEXT_PUBLIC_SUPABASE_URL!;

  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    email,
    {
      redirectTo: `${origin}/auth/callback`,
      data: { full_name: name },
    }
  );

  if (inviteError) {
    // "User already registered" is not a failure — they'll get a magic-link email instead
    if (!inviteError.message.toLowerCase().includes("already")) {
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}

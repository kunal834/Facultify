import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendStudentInviteEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const { email, studentName, teacherName, batchName, institutionName } = body ?? {};

  if (!email || !studentName || !teacherName) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Verify the caller is an authenticated teacher
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
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile as { role: string }).role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const adminClient = createAdminClient();
  // Use the app's own origin — never fall back to the Supabase project URL
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ??
    request.headers.get("origin") ??
    `${request.nextUrl.protocol}//${request.nextUrl.host}`;

  // Generate an invite magic link (does NOT send Supabase's default email)
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: "invite",
    email,
    options: {
      data: { full_name: studentName, role: "student" },
      redirectTo: `${origin}/auth/callback`,
    },
  });

  // If the user already has a Supabase account, fall back to a sign-in magic link
  let magicLink: string;
  if (linkData?.properties?.action_link) {
    magicLink = linkData.properties.action_link;
  } else if (linkError?.message.toLowerCase().includes("already")) {
    const { data: signinData } = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: `${origin}/auth/confirm` },
    });
    magicLink = signinData?.properties?.action_link ?? `${origin}/auth/login`;
  } else if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 500 });
  } else {
    magicLink = `${origin}/auth/login`;
  }
  const dashboardUrl = `${origin}/student`;

  // Send a rich custom email via Resend
  const { error: emailError } = await sendStudentInviteEmail({
    to: email,
    studentName,
    teacherName,
    batchName: batchName ?? "your batch",
    institutionName: institutionName ?? "your institution",
    dashboardUrl,
    magicLink,
  });

  if (emailError) {
    return NextResponse.json({ success: true, emailFailed: true, magicLink });
  }

  return NextResponse.json({ success: true });
}

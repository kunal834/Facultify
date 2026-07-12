import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDodo } from "@/lib/dodo";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const { institutionId } = body ?? {};

  if (!institutionId) {
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

  const adminClient = createAdminClient();
  const { data: institution } = await adminClient
    .from("institutions")
    .select("dodo_customer_id")
    .eq("id", institutionId)
    .single();

  const customerId = (institution as unknown as { dodo_customer_id: string | null } | null)
    ?.dodo_customer_id ?? null;
  if (!customerId) {
    return NextResponse.json(
      { error: "No billing account yet — upgrade to a paid plan first." },
      { status: 400 }
    );
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL!;
  try {
    const session = await getDodo().customers.customerPortal.create(customerId, {
      return_url: `${origin}/admin/billing`,
    });
    return NextResponse.json({ url: session.link });
  } catch (err) {
    console.error("[billing/portal] failed:", err);
    const message = err instanceof Error ? err.message : "Could not open billing portal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

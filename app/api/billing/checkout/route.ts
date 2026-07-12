import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDodo, getDodoProductId, isPaidTier, type BillingCycle } from "@/lib/dodo";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const { institutionId, tier, billingCycle } = body ?? {};

  if (!institutionId || !tier || !billingCycle) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (!isPaidTier(tier) || (billingCycle !== "monthly" && billingCycle !== "annual")) {
    return NextResponse.json({ error: "Invalid tier or billing cycle" }, { status: 400 });
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
  const { data: institution, error: instErr } = await adminClient
    .from("institutions")
    .select("name, admin_email, dodo_customer_id")
    .eq("id", institutionId)
    .single();

  if (instErr || !institution) {
    return NextResponse.json({ error: "Institution not found" }, { status: 404 });
  }
  const inst = institution as unknown as {
    name: string;
    admin_email: string;
    dodo_customer_id: string | null;
  };

  try {
    const dodo = getDodo();

    // Reuse the existing Dodo customer, or create one on first checkout
    let customerId = inst.dodo_customer_id;
    if (!customerId) {
      const customer = await dodo.customers.create({
        email: inst.admin_email,
        name: inst.name,
      });
      customerId = customer.customer_id;
      await adminClient
        .from("institutions")
        .update({ dodo_customer_id: customerId })
        .eq("id", institutionId);
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL!;
    const productId = getDodoProductId(tier, billingCycle as BillingCycle);

    const session = await dodo.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: { customer_id: customerId },
      return_url: `${origin}/admin/billing?checkout=success`,
      metadata: { institutionId, tier, billingCycle },
    });

    return NextResponse.json({ url: session.checkout_url });
  } catch (err) {
    console.error("[billing/checkout] failed:", err);
    const message = err instanceof Error ? err.message : "Could not start checkout.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import DodoPayments, { NotFoundError } from 'dodopayments'
import type { SubscriptionTier } from '@/lib/types'
import type { createAdminClient } from '@/lib/supabase/admin'

// Server-side only — never import this file from a Client Component.
// Lazily constructed (like createAdminClient() in lib/supabase/admin.ts) so a
// missing DODO_PAYMENTS_API_KEY doesn't blow up at module-import time.
let _dodo: DodoPayments | null = null

export function getDodo(): DodoPayments {
  if (!_dodo) {
    _dodo = new DodoPayments({
      environment: process.env.DODO_PAYMENTS_ENVIRONMENT === 'live_mode' ? 'live_mode' : 'test_mode',
    })
  }
  return _dodo
}

export type BillingCycle = 'monthly' | 'annual'
export type PaidTier = Exclude<SubscriptionTier, 'free'>

// Product IDs are created in the Dodo dashboard (one per tier x billing cycle)
// and wired in here via env vars — never hardcoded.
const PRODUCT_ENV_VAR: Record<PaidTier, Record<BillingCycle, string | undefined>> = {
  starter: {
    monthly: process.env.DODO_PRICE_STARTER_MONTHLY,
    annual:  process.env.DODO_PRICE_STARTER_ANNUAL,
  },
  institution: {
    monthly: process.env.DODO_PRICE_INSTITUTION_MONTHLY,
    annual:  process.env.DODO_PRICE_INSTITUTION_ANNUAL,
  },
  campus: {
    monthly: process.env.DODO_PRICE_CAMPUS_MONTHLY,
    annual:  process.env.DODO_PRICE_CAMPUS_ANNUAL,
  },
}

export function getDodoProductId(tier: PaidTier, billingCycle: BillingCycle): string {
  const productId = PRODUCT_ENV_VAR[tier]?.[billingCycle]
  if (!productId) {
    throw new Error(
      `No Dodo product configured for ${tier}/${billingCycle}. Set the corresponding DODO_PRICE_* env var.`
    )
  }
  return productId
}

export function isPaidTier(tier: SubscriptionTier): tier is PaidTier {
  return tier === 'starter' || tier === 'institution' || tier === 'campus'
}

// A stored dodo_customer_id can go stale — most commonly when the project
// switches from test_mode to live_mode (or the Dodo sandbox gets reset).
// Dodo customers are scoped per environment/API key, so an old id 404s
// against the current one. This resolves a usable customer id for an
// institution, self-healing by creating a fresh customer when the stored
// one no longer exists instead of letting checkout hard-fail.
export async function getOrCreateDodoCustomer(
  adminClient: ReturnType<typeof createAdminClient>,
  institutionId: string,
  institution: { name: string; admin_email: string; dodo_customer_id: string | null }
): Promise<string> {
  const dodo = getDodo()

  if (institution.dodo_customer_id) {
    try {
      await dodo.customers.retrieve(institution.dodo_customer_id)
      return institution.dodo_customer_id
    } catch (err) {
      if (!(err instanceof NotFoundError)) throw err
      // Stale id (e.g. left over from test_mode) — fall through and recreate.
    }
  }

  const customer = await dodo.customers.create({
    email: institution.admin_email,
    name: institution.name,
  })
  await adminClient
    .from('institutions')
    .update({ dodo_customer_id: customer.customer_id })
    .eq('id', institutionId)

  return customer.customer_id
}

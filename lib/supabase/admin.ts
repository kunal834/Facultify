import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

// Service-role client — bypasses RLS entirely.
// ONLY use in server-side code (Server Actions, Route Handlers, Edge Functions).
// NEVER expose SUPABASE_SERVICE_ROLE_KEY to the browser.
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

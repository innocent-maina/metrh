import { createError } from "h3";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~~/types/database.types";

// SERVER-ONLY. This file lives under server/ so Nitro never bundles it for
// the client. Do not import this from any app/ component, page, composable,
// or plugin — that would ship the service role key to the browser.
//
// Use this only for actions that must bypass RLS on purpose:
//   - provisioning or resetting staff auth users from the Team dashboard
//   - generating signed URLs for the private "documents" bucket
//   - server-side jobs (e.g. a cron marking expired tenders as closed)
//
// Everything else — including staff CRUD from the dashboard — should go
// through serverSupabaseClient(event) from #supabase/server instead, so RLS
// and has_role() stay the actual authorization boundary, not this key.

let cachedAdminClient: SupabaseClient<Database> | null = null;

export function supabaseAdmin(): SupabaseClient<Database> {
  if (cachedAdminClient) return cachedAdminClient;

  const config = useRuntimeConfig();
  const url = config.public.supabase?.url ?? config.public.supabaseUrl;
  const serviceRoleKey =
    config.supabase.secretKey ?? config.supabase.serviceKey ?? config.supabaseSecretKey;

  if (!url || !serviceRoleKey) {
    throw createError({
      statusCode: 500,
      statusMessage:
        "Supabase admin client is not configured (missing URL or service role key).",
    });
  }

  cachedAdminClient = createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return cachedAdminClient;
}

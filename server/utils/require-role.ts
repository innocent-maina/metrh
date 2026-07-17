import { createError } from "h3";
import type { H3Event } from "h3";
import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";
import type { Database, AppRole } from "~~/types/database.types";

/**
 * Ensures the request is authenticated. Throws 401 otherwise.
 * Returns the request-scoped Supabase client (cookie-authenticated, so all
 * queries made with it are still subject to RLS) and the authenticated
 * JWT claims. Supabase server auth exposes the user identifier as `sub`, not
 * `id`, so callers should use `userId` for profile/role lookups.
 */
export async function requireAuth(event: H3Event) {
  const client = await serverSupabaseClient<Database>(event);
  const user = await serverSupabaseUser(event);

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "Sign in required." });
  }

  const userId = user.sub;
  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid sign-in session.",
    });
  }

  return { client, user, userId };
}

/**
 * Ensures the request is authenticated AND the user holds `role` (or
 * super_admin, since has_role() treats super_admin as all-access). Throws
 * 401/403 otherwise. This mirrors the RLS policies in schema.sql — it's not
 * a replacement for them, it's the "fail fast with a clear error" layer the
 * build brief asks for, so a broken UI check is never the only line of
 * defense.
 */
export async function requireRole(event: H3Event, role: AppRole) {
  return requireAnyRole(event, [role]);
}

export async function requireAnyRole(event: H3Event, roles: AppRole[]) {
  const { client, user, userId } = await requireAuth(event);

  type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
  const { data: profile, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Could not verify permissions.",
    });
  }

  const staffProfile = profile as ProfileRow | null;
  if (!staffProfile || !staffProfile.is_active) {
    throw createError({
      statusCode: 403,
      statusMessage: "This staff account is inactive.",
    });
  }

  const roleRows: AppRole[] = staffProfile.roles ?? [];
  const allowedRoles = new Set(roles);
  const hasRole = roleRows.some(
    (entry) => entry === "super_admin" || allowedRoles.has(entry),
  );

  if (!hasRole) {
    throw createError({
      statusCode: 403,
      statusMessage: "You do not have access to this action.",
    });
  }

  return { client, user, userId };
}

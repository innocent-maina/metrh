import type { H3Event } from "h3";
import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";
import type { Database, AppRole } from "~~/types/database.types";

/**
 * Ensures the request is authenticated. Throws 401 otherwise.
 * Returns the request-scoped Supabase client (cookie-authenticated, so all
 * queries made with it are still subject to RLS) and the authenticated user.
 */
export async function requireAuth(event: H3Event) {
  const client = await serverSupabaseClient<Database>(event);
  const user = await serverSupabaseUser(event);

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "Sign in required." });
  }

  return { client, user };
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
  const { client, user } = await requireAuth(event);

  type UserRoleRow = Database["public"]["Tables"]["user_roles"]["Row"];
  const { data: roles, error } = await client
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Could not verify permissions.",
    });
  }

  const roleRows: Pick<UserRoleRow, "role">[] = roles ?? [];
  const hasRole = roleRows.some(
    (entry) => entry.role === role || entry.role === "super_admin",
  );

  if (!hasRole) {
    throw createError({
      statusCode: 403,
      statusMessage: "You do not have access to this action.",
    });
  }

  return { client, user };
}

import { requireAuth } from "~~/server/utils/require-role";
import { supabaseAdmin } from "~~/server/utils/supabase-admin";
import type { Database } from "~~/types/database.types";

export default defineEventHandler(async (event) => {
  const { client, userId } = await requireAuth(event);
  const adminClient = supabaseAdmin();

  type UserRoleRow = Database["public"]["Tables"]["user_roles"]["Row"];
  let roleRows: Pick<UserRoleRow, "role">[] = [];

  const roleQueries = [adminClient, client] as const;
  for (const supabase of roleQueries) {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (!error) {
      roleRows = data ?? [];
      break;
    }

    console.error("[dashboard/me] Could not load access roles.", {
      userId,
      error,
    });
  }

  let profile: Database["public"]["Tables"]["profiles"]["Row"] | null = null;
  if (roleRows.length > 0) {
    const profileQueries = [adminClient, client] as const;
    for (const supabase of profileQueries) {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (!error) {
        profile = data;
        break;
      }

      console.error("[dashboard/me] Could not load profile.", {
        userId,
        error,
      });
    }
  }

  return {
    profile,
    roles: roleRows.map((r) => r.role),
  };
});

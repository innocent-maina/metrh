import { requireAuth } from "~~/server/utils/require-role";
import { supabaseAdmin } from "~~/server/utils/supabase-admin";
import type { Database } from "~~/types/database.types";

export default defineEventHandler(async (event) => {
  const { client, userId } = await requireAuth(event);
  const adminClient = supabaseAdmin();

  type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
  let profile: ProfileRow | null = null;

  const profileQueries = [adminClient, client] as const;
  for (const supabase of profileQueries) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!error) {
      profile = data as ProfileRow | null;
      break;
    }

    console.error("[dashboard/me] Could not load profile.", {
      userId,
      error,
    });
  }

  return {
    profile,
    roles: profile?.roles ?? [],
  };
});

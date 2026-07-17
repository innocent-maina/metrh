import { supabaseAdmin } from "~~/server/utils/supabase-admin";

export default defineEventHandler(async () => {
  const { data, error } = await supabaseAdmin()
    .from("team_members")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) throw error;

  return { teamMembers: data ?? [] };
});

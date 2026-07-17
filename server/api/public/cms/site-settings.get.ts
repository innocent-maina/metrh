import { supabaseAdmin } from "~~/server/utils/supabase-admin";

export default defineEventHandler(async () => {
  const { data, error } = await supabaseAdmin()
    .from("site_settings")
    .select("*")
    .eq("id", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return { settings: data ?? null };
});

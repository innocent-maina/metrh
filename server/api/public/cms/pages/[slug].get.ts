import { getRouterParam } from "h3";
import { supabaseAdmin } from "~~/server/utils/supabase-admin";

export default defineEventHandler(async (event) => {
  const slug = String(getRouterParam(event, "slug") ?? "");

  const { data, error } = await supabaseAdmin()
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return { page: data ?? null };
});

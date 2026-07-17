import { getRouterParam } from "h3";
import { supabaseAdmin } from "~~/server/utils/supabase-admin";

export default defineEventHandler(async (event) => {
  const pageSlug = String(getRouterParam(event, "slug") ?? "");
  const { sectionKey } = getQuery(event) as { sectionKey?: string };

  const query = supabaseAdmin()
    .from("page_slides")
    .select("*")
    .eq("page_slug", pageSlug)
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (typeof sectionKey === "string" && sectionKey.trim()) {
    query.eq("section_key", sectionKey.trim());
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return { slides: data ?? [] };
});

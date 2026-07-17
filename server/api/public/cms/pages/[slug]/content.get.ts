import { getRouterParam } from "h3";
import { supabaseAdmin } from "~~/server/utils/supabase-admin";

export default defineEventHandler(async (event) => {
  const pageSlug = String(getRouterParam(event, "slug") ?? "");
  const admin = supabaseAdmin();

  const [sectionsResult, itemsResult] = await Promise.all([
    admin
      .from("page_sections")
      .select("*")
      .eq("page_slug", pageSlug)
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true }),
    admin
      .from("page_section_items")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  if (sectionsResult.error) {
    throw sectionsResult.error;
  }
  if (itemsResult.error) {
    throw itemsResult.error;
  }

  return {
    sections: sectionsResult.data ?? [],
    items: itemsResult.data ?? [],
  };
});

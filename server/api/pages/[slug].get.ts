import { serverSupabaseClient } from "#supabase/server";
import type { Database } from "~~/types/database.types";

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: "Missing page slug." });
  }

  const client = await serverSupabaseClient<Database>(event);

  const { data, error } = await client
    .from("pages")
    .select("slug, title, content, seo_title, seo_description, updated_at")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Could not load this page.",
    });
  }

  if (!data) {
    throw createError({ statusCode: 404, statusMessage: "Page not found." });
  }

  return data;
});

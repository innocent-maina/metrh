import { getRouterParam } from "h3";
import { supabaseAdmin } from "~~/server/utils/supabase-admin";

export default defineEventHandler(async (event) => {
  const slug = String(getRouterParam(event, "slug") ?? "");
  const admin = supabaseAdmin();

  const { data: posting, error } = await admin
    .from("job_postings")
    .select("*")
    .eq("slug", slug)
    .eq("status", "open")
    .maybeSingle();

  if (error) throw error;
  if (!posting) return { posting: null, relatedPostings: [] };

  const { data: relatedPostings, error: relatedError } = await admin
    .from("job_postings")
    .select("*")
    .eq("status", "open")
    .order("application_deadline", { ascending: true })
    .limit(6);

  if (relatedError) throw relatedError;

  return {
    posting,
    relatedPostings: relatedPostings ?? [],
  };
});

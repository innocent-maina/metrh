import { supabaseAdmin } from "~~/server/utils/supabase-admin";

export default defineEventHandler(async () => {
  const { data, error } = await supabaseAdmin()
    .from("job_postings")
    .select("*")
    .eq("status", "open")
    .order("application_deadline", { ascending: true });

  if (error) throw error;

  return { rounds: data ?? [] };
});

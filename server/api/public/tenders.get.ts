import { supabaseAdmin } from "~~/server/utils/supabase-admin";

export default defineEventHandler(async () => {
  const admin = supabaseAdmin();

  const [tendersResult, downloadsResult] = await Promise.all([
    admin
      .from("tenders")
      .select("*")
      .neq("status", "draft")
      .order("closing_date", { ascending: true }),
    admin
      .from("downloads")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false }),
  ]);

  if (tendersResult.error) throw tendersResult.error;
  if (downloadsResult.error) throw downloadsResult.error;

  return {
    tenders: tendersResult.data ?? [],
    downloads: downloadsResult.data ?? [],
  };
});

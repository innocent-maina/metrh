import { getRouterParam } from "h3";
import { supabaseAdmin } from "~~/server/utils/supabase-admin";

type TenderRow = {
  id: string;
  [key: string]: unknown;
};

export default defineEventHandler(async (event) => {
  const slug = String(getRouterParam(event, "slug") ?? "");
  const admin = supabaseAdmin();

  const { data: tenderData, error } = await admin
    .from("tenders")
    .select("*")
    .eq("slug", slug)
    .neq("status", "draft")
    .maybeSingle();

  if (error) throw error;
  const tender = tenderData as TenderRow | null;
  if (!tender) return { tender: null, documents: [], relatedTenders: [] };

  const [documentsResult, relatedResult] = await Promise.all([
    admin
      .from("tender_documents")
      .select("*")
      .eq("tender_id", tender.id)
      .order("created_at", { ascending: false }),
    admin
      .from("tenders")
      .select("*")
      .neq("status", "draft")
      .order("closing_date", { ascending: true })
      .limit(5),
  ]);

  if (documentsResult.error) throw documentsResult.error;
  if (relatedResult.error) throw relatedResult.error;

  return {
    tender,
    documents: documentsResult.data ?? [],
    relatedTenders: relatedResult.data ?? [],
  };
});

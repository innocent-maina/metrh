import { getRouterParam } from "h3";
import { supabaseAdmin } from "~~/server/utils/supabase-admin";

type TenderRow = {
  id: string;
  [key: string]: unknown;
};

export default defineEventHandler(async (event) => {
  const rawSlug = String(getRouterParam(event, "slug") ?? "");
  const admin = supabaseAdmin();

  const { data: exactTender, error: exactError } = await admin
    .from("tenders")
    .select("*")
    .eq("slug", rawSlug)
    .neq("status", "draft")
    .maybeSingle();

  if (exactError) throw exactError;

  let tender = exactTender as TenderRow | null;

  if (!tender && rawSlug.trim()) {
    const { data: tenderRows, error: listError } = await admin
      .from("tenders")
      .select("*")
      .neq("status", "draft")
      .order("closing_date", { ascending: true });

    if (listError) throw listError;

    const normalizedSlug = rawSlug.trim().toLowerCase();
    tender =
      ((tenderRows ?? []) as TenderRow[]).find(
        (row) => String(row.slug ?? "").trim().toLowerCase() === normalizedSlug,
      ) ?? null;
  }

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

import { getRouterParam } from "h3";
import { supabaseAdmin } from "~~/server/utils/supabase-admin";

type ServiceRow = {
  id: string;
  category_id: string;
  [key: string]: unknown;
};

function normalizeRouteSlug(value: string) {
  try {
    return decodeURIComponent(value).trim();
  } catch {
    return value.trim();
  }
}

export default defineEventHandler(async (event) => {
  const rawSlug = String(getRouterParam(event, "slug") ?? "");
  const requestSlug = normalizeRouteSlug(rawSlug);
  const admin = supabaseAdmin();

  const { data: exactService, error: exactError } = await admin
    .from("services")
    .select("*")
    .eq("slug", requestSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (exactError) throw exactError;

  let service = exactService as ServiceRow | null;

  if (!service && requestSlug) {
    const { data: serviceRows, error: listError } = await admin
      .from("services")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (listError) throw listError;

    const normalizedSlug = requestSlug.toLowerCase();
    service =
      ((serviceRows ?? []) as ServiceRow[]).find(
        (row) => String(row.slug ?? "").trim().toLowerCase() === normalizedSlug,
      ) ?? null;
  }

  if (!service) return { service: null, category: null, relatedServices: [] };

  const [categoryResult, relatedResult] = await Promise.all([
    admin
      .from("service_categories")
      .select("*")
      .eq("id", service.category_id)
      .maybeSingle(),
    admin
      .from("services")
      .select("*")
      .eq("category_id", service.category_id)
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("name", { ascending: true })
      .limit(6),
  ]);

  if (categoryResult.error) throw categoryResult.error;
  if (relatedResult.error) throw relatedResult.error;

  return {
    service,
    category: categoryResult.data ?? null,
    relatedServices: relatedResult.data ?? [],
  };
});

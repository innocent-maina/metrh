import { getRouterParam } from "h3";
import { supabaseAdmin } from "~~/server/utils/supabase-admin";

type ServiceRow = {
  id: string;
  category_id: string;
  [key: string]: unknown;
};

export default defineEventHandler(async (event) => {
  const slug = String(getRouterParam(event, "slug") ?? "");
  const admin = supabaseAdmin();

  const { data: serviceData, error } = await admin
    .from("services")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  const service = serviceData as ServiceRow | null;
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

import { supabaseAdmin } from "~~/server/utils/supabase-admin";

export default defineEventHandler(async () => {
  const admin = supabaseAdmin();

  const [categoriesResult, servicesResult, scheduleResult] = await Promise.all([
    admin
      .from("service_categories")
      .select("*")
      .order("display_order", { ascending: true })
      .order("name", { ascending: true }),
    admin
      .from("services")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("name", { ascending: true }),
    admin
      .from("clinic_schedule")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: true }),
  ]);

  if (categoriesResult.error) throw categoriesResult.error;
  if (servicesResult.error) throw servicesResult.error;
  if (scheduleResult.error) throw scheduleResult.error;

  return {
    categories: categoriesResult.data ?? [],
    services: servicesResult.data ?? [],
    clinicSchedule: scheduleResult.data ?? [],
  };
});

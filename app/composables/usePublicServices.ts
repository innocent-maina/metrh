import type { Database, DayOfWeek } from "~~/types/database.types";

export interface PublicServiceItem {
  name: string;
  slug: string;
  summary: string | null;
  isSpecialized: boolean;
}

export interface PublicServiceGroup {
  name: string;
  slug: string;
  icon: string;
  services: PublicServiceItem[];
}

export interface PublicClinicSession {
  day: DayOfWeek;
  dayLabel: string;
  clinics: string[];
}

type ServiceCategoryRow =
  Database["public"]["Tables"]["service_categories"]["Row"];
type ServiceRow = Database["public"]["Tables"]["services"]["Row"];
type ClinicScheduleRow =
  Database["public"]["Tables"]["clinic_schedule"]["Row"];

const fallbackIcon = "lucide:stethoscope";
const dayOrder: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

function formatDayLabel(day: DayOfWeek) {
  return day.charAt(0).toUpperCase() + day.slice(1);
}

function normalizeServiceSlug(slug: string) {
  return slug.trim();
}

function buildServiceGroups(
  categories: ServiceCategoryRow[],
  services: ServiceRow[],
) {
  const groups = new Map<string, PublicServiceGroup & { order: number }>();

  for (const category of categories) {
    groups.set(category.id, {
      name: category.name,
      slug: category.slug,
      icon: category.icon ?? fallbackIcon,
      services: [],
      order: category.display_order,
    });
  }

  for (const service of services) {
    const group = groups.get(service.category_id);
    if (!group) continue;

    group.services.push({
      name: service.name,
      slug: normalizeServiceSlug(service.slug),
      summary: service.summary,
      isSpecialized: service.is_specialized,
    });
  }

  return [...groups.values()]
    .filter((group) => group.services.length > 0)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
    .map(({ order: _order, ...group }) => ({
      ...group,
      services: group.services.sort(
        (a, b) => a.name.localeCompare(b.name) || a.slug.localeCompare(b.slug),
      ),
    }));
}

function buildClinicSchedule(rows: ClinicScheduleRow[]): PublicClinicSession[] {
  const grouped = new Map<DayOfWeek, string[]>();

  for (const day of dayOrder) {
    grouped.set(day, []);
  }

  const sortedRows = [...rows].sort((a, b) => {
    const dayDiff = dayOrder.indexOf(a.day_of_week) - dayOrder.indexOf(b.day_of_week);
    if (dayDiff !== 0) return dayDiff;
    return a.created_at.localeCompare(b.created_at);
  });

  for (const row of sortedRows) {
    const clinics = grouped.get(row.day_of_week);
    if (!clinics) continue;
    clinics.push(row.clinic_name);
  }

  return dayOrder
    .map((day) => ({
      day,
      dayLabel: formatDayLabel(day),
      clinics: grouped.get(day) ?? [],
    }))
    .filter((row) => row.clinics.length > 0);
}

function emptyServicesData() {
  return {
    serviceGroups: [] as PublicServiceGroup[],
    clinicSchedule: [] as PublicClinicSession[],
    totalServices: 0,
    totalCategories: 0,
  };
}

export function usePublicServices() {
  return useAsyncData("public-services", async () => {
    try {
      const response = await $fetch<{
        categories: ServiceCategoryRow[];
        services: ServiceRow[];
        clinicSchedule: ClinicScheduleRow[];
      }>("/api/public/services");

      const categories = response.categories ?? [];
      const services = response.services ?? [];
      const schedule = response.clinicSchedule ?? [];

      return {
        serviceGroups: buildServiceGroups(categories, services),
        clinicSchedule: buildClinicSchedule(schedule),
        totalServices: services.length,
        totalCategories: categories.length,
      };
    } catch (error) {
      console.warn("[services] Failed to load public services from Supabase.", error);
      return emptyServicesData();
    }
  });
}

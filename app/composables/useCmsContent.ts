import type { Database } from "~~/types/database.types";

export interface SiteSettingsContent {
  id: boolean;
  emergency_line: string | null;
  main_phone: string | null;
  main_email: string | null;
  physical_address: string | null;
  postal_address: string | null;
  visiting_hours: Array<{ label: string; start: string; end: string }> | null;
  social_links: Record<string, string> | null;
  homepage_hero:
    | {
        headline: string;
        subhead: string;
        cta_label: string;
        cta_href: string;
        image_url: string;
      }
    | null;
  whatsapp_label: string | null;
  whatsapp_href: string | null;
  emergency_label: string | null;
  emergency_href: string | null;
  updated_by: string | null;
  updated_at: string;
}

export interface CmsPageContent {
  id: string;
  slug: string;
  title: string;
  content: string;
  seo_title: string | null;
  seo_description: string | null;
  status: Database["public"]["Enums"]["publish_status"];
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CmsSectionContent {
  id: string;
  page_slug: string;
  section_key: string;
  section_type: string;
  eyebrow: string | null;
  title: string;
  summary: string | null;
  body: string | null;
  image_url: string | null;
  image_alt: string | null;
  cta_label: string | null;
  cta_href: string | null;
  display_order: number;
  is_active: boolean;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CmsSectionItemContent {
  id: string;
  section_id: string;
  title: string;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  image_alt: string | null;
  cta_label: string | null;
  cta_href: string | null;
  display_order: number;
  is_active: boolean;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CmsSlideContent {
  id: string;
  page_slug: string;
  section_key: string;
  eyebrow: string | null;
  title: string;
  body: string;
  cta_label: string | null;
  cta_href: string | null;
  image_url: string;
  image_alt: string | null;
  caption: string | null;
  display_order: number;
  is_active: boolean;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CmsPageBundle {
  sections: CmsSectionContent[];
  sectionsByKey: Record<string, CmsSectionContent>;
  itemsBySectionId: Record<string, CmsSectionItemContent[]>;
}

function defaultSiteSettings(): SiteSettingsContent {
  return {
    id: true,
    emergency_line: "0711-207623",
    main_phone: null,
    main_email: null,
    physical_address: "Meru–Nanyuki Road, Telkom Ltd junction, Meru Town",
    postal_address: "P.O. Box 8 – 60200, Meru",
    visiting_hours: [
      { label: "Morning", start: "6:00 AM", end: "7:00 AM" },
      { label: "Lunch", start: "12:30 PM", end: "2:00 PM" },
      { label: "Evening", start: "4:30 PM", end: "5:30 PM" },
    ],
    social_links: {
      facebook: "https://facebook.com/MeTRH.Hospital",
      x: "https://x.com/MeTRH_Hospital",
    },
    homepage_hero: {
      headline: "Compassionate public care, every day.",
      subhead:
        "Meru Teaching and Referral Hospital serves Upper Eastern Kenya with emergency care, specialist clinics, surgery, diagnostics, and teaching-led service delivery.",
      cta_label: "Explore services",
      cta_href: "/services",
      image_url: "/welcome.jpg",
    },
    whatsapp_label: "Chat on WhatsApp",
    whatsapp_href:
      "https://wa.me/254711207623?text=Hello%20MeTRH%2C%20I%20would%20like%20to%20ask%20about%20the%20hospital%20services.",
    emergency_label: "Emergency line",
    emergency_href: "tel:0711207623",
    updated_by: null,
    updated_at: "",
  };
}

export function resolveContentMediaUrl(value: string | null) {
  const resolvePublicUrl = usePublicStorageUrl();
  return resolvePublicUrl(value, "media");
}

export function useSiteSettings() {
  return useAsyncData<SiteSettingsContent>(
    "cms-site-settings",
    async () => {
    try {
      const response = await $fetch<{ settings: SiteSettingsContent | null }>(
        "/api/public/cms/site-settings",
      );

      return response.settings ?? defaultSiteSettings();
    } catch (error) {
      console.warn("[cms] Failed to load site settings.", error);
      return defaultSiteSettings();
    }
    },
    { default: defaultSiteSettings },
  );
}

export function useCmsPage(slug: string, fallback?: CmsPageContent) {
  return useAsyncData<CmsPageContent | null>(
    `cms-page-${slug}`,
    async () => {
    try {
      const response = await $fetch<{ page: CmsPageContent | null }>(
        `/api/public/cms/pages/${slug}`,
      );
      return response.page ?? fallback ?? null;
    } catch (error) {
      console.warn(`[cms] Failed to load page "${slug}".`, error);
      return fallback ?? null;
    }
    },
    { default: () => fallback ?? null },
  );
}

export function usePageContent(pageSlug: string) {
  const emptyBundle: CmsPageBundle = {
    sections: [],
    sectionsByKey: {},
    itemsBySectionId: {},
  };

  return useAsyncData<CmsPageBundle>(
    `cms-page-content-${pageSlug}`,
    async () => {
    try {
      const response = await $fetch<{
        sections: CmsSectionContent[];
        items: CmsSectionItemContent[];
      }>(`/api/public/cms/pages/${pageSlug}/content`);
      const sections = response.sections ?? [];
      const items = response.items ?? [];

      const itemsBySectionId = items.reduce<Record<string, CmsSectionItemContent[]>>(
        (acc, item) => {
          acc[item.section_id] = [...(acc[item.section_id] ?? []), item];
          return acc;
        },
        {},
      );

      return {
        sections,
        sectionsByKey: sections.reduce<Record<string, CmsSectionContent>>(
          (acc, section) => {
            acc[section.section_key] = section;
            return acc;
          },
          {},
        ),
        itemsBySectionId,
      };
    } catch (error) {
      console.warn(`[cms] Failed to load page content for "${pageSlug}".`, error);
      return emptyBundle;
    }
    },
    { default: () => emptyBundle },
  );
}

export function usePageSlides(pageSlug = "home", sectionKey = "hero") {
  return useAsyncData<CmsSlideContent[]>(
    `cms-page-slides-${pageSlug}-${sectionKey}`,
    async () => {
    try {
      const response = await $fetch<{ slides: CmsSlideContent[] }>(
        `/api/public/cms/pages/${pageSlug}/slides`,
        {
          query: { sectionKey },
        },
      );
      return response.slides ?? [];
    } catch (error) {
      console.warn(`[cms] Failed to load slides for "${pageSlug}/${sectionKey}".`, error);
      return [];
    }
    },
    { default: () => [] as CmsSlideContent[] },
  );
}

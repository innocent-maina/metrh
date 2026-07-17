<script setup lang="ts">
import type { Database } from "~~/types/database.types";
import { richTextToHtml, richTextToPlainText } from "~~/shared/rich-text";

definePageMeta({ layout: "default" });

const route = useRoute();
const slug = computed(() => String(route.params.slug ?? ""));
const supabase = useSupabaseClient<Database>();
const runtimeConfig = useRuntimeConfig();
const serviceImages = useHospitalMedia();
const fallbackServiceImage = computed(() => serviceImages.value[0]?.src ?? "");

type ServiceRow = Database["public"]["Tables"]["services"]["Row"];
type ServiceCategoryRow = Database["public"]["Tables"]["service_categories"]["Row"];

interface RelatedServiceItem {
  slug: string;
  name: string;
  summary: string;
  isSpecialized: boolean;
}

interface ServiceDetail {
  id: string;
  slug: string;
  name: string;
  summary: string;
  bodyHtml: string;
  categoryName: string;
  categoryLink: string;
  categoryIcon: string;
  categoryDescription: string | null;
  heroImageUrl: string;
  heroImageAlt: string;
  ctaLabel: string | null;
  ctaHref: string;
  isSpecialized: boolean;
}

interface ServicePageData {
  service: ServiceDetail;
  relatedServices: RelatedServiceItem[];
}

function summarize(text: string | null | undefined, fallback: string | null | undefined = "") {
  const source = richTextToPlainText(text ?? fallback).trim();
  if (!source) return "";

  const collapsed = source.replace(/\s+/g, " ");
  return collapsed.length > 220
    ? `${collapsed.slice(0, 217).trimEnd()}...`
    : collapsed;
}

function isWebExternalHref(value: string) {
  return /^https?:\/\//i.test(value);
}

function isInternalHref(value: string) {
  return value.startsWith("/");
}

function resolveServiceMediaUrl(value: string | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (
    raw.startsWith("/") ||
    /^https?:\/\//i.test(raw) ||
    raw.startsWith("data:")
  ) {
    return raw;
  }

  return supabase.storage.from("media").getPublicUrl(raw).data.publicUrl;
}

const { data: serviceData } = await useAsyncData<ServicePageData | null>(
  () => `public-service-${slug.value}`,
  async () => {
    const currentSlug = slug.value;

    try {
      const { data: serviceRow, error } = await supabase
        .from("services")
        .select(
          "id,category_id,name,slug,summary,description,cover_image_url,cover_image_alt,cta_label,cta_href,is_specialized,display_order,is_active,created_at,updated_at",
        )
        .eq("slug", currentSlug)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;

      const service = serviceRow as ServiceRow | null;
      if (!service) return null;

      const [categoryResult, relatedResult] = await Promise.all([
        supabase
          .from("service_categories")
          .select("id,name,slug,icon,description,display_order")
          .eq("id", service.category_id)
          .maybeSingle(),
        supabase
          .from("services")
          .select(
            "id,category_id,name,slug,summary,description,cover_image_url,cover_image_alt,cta_label,cta_href,is_specialized,display_order,is_active,created_at,updated_at",
          )
          .eq("category_id", service.category_id)
          .eq("is_active", true)
          .order("display_order", { ascending: true })
          .order("name", { ascending: true })
          .limit(6),
      ]);

      if (categoryResult.error) throw categoryResult.error;
      if (relatedResult.error) throw relatedResult.error;

      const category = (categoryResult.data as ServiceCategoryRow | null) ?? null;
      const relatedRows = (relatedResult.data ?? []) as ServiceRow[];
      const heroImageUrl =
        resolveServiceMediaUrl(service.cover_image_url) || fallbackServiceImage.value;

      return {
        service: {
          id: service.id,
          slug: service.slug,
          name: service.name,
          summary: summarize(service.summary, service.description),
          bodyHtml: richTextToHtml(service.description),
          categoryName: category?.name ?? "Services",
          categoryLink: category?.slug ? `/services#${category.slug}` : "/services",
          categoryIcon: category?.icon ?? "lucide:stethoscope",
          categoryDescription: category?.description ?? null,
          heroImageUrl,
          heroImageAlt: service.cover_image_alt || service.name,
          ctaLabel: service.cta_label,
          ctaHref: String(service.cta_href ?? "").trim(),
          isSpecialized: service.is_specialized,
        },
        relatedServices: relatedRows
          .filter((entry) => entry.slug !== currentSlug)
          .slice(0, 3)
          .map((entry) => ({
            slug: entry.slug,
            name: entry.name,
            summary: summarize(entry.summary, entry.description),
            isSpecialized: entry.is_specialized,
          })),
      };
    } catch (error) {
      console.warn("[services] Could not load service detail.", error);
      return null;
    }
  },
  { watch: [slug] },
);

const service = computed(() => serviceData.value?.service ?? null);
const relatedServices = computed(() => serviceData.value?.relatedServices ?? []);
const seoImageUrl = computed(() => {
  const raw = service.value?.heroImageUrl ?? "";
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) {
    return `${runtimeConfig.public.siteUrl.replace(/\/$/, "")}${raw}`;
  }
  return raw;
});

if (!service.value) {
  throw createError({ statusCode: 404, statusMessage: "Service not found." });
}

useSeoMeta({
  title: () => `${service.value?.name ?? "Service"} — MeTRH`,
  description: () =>
    service.value?.summary ??
    service.value?.categoryDescription ??
    "Service details at Meru Teaching and Referral Hospital.",
  ogTitle: () => `${service.value?.name ?? "Service"} — MeTRH`,
  ogDescription: () =>
    service.value?.summary ??
    service.value?.categoryDescription ??
    "Service details at Meru Teaching and Referral Hospital.",
  ogImage: () => seoImageUrl.value,
  twitterCard: "summary_large_image",
  twitterTitle: () => `${service.value?.name ?? "Service"} — MeTRH`,
  twitterDescription: () =>
    service.value?.summary ??
    service.value?.categoryDescription ??
    "Service details at Meru Teaching and Referral Hospital.",
  twitterImage: () => seoImageUrl.value,
});
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">
    <div class="mb-8">
      <NuxtLink
        to="/services"
        class="inline-flex items-center gap-1 text-small font-semibold text-primary hover:underline"
      >
        <Icon name="lucide:arrow-left" class="size-4" />
        Back to services
      </NuxtLink>
    </div>

    <div v-if="service" class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <article class="rounded-card border border-border bg-surface p-6 md:p-8 shadow-card">
        <div class="flex flex-wrap items-center gap-3">
          <NuxtLink
            :to="service.categoryLink"
            class="inline-flex items-center gap-2 rounded-full bg-surface-alt px-3 py-1.5 text-caption font-semibold uppercase tracking-wide text-info hover:bg-surface"
          >
            <Icon :name="service.categoryIcon" class="size-4" aria-hidden="true" />
            {{ service.categoryName }}
          </NuxtLink>
          <span
            v-if="service.isSpecialized"
            class="rounded-full bg-accent/10 px-3 py-1.5 text-caption font-semibold uppercase tracking-wide text-accent"
          >
            Specialized
          </span>
        </div>

        <h1 class="mt-4 font-display font-bold text-h1 text-ink">
          {{ service.name }}
        </h1>
        <p class="mt-3 text-body text-ink-muted">
          {{ service.summary || "Service details and guidance for patients, families, and referrers." }}
        </p>

        <div v-if="service.heroImageUrl" class="mt-6 overflow-hidden rounded-card border border-border bg-surface-alt">
          <img
            :src="service.heroImageUrl"
            :alt="service.heroImageAlt"
            loading="eager"
            fetchpriority="high"
            class="aspect-[16/9] w-full object-cover"
          />
        </div>

        <div class="mt-6 flex flex-wrap items-center gap-3">
          <NuxtLink
            to="/contact"
            class="inline-flex items-center gap-1 rounded-control bg-primary px-4 py-2.5 text-small font-semibold text-white hover:bg-primary-dark"
          >
            Contact MeTRH
            <Icon name="lucide:arrow-right" class="size-4" />
          </NuxtLink>

          <NuxtLink
            :to="service.categoryLink"
            class="inline-flex items-center gap-1 rounded-control border border-border px-4 py-2.5 text-small font-semibold text-ink hover:bg-surface-alt"
          >
            More in {{ service.categoryName }}
          </NuxtLink>

          <NuxtLink
            v-if="service.ctaLabel && service.ctaHref && isInternalHref(service.ctaHref)"
            :to="service.ctaHref"
            class="inline-flex items-center gap-1 rounded-control border border-primary/30 px-4 py-2.5 text-small font-semibold text-primary hover:bg-primary/5"
          >
            {{ service.ctaLabel }}
            <Icon name="lucide:arrow-right" class="size-4" />
          </NuxtLink>
          <a
            v-else-if="service.ctaLabel && service.ctaHref"
            :href="service.ctaHref"
            class="inline-flex items-center gap-1 rounded-control border border-primary/30 px-4 py-2.5 text-small font-semibold text-primary hover:bg-primary/5"
            :target="isWebExternalHref(service.ctaHref) ? '_blank' : undefined"
            :rel="isWebExternalHref(service.ctaHref) ? 'noreferrer noopener' : undefined"
          >
            {{ service.ctaLabel }}
            <Icon name="lucide:external-link" class="size-4" />
          </a>
        </div>

        <div
          v-if="service.categoryDescription"
          class="mt-6 rounded-card border border-border bg-surface-alt p-5 text-small text-ink-muted whitespace-pre-line"
        >
          {{ service.categoryDescription }}
        </div>

        <div
          v-if="service.bodyHtml"
          class="service-content mt-8 rounded-card bg-surface-alt p-5 text-body text-ink"
          v-html="service.bodyHtml"
        />
        <div
          v-else
          class="mt-8 rounded-card bg-surface-alt p-5 text-small text-ink-muted"
        >
          Detailed service information has not been added yet. Use the contact
          page for current guidance, referrals, and directions.
        </div>
      </article>

      <aside class="space-y-4">
        <div class="rounded-card border border-border bg-surface p-5">
          <p class="text-small font-semibold uppercase tracking-wide text-info">
            Need help fast?
          </p>
          <p class="mt-3 text-small text-ink-muted">
            Use the contact page for directions, referrals, and general enquiries.
          </p>
          <NuxtLink
            to="/contact"
            class="mt-4 inline-flex items-center gap-1 text-small font-semibold text-primary hover:underline"
          >
            Contact MeTRH
            <Icon name="lucide:arrow-right" class="size-4" />
          </NuxtLink>
        </div>

        <div v-if="relatedServices.length" class="rounded-card border border-border bg-surface p-5">
          <p class="text-small font-semibold uppercase tracking-wide text-info">
            More in {{ service.categoryName }}
          </p>
          <ul class="mt-4 space-y-3">
            <li v-for="item in relatedServices" :key="item.slug">
              <NuxtLink
                :to="`/services/${item.slug}`"
                class="block rounded-control border border-border px-3 py-2.5 hover:border-primary/30 hover:bg-surface-alt"
              >
                <div class="flex items-center gap-2">
                  <span
                    v-if="item.isSpecialized"
                    class="rounded-full bg-accent/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-accent"
                  >
                    Specialized
                  </span>
                </div>
                <p class="mt-1 text-small font-medium text-ink">
                  {{ item.name }}
                </p>
                <p v-if="item.summary" class="mt-1 text-caption text-ink-muted">
                  {{ item.summary }}
                </p>
              </NuxtLink>
            </li>
          </ul>
        </div>

        <div class="rounded-card border border-border bg-primary-dark p-5 text-white">
          <p class="text-small font-semibold uppercase tracking-wide text-accent">
            Service pages
          </p>
          <p class="mt-3 text-small text-white/80">
            This page can now carry long-form service copy, image headers, and direct links for patients and referrers.
          </p>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.service-content :deep(h2) {
  margin-top: 1.75rem;
  margin-bottom: 0.75rem;
  font-size: var(--text-h2);
  line-height: var(--text-h2--line-height);
}

.service-content :deep(h3) {
  margin-top: 1.5rem;
  margin-bottom: 0.6rem;
  font-size: var(--text-h3);
  line-height: var(--text-h3--line-height);
}

.service-content :deep(h4) {
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
  font-size: var(--text-h4);
  line-height: var(--text-h4--line-height);
}

.service-content :deep(p) {
  margin-bottom: 1rem;
  color: var(--color-ink-muted);
}

.service-content :deep(div) {
  margin-bottom: 1rem;
  color: var(--color-ink-muted);
}

.service-content :deep(ul),
.service-content :deep(ol) {
  margin-bottom: 1rem;
  padding-left: 1.5rem;
  color: var(--color-ink-muted);
}

.service-content :deep(ul) {
  list-style: disc;
}

.service-content :deep(ol) {
  list-style: decimal;
}

.service-content :deep(li) {
  margin-bottom: 0.5rem;
}

.service-content :deep(blockquote) {
  margin: 1.25rem 0;
  border-left: 3px solid var(--color-accent);
  padding-left: 1rem;
  color: var(--color-ink);
  font-style: italic;
}

.service-content :deep(a) {
  color: var(--color-primary);
  text-decoration: underline;
}

.service-content :deep(strong),
.service-content :deep(b) {
  color: var(--color-ink);
  font-weight: 700;
}

.service-content :deep(code) {
  border-radius: 0.25rem;
  background: var(--color-surface);
  padding: 0.1rem 0.25rem;
  font-size: 0.92em;
}

.service-content :deep(pre) {
  margin: 1rem 0;
  overflow-x: auto;
  border-radius: 0.5rem;
  background: var(--color-primary-dark);
  color: white;
  padding: 1rem;
}

.service-content :deep(hr) {
  margin: 1.5rem 0;
  border: 0;
  border-top: 1px solid var(--color-border);
}
</style>

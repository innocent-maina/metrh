<script setup lang="ts">
import type { Database } from "~~/types/database.types";
import { richTextToHtml, richTextToPlainText } from "~~/shared/rich-text";

definePageMeta({ layout: "default" });

type ServiceRow = Database["public"]["Tables"]["services"]["Row"];
type ServiceCategoryRow =
  Database["public"]["Tables"]["service_categories"]["Row"];

interface ServiceDetailResponse {
  service: ServiceRow | null;
  category: ServiceCategoryRow | null;
  relatedServices: ServiceRow[];
}

interface ServiceView {
  id: string;
  slug: string;
  name: string;
  summary: string;
  bodyHtml: string;
  categoryName: string;
  categorySlug: string;
  categoryIcon: string;
  categoryDescription: string;
  heroImageUrl: string;
  heroImageAlt: string;
  ctaLabel: string;
  ctaHref: string;
  isSpecialized: boolean;
}

interface RelatedServiceView {
  slug: string;
  name: string;
  summary: string;
  isSpecialized: boolean;
}

const route = useRoute();
const runtimeConfig = useRuntimeConfig();
const resolveMediaUrl = usePublicStorageUrl();
const serviceImages = useHospitalMedia();
const fallbackServiceImage = computed(() => serviceImages.value[0]?.src ?? "");

const routeSlug = computed(() => {
  const raw = route.params.slug;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return decodeURIComponent(String(value ?? "")).trim();
});

const {
  data: detailData,
  error: detailError,
  pending: detailPending,
} = await useAsyncData<ServiceDetailResponse | null>(
  () => `public-service-detail-${routeSlug.value}`,
  async () => {
    if (!routeSlug.value) return null;

    return await $fetch<ServiceDetailResponse>(
      `/api/public/services/${encodeURIComponent(routeSlug.value)}`,
    );
  },
  { watch: [routeSlug] },
);

function normalizeSlug(value: string) {
  return value.trim().toLowerCase();
}

function servicePath(slug: string) {
  return `/services/${encodeURIComponent(slug.trim())}`;
}

function plainText(value: string | null | undefined) {
  return richTextToPlainText(value ?? "").replace(/\s+/g, " ").trim();
}

function summarize(
  value: string | null | undefined,
  fallback: string | null | undefined = "",
) {
  const source = plainText(value) || plainText(fallback);
  if (!source) return "";

  return source.length > 220
    ? `${source.slice(0, 217).trimEnd()}...`
    : source;
}

function isWebExternalHref(value: string) {
  return /^https?:\/\//i.test(value);
}

function isInternalHref(value: string) {
  return value.startsWith("/");
}

function resolveServiceMediaUrl(value: string | null) {
  return resolveMediaUrl(value, "media");
}

const detailService = computed(() => detailData.value?.service ?? null);
const detailCategory = computed(() => detailData.value?.category ?? null);

const service = computed<ServiceView | null>(() => {
  const row = detailService.value;

  if (!row) return null;

  const category = detailCategory.value;
  const heroImageUrl =
    resolveServiceMediaUrl(row.cover_image_url) || fallbackServiceImage.value;

  return {
    id: row.id,
    slug: row.slug.trim(),
    name: row.name,
    summary: summarize(row.summary, row.description),
    bodyHtml: richTextToHtml(row.description),
    categoryName: category?.name ?? "Services",
    categorySlug: category?.slug ?? "",
    categoryIcon: category?.icon ?? "lucide:stethoscope",
    categoryDescription: category?.description ?? "",
    heroImageUrl,
    heroImageAlt: row.cover_image_alt || row.name,
    ctaLabel: row.cta_label ?? "",
    ctaHref: String(row.cta_href ?? "").trim(),
    isSpecialized: row.is_specialized,
  };
});

const relatedServices = computed<RelatedServiceView[]>(() => {
  const currentSlug = normalizeSlug(service.value?.slug ?? routeSlug.value);
  const detailRelated = detailData.value?.relatedServices ?? [];

  if (detailRelated.length) {
    return detailRelated
      .filter((item) => normalizeSlug(item.slug) !== currentSlug)
      .slice(0, 4)
      .map((item) => ({
        slug: item.slug.trim(),
        name: item.name,
        summary: summarize(item.summary, item.description),
        isSpecialized: item.is_specialized,
      }));
  }

  return [];
});

const isLoadingService = computed(() => detailPending.value && !service.value);

const detailErrorMessage = computed(() =>
  detailError.value
    ? "The service detail could not be loaded from the database right now."
    : "This service link is unavailable or has been renamed.",
);

const categoryLink = computed(() =>
  service.value?.categorySlug ? `/services#${service.value.categorySlug}` : "/services",
);

const seoImageUrl = computed(() => {
  const raw = service.value?.heroImageUrl ?? "";
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) {
    return `${runtimeConfig.public.siteUrl.replace(/\/$/, "")}${raw}`;
  }
  return raw;
});

useSeoMeta({
  title: () => `${service.value?.name ?? "Service"} — MeTRH`,
  description: () =>
    service.value?.summary ??
    "Service details at Meru Teaching and Referral Hospital.",
  ogTitle: () => `${service.value?.name ?? "Service"} — MeTRH`,
  ogDescription: () =>
    service.value?.summary ??
    "Service details at Meru Teaching and Referral Hospital.",
  ogImage: () => seoImageUrl.value,
  twitterCard: "summary_large_image",
  twitterTitle: () => `${service.value?.name ?? "Service"} — MeTRH`,
  twitterDescription: () =>
    service.value?.summary ??
    "Service details at Meru Teaching and Referral Hospital.",
  twitterImage: () => seoImageUrl.value,
});
</script>

<template>
  <main v-if="service" class="bg-surface">
    <section class="border-b border-border bg-surface-alt">
      <div class="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:py-14 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8 lg:items-center">
        <div>
          <NuxtLink
            to="/services"
            class="inline-flex items-center gap-1 text-small font-semibold text-primary hover:underline"
          >
            <Icon name="lucide:arrow-left" class="size-4" />
            Back to services
          </NuxtLink>

          <div class="mt-6 flex flex-wrap items-center gap-2">
            <NuxtLink
              :to="categoryLink"
              class="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-caption font-semibold uppercase tracking-wide text-info ring-1 ring-border hover:bg-surface"
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

          <h1 class="mt-4 max-w-4xl font-display font-bold text-h1 text-ink">
            {{ service.name }}
          </h1>
          <p class="mt-4 max-w-3xl text-body text-ink-muted">
            {{ service.summary }}
          </p>

          <div class="mt-7 flex flex-wrap gap-3">
            <NuxtLink
              to="/contact"
              class="inline-flex items-center gap-1 rounded-control bg-primary px-5 py-3 text-small font-semibold text-white hover:bg-primary-dark"
            >
              Contact MeTRH
              <Icon name="lucide:arrow-right" class="size-4" />
            </NuxtLink>
            <NuxtLink
              :to="categoryLink"
              class="inline-flex items-center gap-1 rounded-control border border-border bg-surface px-5 py-3 text-small font-semibold text-ink hover:bg-white"
            >
              More in {{ service.categoryName }}
            </NuxtLink>
          </div>
        </div>

        <div class="overflow-hidden rounded-card border border-border bg-surface shadow-card">
          <img
            v-if="service.heroImageUrl"
            :src="service.heroImageUrl"
            :alt="service.heroImageAlt"
            loading="eager"
            fetchpriority="high"
            class="aspect-[4/3] w-full object-cover"
          />
          <div class="border-t border-border p-5">
            <p class="text-caption font-semibold uppercase tracking-wide text-ink-muted">
              Service area
            </p>
            <p class="mt-1 font-display text-h4 font-semibold text-ink">
              {{ service.categoryName }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:py-14 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
      <article class="space-y-6">
        <div class="rounded-card border border-border bg-surface p-6 shadow-card md:p-8">
          <div class="flex items-start gap-4">
            <span class="flex size-11 shrink-0 items-center justify-center rounded-control bg-primary/10 text-primary">
              <Icon name="lucide:clipboard-list" class="size-5" aria-hidden="true" />
            </span>
            <div>
              <p class="text-small font-semibold uppercase tracking-wide text-info">
                Overview
              </p>
              <h2 class="mt-1 font-display text-h3 font-semibold text-ink">
                What to expect
              </h2>
              <p class="mt-3 text-body text-ink-muted">
                {{ service.summary }}
              </p>
            </div>
          </div>
        </div>

        <div
          v-if="service.categoryDescription"
          class="rounded-card border border-border bg-surface p-6 text-body text-ink-muted shadow-card md:p-8"
        >
          <p class="text-small font-semibold uppercase tracking-wide text-info">
            Department context
          </p>
          <p class="mt-3 whitespace-pre-line">
            {{ service.categoryDescription }}
          </p>
        </div>

        <div class="rounded-card border border-border bg-surface p-6 shadow-card md:p-8">
          <p class="text-small font-semibold uppercase tracking-wide text-info">
            Service information
          </p>
          <div
            v-if="service.bodyHtml"
            class="service-content mt-5 text-body text-ink"
            v-html="service.bodyHtml"
          />
          <p v-else class="mt-4 text-body text-ink-muted">
            Detailed service information has not been added yet. Use the contact
            page for current guidance, referral questions, and directions.
          </p>
        </div>
      </article>

      <aside class="space-y-5 lg:sticky lg:top-24 lg:self-start">
        <div class="rounded-card border border-border bg-primary-dark p-5 text-white">
          <p class="text-small font-semibold uppercase tracking-wide text-accent">
            Need help?
          </p>
          <p class="mt-3 text-small text-white/80">
            Call or contact MeTRH for directions, referrals, and current clinic
            guidance before travelling.
          </p>
          <NuxtLink
            to="/contact"
            class="mt-5 inline-flex items-center gap-1 rounded-control bg-white px-4 py-2.5 text-small font-semibold text-primary-dark hover:bg-surface-alt"
          >
            Contact page
            <Icon name="lucide:arrow-right" class="size-4" />
          </NuxtLink>
        </div>

        <div
          v-if="service.ctaLabel && service.ctaHref"
          class="rounded-card border border-border bg-surface p-5 shadow-card"
        >
          <p class="text-small font-semibold uppercase tracking-wide text-info">
            Direct link
          </p>
          <NuxtLink
            v-if="isInternalHref(service.ctaHref)"
            :to="service.ctaHref"
            class="mt-4 inline-flex items-center gap-1 text-small font-semibold text-primary hover:underline"
          >
            {{ service.ctaLabel }}
            <Icon name="lucide:arrow-right" class="size-4" />
          </NuxtLink>
          <a
            v-else
            :href="service.ctaHref"
            class="mt-4 inline-flex items-center gap-1 text-small font-semibold text-primary hover:underline"
            :target="isWebExternalHref(service.ctaHref) ? '_blank' : undefined"
            :rel="isWebExternalHref(service.ctaHref) ? 'noreferrer noopener' : undefined"
          >
            {{ service.ctaLabel }}
            <Icon name="lucide:external-link" class="size-4" />
          </a>
        </div>

        <div v-if="relatedServices.length" class="rounded-card border border-border bg-surface p-5 shadow-card">
          <p class="text-small font-semibold uppercase tracking-wide text-info">
            Related services
          </p>
          <ul class="mt-4 space-y-3">
            <li v-for="item in relatedServices" :key="item.slug">
              <NuxtLink
                :to="servicePath(item.slug)"
                class="block rounded-control border border-border px-3 py-3 transition-colors hover:border-primary/30 hover:bg-surface-alt"
              >
                <div class="flex items-center justify-between gap-3">
                  <p class="text-small font-semibold text-ink">
                    {{ item.name }}
                  </p>
                  <Icon name="lucide:arrow-right" class="size-4 shrink-0 text-primary" />
                </div>
                <p v-if="item.summary" class="mt-1 text-caption text-ink-muted">
                  {{ item.summary }}
                </p>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </aside>
    </section>
  </main>

  <main
    v-else-if="isLoadingService"
    class="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6 md:py-20 lg:px-8"
  >
    <div class="rounded-card border border-border bg-surface p-8 shadow-card">
      <Icon
        name="lucide:loader-circle"
        class="mx-auto size-9 animate-spin text-primary"
        aria-hidden="true"
      />
      <h1 class="mt-4 font-display font-bold text-h2 text-ink">
        Loading service
      </h1>
      <p class="mt-3 text-body text-ink-muted">
        Fetching the latest service information from the database.
      </p>
    </div>
  </main>

  <main v-else class="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6 md:py-20 lg:px-8">
    <div class="rounded-card border border-border bg-surface p-8 shadow-card">
      <Icon
        name="lucide:stethoscope"
        class="mx-auto size-9 text-ink-muted"
        aria-hidden="true"
      />
      <h1 class="mt-4 font-display font-bold text-h2 text-ink">
        Service not found
      </h1>
      <p class="mt-3 text-body text-ink-muted">
        {{ detailErrorMessage }} Return to the current services catalog to open
        an active service page.
      </p>
      <NuxtLink
        to="/services"
        class="mt-6 inline-flex items-center gap-1 rounded-control bg-primary px-5 py-3 text-small font-semibold text-white hover:bg-primary-dark"
      >
        Back to services
        <Icon name="lucide:arrow-right" class="size-4" />
      </NuxtLink>
    </div>
  </main>
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

.service-content :deep(p),
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
  background: var(--color-surface-alt);
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

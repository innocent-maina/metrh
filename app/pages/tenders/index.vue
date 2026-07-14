<script setup lang="ts">
import type { Database } from "~~/types/database.types";

definePageMeta({ layout: "default" });

const supabase = useSupabaseClient<Database>();

useSeoMeta({
  title: "Tenders & Downloads — MeTRH",
  description:
    "Open tenders, procurement guidance, and downloadable documents for Meru Teaching and Referral Hospital.",
});

const search = ref("");
const activeFilter = ref<"all" | "open" | "closed" | "awarded">("all");
const statusOptions = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "Closed", value: "closed" },
  { label: "Awarded", value: "awarded" },
] as const;

type TenderRow = {
  id: string;
  tender_number: string;
  title: string;
  slug: string;
  category: string;
  description: string | null;
  status: "draft" | "open" | "closed" | "awarded" | "cancelled";
  opening_date: string | null;
  closing_date: string | null;
  awarded_to: string | null;
  created_at: string;
  updated_at: string;
};

type DownloadRow = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  file_url: string;
  file_size_kb: number | null;
  is_published: boolean;
  created_at: string;
};

type DownloadCard = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  fileSizeKb: number | null;
  downloadUrl: string | null;
};

function formatDateLabel(value: string | null | undefined) {
  if (!value) return "No closing date";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatTenderCategory(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const { data: tenderIndex } = await useAsyncData("public-tenders-index", async () => {
  try {
    const [tendersResult, downloadsResult] = await Promise.all([
      supabase
        .from("tenders")
        .select("id,tender_number,title,slug,category,description,status,opening_date,closing_date,awarded_to,created_at,updated_at")
        .neq("status", "draft")
        .order("closing_date", { ascending: true }),
      supabase
        .from("downloads")
        .select("id,title,description,category,file_url,file_size_kb,is_published,created_at")
        .eq("is_published", true)
        .order("created_at", { ascending: false }),
    ]);

    if (tendersResult.error) throw tendersResult.error;
    if (downloadsResult.error) throw downloadsResult.error;

    const tenderRows = (tendersResult.data ?? []) as TenderRow[];
    const downloadRows = (downloadsResult.data ?? []) as DownloadRow[];
    const downloadUrlMap = await fetchSignedDocumentUrls(
      downloadRows.map((download) => ({
        resource: "downloads",
        id: download.id,
      })),
    );

    const tenders = tenderRows.map((tender) => ({
      id: tender.id,
      tenderNumber: tender.tender_number,
      title: tender.title,
      slug: tender.slug,
      category: formatTenderCategory(tender.category),
      description: tender.description,
      status: tender.status,
      openingLabel: formatDateLabel(tender.opening_date),
      closingLabel: formatDateLabel(tender.closing_date),
      awardedTo: tender.awarded_to,
    }));

    const downloads = downloadRows.map((download) => ({
      id: download.id,
      title: download.title,
      description: download.description,
      category: download.category,
      fileSizeKb: download.file_size_kb,
      downloadUrl: downloadUrlMap.get(download.id) ?? null,
    }));

    return {
      tenders,
      downloads,
    };
  } catch (error) {
    console.warn("[tenders] Could not load public tenders.", error);
    return {
      tenders: [],
      downloads: [],
    };
  }
});

const tenders = computed(() => tenderIndex.value?.tenders ?? []);
const downloads = computed<DownloadCard[]>(() => tenderIndex.value?.downloads ?? []);

const filteredTenders = computed(() => {
  const term = search.value.trim().toLowerCase();

  return tenders.value.filter((tender) => {
    if (activeFilter.value !== "all" && tender.status !== activeFilter.value) {
      return false;
    }
    if (!term) return true;
    return (
      tender.tenderNumber.toLowerCase().includes(term) ||
      tender.title.toLowerCase().includes(term) ||
      tender.category.toLowerCase().includes(term) ||
      (tender.description?.toLowerCase().includes(term) ?? false)
    );
  });
});

const openTenderCount = computed(
  () => tenders.value.filter((tender) => tender.status === "open").length,
);
const downloadCount = computed(() => downloads.value.length);

const tenderImages = useHospitalMedia();
</script>

<template>
  <div>
    <section class="bg-surface">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div class="max-w-3xl">
          <p class="text-small font-semibold uppercase tracking-wide text-info">
            Tenders &amp; downloads
          </p>
          <h1 class="mt-2 font-display font-bold text-h1 text-ink">
            Procurement notices and downloadable documents
          </h1>
          <p class="mt-4 text-body text-ink-muted">
            This section is designed for open tender notices, registered
            supplier lists, and procurement PDFs. When nothing is live, the
            page says so plainly.
          </p>
        </div>
      </div>
    </section>

    <PageMediaStrip
      :items="tenderImages"
      title="Procurement visuals"
      subtitle="Planning, operations, and infrastructure imagery before the notice area."
      compact
    />

    <section class="border-y border-border bg-surface-alt">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside class="rounded-card border border-border bg-surface p-5 lg:sticky lg:top-24 lg:self-start">
            <label for="tender-search" class="block text-small font-medium text-ink">
              Search tenders
            </label>
            <div class="mt-2 flex items-center gap-2 rounded-control border border-border bg-surface px-3 py-2.5">
              <Icon name="lucide:search" class="size-4 text-ink-muted" aria-hidden="true" />
              <input
                id="tender-search"
                v-model="search"
                type="search"
                placeholder="Tender number or title"
                class="w-full bg-transparent text-small text-ink outline-none placeholder:text-ink-muted"
              />
            </div>

            <div class="mt-6">
              <p class="text-small font-semibold text-ink">Filter by status</p>
              <div class="mt-3 space-y-2">
                <button
                  v-for="option in statusOptions"
                  :key="option.value"
                  type="button"
                  class="w-full rounded-control border px-3 py-2 text-left text-small transition-colors"
                  :class="
                    activeFilter === option.value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-surface text-ink hover:border-primary/30 hover:bg-surface-alt'
                  "
                  @click="activeFilter = option.value"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>

            <div class="mt-6 rounded-card bg-surface-alt p-4">
              <p class="text-small font-semibold text-ink">Procurement note</p>
              <p class="mt-2 text-small text-ink-muted">
                Tender documents and supplier lists are published by the
                procurement team and downloaded through signed URLs.
              </p>
            </div>
          </aside>

          <div class="space-y-6">
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="rounded-card border border-border bg-surface p-5">
                <p class="text-caption font-semibold uppercase tracking-wide text-ink-muted">
                  Open tenders
                </p>
                <p class="mt-2 tabular-nums text-h2 text-primary">
                  {{ openTenderCount }}
                </p>
              </div>
              <div class="rounded-card border border-border bg-surface p-5">
                <p class="text-caption font-semibold uppercase tracking-wide text-ink-muted">
                  Downloads
                </p>
                <p class="mt-2 tabular-nums text-h2 text-primary">
                  {{ downloadCount }}
                </p>
              </div>
            </div>

            <div v-if="filteredTenders.length === 0" class="rounded-card border border-dashed border-border bg-surface p-10">
              <div class="max-w-xl">
                <p class="text-small font-semibold uppercase tracking-wide text-info">
                  No live items yet
                </p>
                <h2 class="mt-2 font-display font-semibold text-h3 text-ink">
                  Tender notices will appear here when procurement publishes them
                </h2>
                <p class="mt-3 text-small text-ink-muted">
                  This build has the route structure and security model in place,
                  but no public tender documents are available for the selected filter.
                </p>
                <NuxtLink
                  to="/contact"
                  class="mt-5 inline-flex items-center gap-1 text-small font-semibold text-primary hover:underline"
                >
                  Contact procurement
                  <Icon name="lucide:arrow-right" class="size-4" />
                </NuxtLink>
              </div>
            </div>

            <ul v-else class="grid gap-5">
              <li
                v-for="tender in filteredTenders"
                :key="tender.slug"
                class="rounded-card border border-border bg-surface p-5 shadow-card"
              >
                <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div class="max-w-3xl">
                    <p class="text-caption font-semibold uppercase tracking-wide text-accent">
                      {{ tender.tenderNumber }}
                    </p>
                    <h2 class="mt-2 font-display font-semibold text-h3 text-ink">
                      {{ tender.title }}
                    </h2>
                    <p class="mt-1 text-caption text-ink-muted">
                      {{ tender.category }} · Closing {{ tender.closingLabel }}
                    </p>
                    <p class="mt-3 text-small text-ink-muted">
                      {{ tender.description }}
                    </p>
                  </div>
                  <div class="flex items-center gap-2">
                    <span
                      class="rounded-full px-3 py-1.5 text-caption font-semibold uppercase tracking-wide"
                      :class="
                        tender.status === 'open'
                          ? 'bg-success/10 text-success'
                          : tender.status === 'awarded'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-surface-alt text-ink-muted'
                      "
                    >
                      {{ tender.status }}
                    </span>
                    <NuxtLink
                      :to="`/tenders/${tender.slug}`"
                      class="inline-flex items-center gap-1 text-small font-semibold text-primary hover:underline"
                    >
                      View details
                      <Icon name="lucide:arrow-right" class="size-4" />
                    </NuxtLink>
                  </div>
                </div>
              </li>
            </ul>

            <section class="rounded-card border border-border bg-surface p-5 md:p-6">
              <p class="text-small font-semibold uppercase tracking-wide text-info">
                Downloads
              </p>
              <div v-if="downloads.length" class="mt-4 grid gap-4 md:grid-cols-2">
                <component
                  v-for="download in downloads"
                  :key="download.id"
                  :is="download.downloadUrl ? 'a' : 'div'"
                  v-bind="
                    download.downloadUrl
                      ? {
                          href: download.downloadUrl,
                          target: '_blank',
                          rel: 'noreferrer noopener',
                        }
                      : {}
                  "
                  class="block rounded-card bg-surface-alt p-4 transition"
                  :class="
                    download.downloadUrl
                      ? 'group hover:bg-surface hover:shadow-sm'
                      : 'opacity-75'
                  "
                >
                  <p class="text-caption font-semibold uppercase tracking-wide text-ink-muted">
                    {{ download.category || "General" }}
                  </p>
                  <h3 class="mt-2 font-display font-semibold text-h4 text-ink">
                    {{ download.title }}
                  </h3>
                  <p v-if="download.description" class="mt-2 text-small text-ink-muted">
                    {{ download.description }}
                  </p>
                  <p class="mt-4 inline-flex items-center gap-1 text-small font-semibold text-primary">
                    {{ download.downloadUrl ? "Download file" : "File unavailable" }}
                    <Icon
                      :name="download.downloadUrl ? 'lucide:download' : 'lucide:alert-triangle'"
                      class="size-4"
                    />
                  </p>
                </component>
              </div>
              <div v-else class="mt-4 rounded-card bg-surface-alt p-6 text-small text-ink-muted">
                Supplier lists, policies, and tender attachments will be added
                here from the dashboard. When available, each document is served
                via a signed download URL.
              </div>
            </section>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

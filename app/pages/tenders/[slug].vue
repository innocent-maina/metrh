<script setup lang="ts">
definePageMeta({ layout: "default" });

const route = useRoute();
const slug = computed(() => String(route.params.slug ?? ""));

function formatDateLabel(value: string | null | undefined) {
  if (!value) return "Not listed";
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

type TenderDocumentRow = {
  id: string;
  tender_id: string;
  file_name: string;
  file_url: string;
  file_size_kb: number | null;
  created_at: string;
};

type TenderDocumentCard = {
  id: string;
  fileName: string;
  fileSizeKb: number | null;
  downloadUrl: string | null;
};

const { data: tenderData } = await useAsyncData(
  () => `public-tender-${slug.value}`,
  async () => {
  try {
    const response = await $fetch<{
      tender: TenderRow | null;
      documents: TenderDocumentRow[];
      relatedTenders: TenderRow[];
    }>(`/api/public/tenders/${slug.value}`);

    const tender = response.tender;
    if (!tender) return null;
    const documentRows = response.documents ?? [];
    const relatedRows = response.relatedTenders ?? [];
    const documentUrlMap = await fetchSignedDocumentUrls(
      documentRows.map((document) => ({
        resource: "tender_documents",
        id: document.id,
      })),
    );

    return {
      tender: {
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
      },
      documents: documentRows.map((document) => ({
        id: document.id,
        fileName: document.file_name,
        fileSizeKb: document.file_size_kb,
        downloadUrl: documentUrlMap.get(document.id) ?? null,
      })),
      relatedTenders: relatedRows
        .filter((entry) => entry.slug !== slug.value)
        .slice(0, 3)
        .map((entry) => ({
          slug: entry.slug,
          title: entry.title,
          tenderNumber: entry.tender_number,
          status: entry.status,
        })),
    };
  } catch (error) {
    console.warn("[tenders] Could not load tender detail.", error);
    return null;
  }
  },
  { watch: [slug] },
);

const tender = computed(() => tenderData.value?.tender ?? null);
const documents = computed<TenderDocumentCard[]>(() => tenderData.value?.documents ?? []);
const relatedTenders = computed(() => tenderData.value?.relatedTenders ?? []);

if (!tender.value) {
  throw createError({ statusCode: 404, statusMessage: "Tender not found." });
}

useSeoMeta({
  title: () => `${tender.value?.title} — MeTRH`,
  description: () => tender.value?.description ?? tender.value?.title,
});
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">
    <div class="mb-8">
      <NuxtLink
        to="/tenders"
        class="inline-flex items-center gap-1 text-small font-semibold text-primary hover:underline"
      >
        <Icon name="lucide:arrow-left" class="size-4" />
        Back to tenders
      </NuxtLink>
    </div>

    <div v-if="tender" class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <article class="rounded-card border border-border bg-surface p-6 md:p-8 shadow-card">
        <div class="flex flex-wrap items-center gap-3">
          <span class="rounded-full bg-surface-alt px-3 py-1.5 text-caption font-semibold uppercase tracking-wide text-ink-muted">
            {{ tender.tenderNumber }}
          </span>
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
        </div>
        <h1 class="mt-4 font-display font-bold text-h1 text-ink">
          {{ tender.title }}
        </h1>
        <p class="mt-2 text-small text-ink-muted">
          {{ tender.category }}
        </p>

        <div class="mt-6 grid gap-3 sm:grid-cols-2">
          <div class="rounded-card bg-surface-alt p-4">
            <p class="text-caption font-semibold uppercase tracking-wide text-ink-muted">
              Opening date
            </p>
            <p class="mt-1 text-small text-ink">
              {{ tender.openingLabel }}
            </p>
          </div>
          <div class="rounded-card bg-surface-alt p-4">
            <p class="text-caption font-semibold uppercase tracking-wide text-ink-muted">
              Closing date
            </p>
            <p class="mt-1 text-small text-ink">
              {{ tender.closingLabel }}
            </p>
          </div>
          <div v-if="tender.awardedTo" class="rounded-card bg-surface-alt p-4 sm:col-span-2">
            <p class="text-caption font-semibold uppercase tracking-wide text-ink-muted">
              Awarded to
            </p>
            <p class="mt-1 text-small text-ink">
              {{ tender.awardedTo }}
            </p>
          </div>
        </div>

        <p class="mt-6 text-body text-ink-muted whitespace-pre-line">
          {{ tender.description || "No description has been published for this tender yet." }}
        </p>

        <section class="mt-8">
          <h2 class="font-display font-semibold text-h3 text-ink">
            Attachments
          </h2>
          <div v-if="documents.length" class="mt-3 grid gap-4 md:grid-cols-2">
            <article
              v-for="document in documents"
              :key="document.id"
              class="rounded-card border border-border bg-surface-alt p-4"
            >
              <p class="text-caption font-semibold uppercase tracking-wide text-ink-muted">
                {{ document.fileSizeKb ? `${document.fileSizeKb} KB` : "File" }}
              </p>
              <p class="mt-1 font-medium text-ink">
                {{ document.fileName }}
              </p>
              <a
                v-if="document.downloadUrl"
                :href="document.downloadUrl"
                target="_blank"
                rel="noreferrer noopener"
                class="mt-3 inline-flex items-center gap-1 text-small font-semibold text-primary hover:underline"
              >
                Download
                <Icon name="lucide:download" class="size-4" />
              </a>
              <p v-else class="mt-3 text-small font-medium text-ink-muted">
                This file is temporarily unavailable.
              </p>
            </article>
          </div>
          <div v-else class="mt-3 rounded-card bg-surface-alt p-5 text-small text-ink-muted">
            No attachments have been published for this notice yet.
          </div>
        </section>
      </article>

      <aside class="space-y-4">
        <div class="rounded-card border border-border bg-surface p-5">
          <p class="text-small font-semibold uppercase tracking-wide text-info">
            Tender status
          </p>
          <p class="mt-3 text-small text-ink-muted">
            {{ tender.status === "open" ? "Accepting submissions now." : "Not currently open for new submissions." }}
          </p>
        </div>

        <div v-if="relatedTenders.length" class="rounded-card border border-border bg-surface p-5">
          <p class="text-small font-semibold uppercase tracking-wide text-info">
            Other tenders
          </p>
          <ul class="mt-4 space-y-3">
            <li v-for="item in relatedTenders" :key="item.slug">
              <NuxtLink
                :to="`/tenders/${item.slug}`"
                class="block rounded-control border border-border px-3 py-2.5 hover:border-primary/30 hover:bg-surface-alt"
              >
                <p class="text-caption font-semibold uppercase tracking-wide text-ink-muted">
                  {{ item.tenderNumber }}
                </p>
                <p class="mt-1 text-small font-medium text-ink">
                  {{ item.title }}
                </p>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  </div>
</template>

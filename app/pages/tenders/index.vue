<script setup lang="ts">
definePageMeta({ layout: "default" });

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
const openTenderCount = 0;
const downloadCount = 0;

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
          <aside class="rounded-card border border-border bg-white p-5 lg:sticky lg:top-24 lg:self-start">
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
                      : 'border-border bg-white text-ink hover:border-primary/30 hover:bg-surface-alt'
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
              <div class="rounded-card border border-border bg-white p-5">
                <p class="text-caption font-semibold uppercase tracking-wide text-ink-muted">
                  Open tenders
                </p>
                <p class="mt-2 tabular-nums text-h2 text-primary">
                  {{ openTenderCount }}
                </p>
              </div>
              <div class="rounded-card border border-border bg-white p-5">
                <p class="text-caption font-semibold uppercase tracking-wide text-ink-muted">
                  Downloads
                </p>
                <p class="mt-2 tabular-nums text-h2 text-primary">
                  {{ downloadCount }}
                </p>
              </div>
            </div>

            <div class="rounded-card border border-dashed border-border bg-white p-10">
              <div class="max-w-xl">
                <p class="text-small font-semibold uppercase tracking-wide text-info">
                  No live items yet
                </p>
                <h2 class="mt-2 font-display font-semibold text-h3 text-ink">
                  Tender notices will appear here when procurement publishes them
                </h2>
                <p class="mt-3 text-small text-ink-muted">
                  This build has the route structure and security model in place,
                  but no public tender documents are seeded yet.
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

            <section class="rounded-card border border-border bg-white p-5 md:p-6">
              <p class="text-small font-semibold uppercase tracking-wide text-info">
                Downloads
              </p>
              <div class="mt-4 rounded-card bg-surface-alt p-6 text-small text-ink-muted">
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

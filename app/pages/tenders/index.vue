<script setup lang="ts">
definePageMeta({ layout: "default" });

const { data: tendersContent } = await usePageContent("tenders");

useSeoMeta({
  title: "Tenders — MeTRH",
  description:
    "Open tenders and procurement guidance for Meru Teaching and Referral Hospital.",
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

const { data: tenderIndex } = await useAsyncData(
  "public-tenders-index",
  async () => {
    try {
      const response = await $fetch<{
        tenders: TenderRow[];
      }>("/api/public/tenders");

      const tenderRows = response.tenders ?? [];
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

      return { tenders };
    } catch (error) {
      console.warn("[tenders] Could not load public tenders.", error);
      return { tenders: [] };
    }
  },
);

const tenders = computed(() => tenderIndex.value?.tenders ?? []);

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

const tendersIntro = computed(
  () => tendersContent.value?.sectionsByKey["tenders-intro"] ?? null,
);
</script>

<template>
  <div>
    <section class="bg-surface">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div class="max-w-3xl">
          <p class="text-small font-semibold uppercase tracking-wide text-info">
            {{ tendersIntro?.eyebrow || "Tenders" }}
          </p>
          <h1 class="mt-2 font-display font-bold text-h1 text-ink">
            {{ tendersIntro?.title || "Tender notices" }}
          </h1>
          <p class="mt-4 text-body text-ink-muted">
            {{
              tendersIntro?.summary ||
              "This page covers open tender notices and procurement guidance. When nothing is live, the page says so plainly."
            }}
          </p>
        </div>
      </div>
    </section>

    <section class="border-y border-border bg-surface-alt">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside
            class="rounded-card border border-border bg-surface p-5 lg:sticky lg:top-24 lg:self-start"
          >
            <label
              for="tender-search"
              class="block text-small font-medium text-ink"
            >
              Search notices
            </label>
            <div
              class="mt-2 flex items-center gap-2 rounded-control border border-border bg-surface px-3 py-2.5"
            >
              <Icon
                name="lucide:search"
                class="size-4 text-ink-muted"
                aria-hidden="true"
              />
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
                Tender notices are published by the procurement team and linked
                from each tender's detail page.
              </p>
            </div>
          </aside>

          <div class="space-y-6">
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="rounded-card border border-border bg-surface p-5">
                <p
                  class="text-caption font-semibold uppercase tracking-wide text-ink-muted"
                >
                  Open tenders
                </p>
                <p class="mt-2 tabular-nums text-h2 text-primary">
                  {{ openTenderCount }}
                </p>
              </div>
            </div>

            <div
              v-if="filteredTenders.length === 0"
              class="rounded-card border border-dashed border-border bg-surface p-10"
            >
              <div class="max-w-xl">
                <p
                  class="text-small font-semibold uppercase tracking-wide text-info"
                >
                  No live items yet
                </p>
                <h2 class="mt-2 font-display font-semibold text-h3 text-ink">
                  Tender notices will appear here when procurement publishes
                  them
                </h2>
                <p class="mt-3 text-small text-ink-muted">
                  This build has the route structure and security model in
                  place, but no public tender notices are available for the
                  selected filter.
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
                <div
                  class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"
                >
                  <div class="max-w-3xl">
                    <p
                      class="text-caption font-semibold uppercase tracking-wide text-accent"
                    >
                      {{ tender.tenderNumber }}
                    </p>
                    <h2
                      class="mt-2 font-display font-semibold text-h3 text-ink"
                    >
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
                      :to="`/tenders/${tender.slug.trim()}`"
                      class="inline-flex items-center gap-1 text-small font-semibold text-primary hover:underline"
                    >
                      View details
                      <Icon name="lucide:arrow-right" class="size-4" />
                    </NuxtLink>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

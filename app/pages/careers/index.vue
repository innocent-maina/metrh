<script setup lang="ts">
definePageMeta({ layout: "default" });

const { recruitmentRounds } = useMetrhContent();

useSeoMeta({
  title: "Careers & Opportunities — MeTRH",
  description:
    "Current job openings and archived recruitment rounds for Meru Teaching and Referral Hospital.",
});

const search = ref("");
const activeFilter = ref<"all" | "open" | "closed">("all");
const statusOptions = [
  { label: "All rounds", value: "all" },
  { label: "Open", value: "open" },
  { label: "Closed", value: "closed" },
] as const;

const filteredRounds = computed(() => {
  const term = search.value.trim().toLowerCase();

  return recruitmentRounds.filter((round) => {
    if (activeFilter.value !== "all" && round.status !== activeFilter.value) {
      return false;
    }

    if (!term) return true;

    return (
      round.title.toLowerCase().includes(term) ||
      round.referenceNo.toLowerCase().includes(term) ||
      round.summary.toLowerCase().includes(term)
    );
  });
});

const openCount = computed(
  () => recruitmentRounds.filter((round) => round.status === "open").length,
);
</script>

<template>
  <div>
    <section class="bg-surface">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div class="max-w-3xl">
          <p class="text-small font-semibold uppercase tracking-wide text-info">
            Careers &amp; opportunities
          </p>
          <h1 class="mt-2 font-display font-bold text-h1 text-ink">
            Current openings and recruitment rounds
          </h1>
          <p class="mt-4 text-body text-ink-muted">
            MeTRH recruits on a rolling basis. When there are live openings,
            they appear here with application instructions and upload support.
          </p>
        </div>
      </div>
    </section>

    <section class="border-y border-border bg-surface-alt">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside class="rounded-card border border-border bg-white p-5 lg:sticky lg:top-24 lg:self-start">
            <label for="career-search" class="block text-small font-medium text-ink">
              Search rounds
            </label>
            <div class="mt-2 flex items-center gap-2 rounded-control border border-border bg-surface px-3 py-2.5">
              <Icon name="lucide:search" class="size-4 text-ink-muted" aria-hidden="true" />
              <input
                id="career-search"
                v-model="search"
                type="search"
                placeholder="Reference or title"
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
          </aside>

          <div class="space-y-6">
            <div class="rounded-card border border-border bg-white p-5 md:p-6">
              <p class="text-small font-semibold uppercase tracking-wide text-info">
                {{ openCount }} open roles
              </p>
              <p class="mt-1 text-small text-ink-muted">
                No current openings are seeded in this build, but the route is
                ready for live postings from the dashboard.
              </p>
            </div>

            <div v-if="filteredRounds.length === 0" class="rounded-card border border-dashed border-border bg-white p-10 text-center">
              <Icon name="lucide:briefcase" class="mx-auto size-6 text-ink-muted" aria-hidden="true" />
              <p class="mt-3 text-small text-ink-muted">
                No recruitment rounds match that filter.
              </p>
            </div>

            <ul v-else class="grid gap-5">
              <li
                v-for="round in filteredRounds"
                :key="round.slug"
                class="rounded-card border border-border bg-white p-5 shadow-card"
              >
                <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p class="text-caption font-semibold uppercase tracking-wide text-accent">
                      {{ round.referenceNo }}
                    </p>
                    <h2 class="mt-2 font-display font-semibold text-h3 text-ink">
                      {{ round.title }}
                    </h2>
                    <p class="mt-2 text-small text-ink-muted">
                      {{ round.summary }}
                    </p>
                  </div>
                  <div class="flex items-center gap-2">
                    <span
                      class="rounded-full px-3 py-1.5 text-caption font-semibold uppercase tracking-wide"
                      :class="
                        round.status === 'open'
                          ? 'bg-success/10 text-success'
                          : 'bg-surface-alt text-ink-muted'
                      "
                    >
                      {{ round.status }}
                    </span>
                    <NuxtLink
                      :to="`/careers/${round.slug}`"
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

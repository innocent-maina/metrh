<script setup lang="ts">
definePageMeta({ layout: "dashboard" });

const { me, hasRole, isSuperAdmin } = useDashboardRoles();
const numberFormatter = new Intl.NumberFormat("en-US");

interface ChartBar {
  label: string;
  value: number;
  percent: number;
  detail?: string;
}

const canReadContacts = computed(
  () =>
    hasRole("front_desk") || hasRole("content_editor") || isSuperAdmin.value,
);
const canReadCareers = computed(
  () => hasRole("hr_manager") || isSuperAdmin.value,
);
const canReadProcurement = computed(
  () => hasRole("procurement_manager") || isSuperAdmin.value,
);
function buildScaledBars(entries: Array<{ label: string; value: number }>) {
  const max = Math.max(...entries.map((entry) => entry.value), 0);

  return entries.map((entry) => ({
    ...entry,
    percent: max > 0 ? (entry.value / max) * 100 : 0,
  })) as ChartBar[];
}

function buildRatioBars(
  entries: Array<{ label: string; value: number; total: number }>,
) {
  return entries.map((entry) => ({
    label: entry.label,
    value: entry.value,
    percent: entry.total > 0 ? (entry.value / entry.total) * 100 : 0,
    detail: `${entry.value} / ${entry.total}`,
  })) as ChartBar[];
}

const { data: contactCount } = await useAsyncData(
  "dashboard-contact-count",
  async () => {
    if (!canReadContacts.value) return null;
    try {
      return await fetchDashboardResourceCount("contact_submissions");
    } catch (error) {
      console.warn("Unable to load contact submission count:", error);
      return null;
    }
  },
  { default: () => null },
);

const { data: openJobsCount } = await useAsyncData(
  "dashboard-open-jobs-count",
  async () => {
    if (!canReadCareers.value) return null;
    try {
      return await fetchDashboardResourceCount("job_postings", {
        status: "open",
      });
    } catch (error) {
      console.warn("Unable to load open jobs count:", error);
      return null;
    }
  },
  { default: () => null },
);

const { data: openTendersCount } = await useAsyncData(
  "dashboard-open-tenders-count",
  async () => {
    if (!canReadProcurement.value) return null;
    try {
      return await fetchDashboardResourceCount("tenders", {
        status: ["open", "closed", "awarded", "cancelled"],
      });
    } catch (error) {
      console.warn("Unable to load open tenders count:", error);
      return null;
    }
  },
  { default: () => null },
);

const { data: totalJobsCount } = await useAsyncData(
  "dashboard-total-jobs-count",
  async () => {
    if (!canReadCareers.value) return null;
    try {
      return await fetchDashboardResourceCount("job_postings");
    } catch (error) {
      console.warn("Unable to load total jobs count:", error);
      return null;
    }
  },
  { default: () => null },
);

const { data: totalTendersCount } = await useAsyncData(
  "dashboard-total-tenders-count",
  async () => {
    if (!canReadProcurement.value) return null;
    try {
      return await fetchDashboardResourceCount("tenders");
    } catch (error) {
      console.warn("Unable to load total tenders count:", error);
      return null;
    }
  },
  { default: () => null },
);

const workloadBars = computed<ChartBar[]>(() =>
  buildScaledBars([
    { label: "Contact submissions", value: contactCount.value ?? 0 },
    { label: "Open jobs", value: openJobsCount.value ?? 0 },
    { label: "Active tenders", value: openTendersCount.value ?? 0 },
  ]),
);

const availabilityBars = computed<ChartBar[]>(() =>
  buildRatioBars([
    {
      label: "Open jobs",
      value: openJobsCount.value ?? 0,
      total: totalJobsCount.value ?? 0,
    },
    {
      label: "Active tenders",
      value: openTendersCount.value ?? 0,
      total: totalTendersCount.value ?? 0,
    },
  ]),
);

const quickLinks = computed(() => {
  const sections = useDashboardSections();
  return sections.filter((section) =>
    section.roles.some((role) => hasRole(role)),
  );
});

const dashboardImages = useHospitalMedia();
</script>

<template>
  <div class="space-y-8">
    <section
      class="rounded-card border border-border bg-surface p-6 md:p-8 shadow-card"
    >
      <div class="max-w-3xl">
        <p class="text-small font-semibold uppercase tracking-wide text-info">
          Dashboard overview
        </p>
        <h2 class="mt-2 font-display font-bold text-h1 text-ink">
          Welcome back, {{ me?.profile?.full_name || "staff member" }}
        </h2>
        <p class="mt-4 text-body text-ink-muted">
          Use the role-aware links below to edit the areas this account is
          allowed to manage. All writes remain server-side.
        </p>
      </div>
    </section>

    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div
        v-if="contactCount !== null"
        class="rounded-card border border-border bg-surface p-5"
      >
        <p
          class="text-caption font-semibold uppercase tracking-wide text-ink-muted"
        >
          Contact submissions
        </p>
        <p class="mt-2 tabular-nums text-h2 text-primary">
          {{ contactCount }}
        </p>
      </div>
      <div
        v-if="openJobsCount !== null"
        class="rounded-card border border-border bg-surface p-5"
      >
        <p
          class="text-caption font-semibold uppercase tracking-wide text-ink-muted"
        >
          Open jobs
        </p>
        <p class="mt-2 tabular-nums text-h2 text-primary">
          {{ openJobsCount }}
        </p>
      </div>
      <div
        v-if="openTendersCount !== null"
        class="rounded-card border border-border bg-surface p-5"
      >
        <p
          class="text-caption font-semibold uppercase tracking-wide text-ink-muted"
        >
          Active tenders
        </p>
        <p class="mt-2 tabular-nums text-h2 text-primary">
          {{ openTendersCount }}
        </p>
      </div>
    </section>

    <section class="rounded-card border border-border bg-surface p-6 shadow-card">
      <div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div class="max-w-2xl">
          <p class="text-small font-semibold uppercase tracking-wide text-info">
            Snapshot charts
          </p>
          <h3 class="mt-2 font-display font-semibold text-h3 text-ink">
            Quick activity view
          </h3>
          <p class="mt-2 text-small text-ink-muted">
            A compact look at current workload and open availability.
          </p>
        </div>
      </div>

      <div class="mt-5 grid gap-4 xl:grid-cols-2">
        <article class="rounded-card border border-border bg-surface-alt p-5">
          <p class="text-caption font-semibold uppercase tracking-wide text-ink-muted">
            Workload mix
          </p>
          <p class="mt-1 text-small text-ink-muted">
            Current counts across the busiest dashboard areas.
          </p>

          <div class="mt-5 space-y-4">
            <div
              v-for="entry in workloadBars"
              :key="entry.label"
              class="space-y-2"
            >
              <div class="flex items-center justify-between gap-3">
                <p
                  class="min-w-0 flex-1 truncate text-small font-semibold text-ink"
                  :title="entry.label"
                >
                  {{ entry.label }}
                </p>
                <p class="shrink-0 text-small font-semibold tabular-nums text-ink">
                  {{ numberFormatter.format(entry.value) }}
                </p>
              </div>
              <div class="h-3 rounded-full bg-surface">
                <div
                  class="h-3 rounded-full bg-[linear-gradient(90deg,rgba(14,165,233,0.95),rgba(53,121,255,0.85))] transition-all"
                  :style="{ width: `${Math.max(entry.percent, 4)}%` }"
                  :title="`${entry.label}: ${entry.value}`"
                />
              </div>
            </div>
          </div>
        </article>

        <article class="rounded-card border border-border bg-surface-alt p-5">
          <p class="text-caption font-semibold uppercase tracking-wide text-ink-muted">
            Open share
          </p>
          <p class="mt-1 text-small text-ink-muted">
            How much of each queue is currently live.
          </p>

          <div class="mt-5 space-y-4">
            <div
              v-for="entry in availabilityBars"
              :key="entry.label"
              class="space-y-2"
            >
              <div class="flex items-center justify-between gap-3">
                <p
                  class="min-w-0 flex-1 truncate text-small font-semibold text-ink"
                  :title="entry.label"
                >
                  {{ entry.label }}
                </p>
                <p class="shrink-0 text-small font-semibold tabular-nums text-ink">
                  {{ entry.detail }}
                </p>
              </div>
              <div class="h-3 rounded-full bg-surface">
                <div
                  class="h-3 rounded-full bg-[linear-gradient(90deg,rgba(16,185,129,0.95),rgba(14,165,233,0.85))] transition-all"
                  :style="{ width: `${Math.max(entry.percent, 4)}%` }"
                  :title="`${entry.label}: ${entry.detail}`"
                />
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section class="rounded-card border border-border bg-surface p-6 shadow-card">
      <h3 class="font-display font-semibold text-h3 text-ink">Quick links</h3>
      <div class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <NuxtLink
          v-for="section in quickLinks"
          :key="section.id"
          :to="section.to"
          class="rounded-card border border-border bg-surface-alt p-5 hover:border-primary/30 hover:bg-surface transition-colors"
        >
          <div class="flex items-start gap-3">
            <span
              class="flex size-10 shrink-0 items-center justify-center rounded-control bg-primary/10 text-primary"
            >
              <Icon :name="section.icon" class="size-5" />
            </span>
            <div>
              <p class="font-display font-semibold text-h4 text-ink">
                {{ section.label }}
              </p>
              <p class="mt-1 text-small text-ink-muted">
                {{ section.description }}
              </p>
            </div>
          </div>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

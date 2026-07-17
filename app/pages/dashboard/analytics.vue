<script setup lang="ts">
definePageMeta({ layout: "dashboard" });

interface AnalyticsBreakdownItem {
  label: string;
  detail?: string;
  count: number;
  percent: number;
}

interface AnalyticsDailyPoint {
  date: string;
  label: string;
  count: number;
}

interface DashboardAnalytics {
  rangeDays: number;
  rangeStart: string;
  rangeEnd: string;
  generatedAt: string;
  totals: {
    pulses: number;
    sessions: number;
    uniquePaths: number;
    averagePerDay: number;
    peakDay: AnalyticsDailyPoint | null;
  };
  daily: AnalyticsDailyPoint[];
  topPages: AnalyticsBreakdownItem[];
  referrers: AnalyticsBreakdownItem[];
  devices: AnalyticsBreakdownItem[];
}

const numberFormatter = new Intl.NumberFormat("en-US");
const averageFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});
const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const { data: analytics, pending, error, refresh } = await useAsyncData(
  "dashboard-analytics",
  () => $fetch<DashboardAnalytics>("/api/dashboard/analytics"),
  { default: () => null },
);

useSeoMeta({
  title: "Analytics — MeTRH Dashboard",
  description: "Visitor pulse charts and traffic trends for the staff dashboard.",
});

const dailySeries = computed(() => analytics.value?.daily ?? []);
const maxDailyValue = computed(() =>
  Math.max(...dailySeries.value.map((point) => point.count), 0),
);

const lineChart = computed(() => {
  const series = dailySeries.value;
  if (series.length === 0) {
    return { line: "", area: "", dots: [] as Array<AnalyticsDailyPoint & { x: number; y: number }> };
  }

  const max = Math.max(maxDailyValue.value, 1);
  const dots = series.map((point, index) => {
    const x = series.length > 1 ? (index / (series.length - 1)) * 100 : 50;
    const y = 38 - (point.count / max) * 28;
    return { ...point, x, y };
  });

  const line = dots.map((point) => `${point.x},${point.y}`).join(" ");
  const first = dots[0];
  const last = dots[dots.length - 1];
  const area = first && last ? `${line} ${last.x},40 ${first.x},40` : "";

  return { line, area, dots };
});

const summaryCards = computed(() => [
  {
    label: "Total pulses",
    value: analytics.value?.totals.pulses ?? 0,
    detail: "Recorded visitor events in the current window.",
  },
  {
    label: "Unique sessions",
    value: analytics.value?.totals.sessions ?? 0,
    detail: "Distinct browser sessions that generated pulses.",
  },
  {
    label: "Tracked pages",
    value: analytics.value?.totals.uniquePaths ?? 0,
    detail: "Unique paths seen over the last 30 days.",
  },
  {
    label: "Daily average",
    value: analytics.value?.totals.averagePerDay ?? 0,
    detail: "Mean pulses per day during the selected range.",
    decimal: true,
  },
]);

function formatCount(value: number, decimal = false) {
  return decimal ? averageFormatter.format(value) : numberFormatter.format(value);
}

function formatDateRange(date: string) {
  return shortDateFormatter.format(new Date(date));
}

function barWidth(percent: number) {
  return `${Math.max(percent, 4)}%`;
}

function handleRefresh() {
  void refresh();
}
</script>

<template>
  <div class="space-y-6">
    <section class="rounded-card border border-border bg-surface p-6 md:p-8 shadow-card">
      <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div class="max-w-3xl">
          <p class="text-small font-semibold uppercase tracking-wide text-info">
            Analytics
          </p>
          <h2 class="mt-2 font-display font-bold text-h1 text-ink">
            Visitor pulse charts
          </h2>
          <p class="mt-4 text-body text-ink-muted">
            The dashboard now surfaces traffic as charts instead of a table. The
            data comes from the page pulse tracker running on the public site.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <p class="text-caption text-ink-muted">
            Last refreshed {{ analytics?.generatedAt ? formatDateRange(analytics.generatedAt) : "moments ago" }}
          </p>
          <button
            type="button"
            class="rounded-control border border-border bg-surface px-4 py-2 text-small font-semibold text-ink hover:bg-surface-alt"
            :disabled="pending"
            @click="handleRefresh"
          >
            {{ pending ? "Refreshing…" : "Refresh" }}
          </button>
        </div>
      </div>
    </section>

    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article
        v-for="card in summaryCards"
        :key="card.label"
        class="rounded-card border border-border bg-surface p-5 shadow-card"
      >
        <p class="text-caption font-semibold uppercase tracking-wide text-ink-muted">
          {{ card.label }}
        </p>
        <p class="mt-2 tabular-nums text-h2 text-primary">
          {{ formatCount(card.value, Boolean(card.decimal)) }}
        </p>
        <p class="mt-2 text-small text-ink-muted">
          {{ card.detail }}
        </p>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
      <article class="rounded-card border border-border bg-surface p-6 shadow-card">
        <div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p class="text-caption font-semibold uppercase tracking-wide text-ink-muted">
              Trend
            </p>
            <h3 class="mt-1 font-display font-semibold text-h3 text-ink">
              Daily visitor pulses
            </h3>
          </div>
          <p v-if="analytics?.totals.peakDay" class="text-small text-ink-muted">
            Peak day {{ analytics.totals.peakDay.label }} with
            {{ numberFormatter.format(analytics.totals.peakDay.count) }} pulses
          </p>
        </div>

        <div v-if="error" class="mt-5 rounded-card border border-danger/30 bg-danger/5 p-4 text-small text-danger">
          Could not load analytics right now.
        </div>

        <div v-else-if="pending" class="mt-5 rounded-card border border-border bg-surface-alt p-4 text-small text-ink-muted">
          Loading analytics charts...
        </div>

        <div v-else-if="dailySeries.length === 0" class="mt-5 rounded-card border border-border bg-surface-alt p-4 text-small text-ink-muted">
          No page pulses have been recorded in this window yet.
        </div>

        <div v-else class="mt-5 space-y-5">
          <div class="h-72 rounded-card border border-border bg-surface-alt p-4">
            <svg
              viewBox="0 0 100 44"
              class="h-full w-full"
              preserveAspectRatio="none"
              aria-label="Daily visitor pulse chart"
              role="img"
            >
              <defs>
                <linearGradient id="analytics-line" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="rgba(15, 100, 161, 0.35)" />
                  <stop offset="100%" stop-color="rgba(15, 100, 161, 0)" />
                </linearGradient>
              </defs>
              <rect x="0" y="0" width="100" height="44" fill="transparent" />
              <polygon
                v-if="lineChart.area"
                :points="lineChart.area"
                fill="url(#analytics-line)"
              />
              <polyline
                v-if="lineChart.line"
                :points="lineChart.line"
                fill="none"
                stroke="rgb(var(--brand-primary-rgb))"
                stroke-width="1.75"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <circle
                v-for="point in lineChart.dots"
                :key="point.date"
                :cx="point.x"
                :cy="point.y"
                r="0.95"
                fill="rgb(var(--brand-primary-rgb))"
              />
            </svg>
          </div>

          <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div
              v-for="point in dailySeries.slice(-6)"
              :key="point.date"
              class="rounded-card border border-border bg-surface-alt p-4"
            >
              <p class="text-caption font-semibold uppercase tracking-wide text-ink-muted">
                {{ point.label }}
              </p>
              <p class="mt-2 tabular-nums text-h4 text-ink">
                {{ numberFormatter.format(point.count) }}
              </p>
              <p class="mt-1 text-caption text-ink-muted">
                {{ point.date }}
              </p>
            </div>
          </div>
        </div>
      </article>

      <article class="rounded-card border border-border bg-surface p-6 shadow-card">
        <p class="text-caption font-semibold uppercase tracking-wide text-ink-muted">
          Traffic mix
        </p>
        <h3 class="mt-1 font-display font-semibold text-h3 text-ink">
          Device and source breakdown
        </h3>

        <div class="mt-5 space-y-6">
          <div>
            <div class="flex items-center justify-between gap-3">
              <p class="text-small font-semibold text-ink">Device type</p>
              <p class="text-caption text-ink-muted">
                Based on viewport width
              </p>
            </div>

            <div class="mt-4 space-y-3">
              <div
                v-for="device in analytics?.devices ?? []"
                :key="device.label"
                class="space-y-1"
              >
                <div class="flex items-center justify-between gap-3">
                  <p class="text-small font-medium text-ink">{{ device.label }}</p>
                  <p class="text-small tabular-nums text-ink-muted">
                    {{ numberFormatter.format(device.count) }}
                  </p>
                </div>
                <div class="h-2 rounded-full bg-surface-alt">
                  <div
                    class="h-2 rounded-full bg-[linear-gradient(90deg,rgba(146,183,74,0.96),rgba(15,100,161,0.88))]"
                    :style="{ width: barWidth(device.percent) }"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between gap-3">
              <p class="text-small font-semibold text-ink">Top referrers</p>
              <p class="text-caption text-ink-muted">
                Direct and external sources
              </p>
            </div>

            <div class="mt-4 space-y-3">
              <div
                v-for="source in analytics?.referrers ?? []"
                :key="source.label"
                class="space-y-1"
              >
                <div class="flex items-center justify-between gap-3">
                  <div class="min-w-0">
                    <p class="truncate text-small font-medium text-ink">
                      {{ source.label }}
                    </p>
                    <p v-if="source.detail" class="truncate text-caption text-ink-muted">
                      {{ source.detail }}
                    </p>
                  </div>
                  <p class="text-small tabular-nums text-ink-muted">
                    {{ numberFormatter.format(source.count) }}
                  </p>
                </div>
                <div class="h-2 rounded-full bg-surface-alt">
                  <div
                    class="h-2 rounded-full bg-[linear-gradient(90deg,rgba(15,100,161,0.92),rgba(60,133,182,0.8))]"
                    :style="{ width: barWidth(source.percent) }"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>
    </section>

    <section class="rounded-card border border-border bg-surface p-6 shadow-card">
      <div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="text-caption font-semibold uppercase tracking-wide text-ink-muted">
            Top pages
          </p>
          <h3 class="mt-1 font-display font-semibold text-h3 text-ink">
            Most visited routes
          </h3>
        </div>
        <p class="text-small text-ink-muted">
          Ordered by pulse count across the last {{ analytics?.rangeDays ?? 30 }} days.
        </p>
      </div>

      <div class="mt-5 grid gap-4 xl:grid-cols-2">
        <article
          v-for="page in analytics?.topPages ?? []"
          :key="page.label"
          class="rounded-card border border-border bg-surface-alt p-5"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="truncate font-semibold text-ink">{{ page.label }}</p>
              <p v-if="page.detail" class="mt-1 truncate text-caption text-ink-muted">
                {{ page.detail }}
              </p>
            </div>
            <p class="shrink-0 tabular-nums text-small font-semibold text-ink">
              {{ numberFormatter.format(page.count) }}
            </p>
          </div>
          <div class="mt-4 h-2 rounded-full bg-surface">
            <div
              class="h-2 rounded-full bg-[linear-gradient(90deg,rgba(15,100,161,0.95),rgba(53,121,255,0.82))]"
              :style="{ width: barWidth(page.percent) }"
            />
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

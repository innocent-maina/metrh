<script setup lang="ts">
type AnalyticsRow = Record<string, unknown> & {
  created_at?: string | null;
  path?: string | null;
  page_title?: string | null;
  referrer?: string | null;
  language?: string | null;
  session_id?: string | null;
  screen_width?: number | null;
  viewport_width?: number | null;
};

interface BarDatum {
  label: string;
  value: number;
  percent: number;
}

interface TrendDatum {
  label: string;
  value: number;
  percent: number;
}

interface Props {
  rows: Record<string, unknown>[];
  loading?: boolean;
  hasFilter?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  hasFilter: false,
});

const rows = computed(() => props.rows as AnalyticsRow[]);
const requestUrl = useRequestURL();
const hostName = requestUrl.hostname.toLowerCase();
const numberFormatter = new Intl.NumberFormat("en-US");
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

function getRowText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizePath(value: unknown) {
  const text = getRowText(value);
  if (!text) return "Unknown";

  const base = text.split("?")[0]?.split("#")[0] ?? text;
  return base === "" ? "Unknown" : base;
}

function normalizeLanguage(value: unknown) {
  const text = getRowText(value);
  if (!text) return "Unknown";

  return text.split(/[;,]/)[0]?.split("-")[0]?.toLowerCase() || "Unknown";
}

function normalizeReferrer(value: unknown) {
  const text = getRowText(value);
  if (!text) return "Direct";

  try {
    const url = new URL(text);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");

    if (!hostname) return "Direct";

    if (hostname === hostName || hostname.endsWith(`.${hostName}`)) {
      return "Internal";
    }

    return hostname;
  } catch {
    return text.length > 36 ? `${text.slice(0, 33)}...` : text;
  }
}

function normalizeViewportBucket(row: AnalyticsRow) {
  const rawWidth = row.viewport_width ?? row.screen_width;
  const width = Number(rawWidth);

  if (!Number.isFinite(width) || width <= 0) return "Unknown";
  if (width < 768) return "Mobile";
  if (width < 1024) return "Tablet";
  if (width < 1440) return "Laptop";
  return "Desktop";
}

function toDayKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function toDate(value: unknown) {
  const text = getRowText(value);
  if (!text) return null;

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function countBy(
  source: AnalyticsRow[],
  pick: (row: AnalyticsRow) => string,
) {
  const counts = new Map<string, number>();

  for (const row of source) {
    const key = pick(row).trim();
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return counts;
}

function topBars(
  source: AnalyticsRow[],
  pick: (row: AnalyticsRow) => string,
  limit = 5,
) {
  const entries = [...countBy(source, pick).entries()].sort(
    ([, left], [, right]) => right - left,
  );

  const visible: Array<[string, number]> = entries.slice(0, limit) as Array<
    [string, number]
  >;
  const other = entries.slice(limit).reduce((sum, [, value]) => sum + value, 0);

  if (other > 0) {
    visible.push(["Other", other]);
  }

  const max = visible[0]?.[1] ?? 0;

  return visible.map(([label, value]) => ({
    label,
    value,
    percent: max > 0 ? (value / max) * 100 : 0,
  }));
}

const normalizedRows = computed(() => rows.value);

const totalPulses = computed(() => normalizedRows.value.length);

const uniqueSessions = computed(() => {
  const values = new Set(
    normalizedRows.value
      .map((row) => getRowText(row.session_id))
      .filter(Boolean),
  );

  return values.size;
});

const uniquePaths = computed(() => {
  const values = new Set(
    normalizedRows.value.map((row) => normalizePath(row.path)),
  );

  return values.size;
});

const activityTrend = computed<TrendDatum[]>(() => {
  const dates = normalizedRows.value
    .map((row) => toDate(row.created_at))
    .filter((date): date is Date => date !== null);

  const endDate = dates.length
    ? new Date(
        Math.max(...dates.map((date) => date.getTime())),
      )
    : new Date();

  const endDay = new Date(endDate);
  endDay.setHours(0, 0, 0, 0);

  const startDay = new Date(endDay);
  startDay.setDate(startDay.getDate() - 13);

  const counts = new Map<string, number>();
  for (let index = 0; index < 14; index += 1) {
    const day = new Date(startDay);
    day.setDate(startDay.getDate() + index);
    counts.set(toDayKey(day), 0);
  }

  for (const row of normalizedRows.value) {
    const date = toDate(row.created_at);
    if (!date) continue;

    const day = new Date(date);
    day.setHours(0, 0, 0, 0);
    const key = toDayKey(day);
    if (!counts.has(key)) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const entries = [...counts.entries()].map(([key, value]) => {
    const [yearText = "", monthText = "", dayText = ""] = key.split("-");
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    const date = new Date(year, month - 1, day);
    return {
      label: dateFormatter.format(date),
      value,
    };
  });

  const max = Math.max(...entries.map((entry) => entry.value), 0);

  return entries.map((entry) => ({
    ...entry,
    percent: max > 0 ? (entry.value / max) * 100 : 0,
  }));
});

const topPaths = computed(() => topBars(normalizedRows.value, (row) => normalizePath(row.path)));

const topReferrers = computed(() =>
  topBars(normalizedRows.value, (row) => normalizeReferrer(row.referrer)),
);

const topLanguages = computed(() =>
  topBars(normalizedRows.value, (row) => normalizeLanguage(row.language)),
);

const viewportMix = computed(() =>
  topBars(normalizedRows.value, (row) => normalizeViewportBucket(row)),
);

const peakDay = computed((): TrendDatum => {
  if (!activityTrend.value.length) {
    return { label: "No data", value: 0, percent: 0 };
  }

  const [first, ...rest] = activityTrend.value;
  if (!first) {
    return { label: "No data", value: 0, percent: 0 };
  }

  return rest.reduce(
    (best, current) => (current.value > best.value ? current : best),
    first,
  );
});

const summaryCards = computed(() => {
  const peak = peakDay.value;

  return [
    {
      label: "Total pulses",
      value: numberFormatter.format(totalPulses.value),
      detail: "All captured page activity in the current filter.",
    },
    {
      label: "Unique sessions",
      value: numberFormatter.format(uniqueSessions.value),
      detail: "Distinct browser sessions that generated pulses.",
    },
    {
      label: "Unique paths",
      value: numberFormatter.format(uniquePaths.value),
      detail: "How many routes received at least one visit.",
    },
    {
      label: "Peak day",
      value: peak.value ? numberFormatter.format(peak.value) : "0",
      detail: peak.label,
    },
  ];
});

const chartCards = computed(() => [
  {
    title: "Activity by day",
    description: "The last 14 days of page pulse captures.",
    type: "trend",
    data: activityTrend.value,
    emptyLabel: "No dated activity yet.",
  },
  {
    title: "Top paths",
    description: "Most visited routes in the current data set.",
    type: "bar",
    data: topPaths.value,
    emptyLabel: "No path data yet.",
  },
  {
    title: "Referrer mix",
    description: "Where visitors came from before landing here.",
    type: "bar",
    data: topReferrers.value,
    emptyLabel: "No referrer data yet.",
  },
  {
    title: "Language mix",
    description: "Browser language hints captured from the client.",
    type: "bar",
    data: topLanguages.value,
    emptyLabel: "No language data yet.",
  },
  {
    title: "Viewport sizes",
    description: "A quick view of the device size spread.",
    type: "bar",
    data: viewportMix.value,
    emptyLabel: "No viewport data yet.",
  },
]);

const hasNoFilteredRows = computed(() => !props.loading && !rows.value.length);
</script>

<template>
  <section class="rounded-card border border-border bg-surface p-6 shadow-card">
    <div
      class="relative overflow-hidden rounded-[1.5rem] border border-primary/10 bg-[linear-gradient(135deg,rgba(53,121,255,0.08),rgba(14,165,233,0.06)_45%,rgba(255,255,255,0.92)_100%)] p-6 md:p-8"
    >
      <div class="absolute -right-10 -top-10 size-40 rounded-full bg-primary/10 blur-3xl" />
      <div class="absolute -bottom-12 left-1/3 size-48 rounded-full bg-info/10 blur-3xl" />

      <div class="relative flex flex-wrap items-start justify-between gap-5">
        <div class="max-w-3xl">
          <p class="text-small font-semibold uppercase tracking-wide text-info">
            Analytics overview
          </p>
          <h3 class="mt-2 font-display font-bold text-h2 text-ink">
            Visitor activity at a glance
          </h3>
          <p class="mt-3 text-body text-ink-muted">
            These charts turn page pulse rows into the useful parts: traffic
            over time, the pages people reach, where they came from, the
            languages they use, and the device sizes they bring.
          </p>
        </div>

        <div
          class="rounded-card border border-border bg-surface/90 px-4 py-3 shadow-sm backdrop-blur"
        >
          <p class="text-caption font-semibold uppercase tracking-wide text-ink-muted">
            Filtered pulses
          </p>
          <p class="mt-1 font-display text-h3 text-ink">
            {{ numberFormatter.format(totalPulses) }}
          </p>
          <p class="mt-1 text-small text-ink-muted">
            Search terms above update every chart here.
          </p>
        </div>
      </div>
    </div>

    <div v-if="loading" class="mt-5 rounded-card border border-border bg-surface-alt px-4 py-3 text-small text-ink-muted">
      Loading analytics...
    </div>

    <div
      v-if="hasNoFilteredRows"
      class="mt-5 rounded-card border border-border bg-surface-alt px-5 py-10 text-center"
    >
      <p class="font-display text-h4 text-ink">
        {{ hasFilter ? "No matches for this search" : "No analytics yet" }}
      </p>
      <p class="mt-2 text-small text-ink-muted">
        {{
          hasFilter
            ? "Clear the search term to bring the charts back."
            : "Page pulse data will populate these charts as visitors move through the public site."
        }}
      </p>
    </div>

    <div v-else class="mt-6 space-y-4">
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article
          v-for="card in summaryCards"
          :key="card.label"
          class="rounded-card border border-border bg-surface-alt p-5"
        >
          <p class="text-caption font-semibold uppercase tracking-wide text-ink-muted">
            {{ card.label }}
          </p>
          <p class="mt-2 font-display text-h2 text-ink">
            {{ card.value }}
          </p>
          <p class="mt-2 text-small text-ink-muted">
            {{ card.detail }}
          </p>
        </article>
      </div>

      <div class="grid gap-4 xl:grid-cols-2">
        <article
          v-for="chart in chartCards"
          :key="chart.title"
          class="rounded-card border border-border bg-surface p-5"
          :class="chart.type === 'trend' ? 'xl:col-span-2' : ''"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-caption font-semibold uppercase tracking-wide text-ink-muted">
                {{ chart.title }}
              </p>
              <p class="mt-1 text-small text-ink-muted">
                {{ chart.description }}
              </p>
            </div>
            <p class="text-caption font-semibold uppercase tracking-wide text-info">
              {{ chart.data.reduce((sum, entry) => sum + entry.value, 0) }} records
            </p>
          </div>

          <div
            v-if="chart.type === 'trend'"
            class="mt-5 flex h-56 items-end gap-2 rounded-3xl border border-border bg-surface-alt/70 p-4 md:h-64"
          >
            <div
              v-for="point in chart.data"
              :key="point.label"
              class="flex min-w-0 flex-1 flex-col items-center gap-2"
            >
              <div class="flex w-full flex-1 items-end">
                <div
                  class="w-full rounded-t-2xl bg-[linear-gradient(180deg,rgba(14,165,233,0.95),rgba(53,121,255,0.75))]"
                  :style="{ height: `${Math.max(point.percent, 6)}%` }"
                  :title="`${point.label}: ${point.value}`"
                />
              </div>
              <div class="text-center">
                <p class="text-caption font-semibold text-ink-muted">
                  {{ point.label }}
                </p>
                <p class="mt-1 text-small font-semibold text-ink">
                  {{ numberFormatter.format(point.value) }}
                </p>
              </div>
            </div>
          </div>

          <div v-else class="mt-5 space-y-4">
            <div
              v-for="entry in chart.data"
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
              <div class="h-3 rounded-full bg-surface-alt">
                <div
                  class="h-3 rounded-full bg-[linear-gradient(90deg,rgba(14,165,233,0.95),rgba(53,121,255,0.85))] transition-all"
                  :style="{ width: `${Math.max(entry.percent, 4)}%` }"
                  :title="`${entry.label}: ${entry.value}`"
                />
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

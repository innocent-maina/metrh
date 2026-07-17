import { createError } from "h3";
import { requireAnyRole } from "~~/server/utils/require-role";
import { supabaseAdmin } from "~~/server/utils/supabase-admin";
import type { AppRole, Database } from "~~/types/database.types";

type PagePulseRow = Database["public"]["Tables"]["page_pulses"]["Row"];

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

const analyticsRoles: AppRole[] = [
  "super_admin",
  "content_editor",
  "hr_manager",
  "procurement_manager",
  "front_desk",
];

function startOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function addUtcDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function formatDayLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function normalizePathLabel(path: string, title: string | null) {
  const trimmedTitle = title?.trim();
  if (trimmedTitle) return trimmedTitle;

  if (path === "/") return "Home";
  return path;
}

function classifyDevice(row: PagePulseRow) {
  const width = row.viewport_width ?? row.screen_width;
  if (!width) return "Unknown";
  if (width < 768) return "Mobile";
  if (width < 1200) return "Tablet";
  return "Desktop";
}

function classifyReferrer(referrer: string | null, siteHost: string) {
  if (!referrer) return "Direct";

  let host = "";
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return "Direct";
  }

  if (!host) return "Direct";
  if (siteHost && (host === siteHost || host.endsWith(`.${siteHost}`))) {
    return "Internal";
  }
  if (host.includes("google.")) return "Google";
  if (host.includes("bing.")) return "Bing";
  if (host.includes("duckduckgo.")) return "DuckDuckGo";
  if (host.includes("yahoo.")) return "Yahoo";
  if (host.includes("facebook.")) return "Facebook";
  if (host.includes("instagram.")) return "Instagram";
  if (host.includes("linkedin.")) return "LinkedIn";
  if (host.includes("x.com") || host.includes("twitter.")) return "X";
  return host.replace(/^www\./, "");
}

function toBreakdown(
  entries: Map<string, number>,
  total: number,
  includeDetail?: (label: string) => string | undefined,
) {
  return [...entries.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([label, count]) => ({
      label,
      detail: includeDetail?.(label),
      count,
      percent: total > 0 ? (count / total) * 100 : 0,
    }));
}

export default defineEventHandler(async (event) => {
  await requireAnyRole(event, analyticsRoles);

  const admin = supabaseAdmin();
  const siteUrl =
    process.env.NUXT_PUBLIC_SITE_URL ??
    process.env.SUPABASE_URL ??
    "https://www.metrh.or.ke";
  const siteHost = siteUrl
    ? new URL(siteUrl).hostname.toLowerCase()
    : "";

  const now = new Date();
  const rangeDays = 30;
  const rangeStart = startOfUtcDay(addUtcDays(now, -(rangeDays - 1)));

  const { data, error } = await admin
    .from("page_pulses")
    .select(
      "created_at,path,page_title,referrer,session_id,viewport_width,screen_width",
    )
    .gte("created_at", rangeStart.toISOString())
    .order("created_at", { ascending: true });

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Could not load analytics.",
    });
  }

  const rows = (data ?? []) as PagePulseRow[];
  const sessions = new Set<string>();
  const pathCounts = new Map<string, number>();
  const referrerCounts = new Map<string, number>();
  const deviceCounts = new Map<string, number>([
    ["Mobile", 0],
    ["Tablet", 0],
    ["Desktop", 0],
    ["Unknown", 0],
  ]);
  const daily = new Map<string, AnalyticsDailyPoint>();

  for (let offset = 0; offset < rangeDays; offset += 1) {
    const day = addUtcDays(rangeStart, offset);
    const date = day.toISOString().slice(0, 10);
    daily.set(date, {
      date,
      label: formatDayLabel(day),
      count: 0,
    });
  }

  for (const row of rows) {
    sessions.add(row.session_id);

    const date = row.created_at.slice(0, 10);
    const day = daily.get(date);
    if (day) {
      day.count += 1;
    }

    const pathLabel = normalizePathLabel(row.path, row.page_title);
    pathCounts.set(pathLabel, (pathCounts.get(pathLabel) ?? 0) + 1);

    const referrerLabel = classifyReferrer(row.referrer, siteHost);
    referrerCounts.set(
      referrerLabel,
      (referrerCounts.get(referrerLabel) ?? 0) + 1,
    );

    const deviceLabel = classifyDevice(row);
    deviceCounts.set(deviceLabel, (deviceCounts.get(deviceLabel) ?? 0) + 1);
  }

  const dailySeries = [...daily.values()];
  const peakDay =
    dailySeries.reduce<AnalyticsDailyPoint | null>((current, day) => {
      if (!current || day.count > current.count) return day;
      return current;
    }, null) ?? null;
  const totalPulses = rows.length;

  const topPages = toBreakdown(pathCounts, totalPulses, (label) => label);
  const referrers = toBreakdown(referrerCounts, totalPulses);
  const devices = [...deviceCounts.entries()].map(([label, count]) => ({
    label,
    count,
    percent: totalPulses > 0 ? (count / totalPulses) * 100 : 0,
  }));

  return {
    rangeDays,
    rangeStart: rangeStart.toISOString(),
    rangeEnd: now.toISOString(),
    generatedAt: now.toISOString(),
    totals: {
      pulses: totalPulses,
      sessions: sessions.size,
      uniquePaths: pathCounts.size,
      averagePerDay: dailySeries.length > 0 ? totalPulses / dailySeries.length : 0,
      peakDay,
    },
    daily: dailySeries,
    topPages,
    referrers,
    devices,
  };
});

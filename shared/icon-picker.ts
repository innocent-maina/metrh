export interface IconOption {
  name: string;
  label: string;
}

export interface IconifyCollectionResponse {
  uncategorized?: string[];
  categories?: Record<string, string[]>;
  hidden?: string[];
  aliases?: Record<string, string>;
}

export interface IconifySearchResponse {
  icons?: string[];
  total?: number;
  limit?: number;
  start?: number;
}

const POPULAR_ICON_NAMES = [
  "lucide:activity",
  "lucide:alert-triangle",
  "lucide:archive",
  "lucide:arrow-down",
  "lucide:arrow-left",
  "lucide:arrow-right",
  "lucide:book-open",
  "lucide:briefcase",
  "lucide:building-2",
  "lucide:calendar-days",
  "lucide:camera",
  "lucide:check-circle-2",
  "lucide:chevrons-right",
  "lucide:clipboard-check",
  "lucide:clipboard-list",
  "lucide:clock-3",
  "lucide:droplets",
  "lucide:file-search",
  "lucide:file-text",
  "lucide:folder-open",
  "lucide:heart-handshake",
  "lucide:heart-pulse",
  "lucide:home",
  "lucide:inbox",
  "lucide:layout-grid",
  "lucide:layout-template",
  "lucide:life-buoy",
  "lucide:map-pin",
  "lucide:megaphone",
  "lucide:microscope",
  "lucide:newspaper",
  "lucide:notebook-tabs",
  "lucide:paperclip",
  "lucide:phone-call",
  "lucide:pill",
  "lucide:search",
  "lucide:search-x",
  "lucide:settings-2",
  "lucide:shield-alert",
  "lucide:shield-check",
  "lucide:siren",
  "lucide:sparkles",
  "lucide:stethoscope",
  "lucide:syringe",
  "lucide:target",
  "lucide:trending-up",
  "lucide:user",
  "lucide:users",
  "lucide:wrench",
  "lucide:x",
] as const;

function formatIconLabel(rawName: string) {
  const iconName = rawName.includes(":") ? rawName.split(":").pop() ?? rawName : rawName;
  return iconName
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function createIconOption(name: string): IconOption {
  return {
    name,
    label: formatIconLabel(name),
  };
}

export const defaultIconOptions = POPULAR_ICON_NAMES.map(createIconOption);

export function normalizeIconQuery(query: string) {
  return query.trim().toLowerCase();
}

export function filterIconOptions(options: IconOption[], query: string) {
  const normalized = normalizeIconQuery(query);
  if (!normalized) return options;

  const terms = normalized.split(/\s+/).filter(Boolean);

  return options.filter((option) => {
    const haystack = `${option.name} ${option.label}`.toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}

export function uniqueIconOptions(options: IconOption[]) {
  const seen = new Set<string>();
  const next: IconOption[] = [];

  for (const option of options) {
    if (seen.has(option.name)) continue;
    seen.add(option.name);
    next.push(option);
  }

  return next;
}

export function flattenIconifyCollection(
  collection: IconifyCollectionResponse,
  prefix: string,
) {
  const names = new Set<string>();
  const add = (name: string | undefined) => {
    const raw = String(name ?? "").trim();
    if (!raw) return;
    names.add(raw.includes(":") ? raw : `${prefix}:${raw}`);
  };

  for (const icon of collection.uncategorized ?? []) {
    add(icon);
  }

  for (const category of Object.values(collection.categories ?? {})) {
    for (const icon of category) {
      add(icon);
    }
  }

  return Array.from(names)
    .map(createIconOption)
    .sort((left, right) => left.label.localeCompare(right.label));
}

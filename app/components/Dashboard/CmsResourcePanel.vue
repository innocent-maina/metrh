<script setup lang="ts">
import {
  buildFormValues,
  buildDashboardEditorRoute,
  getDashboardResource,
  getFieldOptions,
  getResourceCreateLabel,
  serializeFormValues,
  type CrudResourceConfig,
} from "~~/shared/dashboard-crud";
import { richTextToPlainText } from "~~/shared/rich-text";

type FilterValue =
  | string
  | number
  | boolean
  | null
  | Array<string | number | boolean>;

interface Props {
  resourceId: string;
  title: string;
  description?: string;
  queryFilters?: Record<string, FilterValue>;
  lookupQueryFilters?: Record<string, Record<string, FilterValue>>;
  createDefaults?: Record<string, unknown>;
  rowFilter?: (row: Record<string, unknown>) => boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  hideSearch?: boolean;
  usePageEditor?: boolean;
}

interface PageEditorGroup {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  order?: number;
  rows: Record<string, unknown>[];
}

const props = withDefaults(defineProps<Props>(), {
  description: "",
  queryFilters: () => ({}),
  lookupQueryFilters: () => ({}),
  createDefaults: () => ({}),
  emptyTitle: "No records yet",
  emptyDescription: "Create the first record to get started.",
  hideSearch: false,
  usePageEditor: false,
});

const route = useRoute();
const resource = computed<CrudResourceConfig | null>(() => {
  return getDashboardResource(props.resourceId)?.resource ?? null;
});

const resourceRows = ref<Record<string, unknown>[]>([]);
const resourceError = ref<string | null>(null);
const resourceLoading = ref(false);
const drawerOpen = ref(false);
const drawerMode = ref<"create" | "edit" | "view">("create");
const activeRecord = ref<Record<string, unknown> | null>(null);
const formValues = ref<Record<string, unknown>>({});
const isSaving = ref(false);
const searchTerm = ref("");
const notice = ref<string | null>(null);
const { successToast } = useAppToast();
const createButtonLabel = computed(() =>
  resource.value ? getResourceCreateLabel(resource.value) : "New record",
);
const searchLabel = computed(() =>
  props.usePageEditor ? "Search sections" : "Search",
);
const searchPlaceholder = computed(() =>
  props.usePageEditor ? "Search sections" : "Search records",
);
const resolveStorageUrl = usePublicStorageUrl();

const lookupRowsByResourceId = reactive<Record<string, Record<string, unknown>[]>>(
  {},
);

function getPrimaryKeyFields(current: CrudResourceConfig) {
  if (!current.primaryKey) return ["id"];
  return Array.isArray(current.primaryKey)
    ? current.primaryKey
    : [current.primaryKey];
}

function buildRecordIdentifier(
  current: CrudResourceConfig,
  row: Record<string, unknown>,
) {
  const keyFields = getPrimaryKeyFields(current);

  if (keyFields.length === 1) {
    const key = keyFields[0] ?? "id";
    const value = row[key];
    return { id: value == null ? "" : String(value) };
  }

  const identifier: Record<string, string> = {};
  for (const key of keyFields) {
    identifier[key] = String(row[key] ?? "");
  }

  return { identifier };
}

async function loadResourceRows(
  resourceId: string,
  filters: Record<string, FilterValue> = {},
) {
  const current = getDashboardResource(resourceId)?.resource;
  if (!current) return [];

  return await fetchDashboardResourceRows(resourceId, filters);
}

async function loadAll() {
  const current = resource.value;
  if (!current) return;

  resourceLoading.value = true;
  resourceError.value = null;

  try {
    resourceRows.value = await loadResourceRows(current.id, props.queryFilters);

    const lookupResourceIds = new Set(
      current.fields
        .map((field) => field.optionsFromResourceId)
        .filter((value): value is string => Boolean(value)),
    );

    await Promise.all(
      Array.from(lookupResourceIds).map(async (lookupResourceId) => {
        lookupRowsByResourceId[lookupResourceId] = await loadResourceRows(
          lookupResourceId,
          props.lookupQueryFilters[lookupResourceId] ?? {},
        );
      }),
    );
  } catch (error) {
    resourceError.value =
      error instanceof Error ? error.message : "Could not load records.";
    resourceRows.value = [];
  } finally {
    resourceLoading.value = false;
  }
}

const refreshKey = computed(() =>
  JSON.stringify({
    resourceId: props.resourceId,
    queryFilters: props.queryFilters,
    lookupQueryFilters: props.lookupQueryFilters,
  }),
);

watch(refreshKey, loadAll, { immediate: true });

function openCreate() {
  const current = resource.value;
  if (!current || current.allowCreate === false) return;

  if (props.usePageEditor) {
    navigateTo(
      buildDashboardEditorRoute(current, {
        mode: "create",
        defaults: props.createDefaults,
        backTo: route.fullPath,
      }),
    );
    return;
  }

  drawerMode.value = "create";
  activeRecord.value = null;
  formValues.value = {
    ...buildFormValues(current),
    ...props.createDefaults,
  };
  drawerOpen.value = true;
  notice.value = null;
}

function openRecord(row: Record<string, unknown>) {
  const current = resource.value;
  if (!current) return;

  const rawRow = (row.__rawRow as Record<string, unknown> | undefined) ?? row;

  if (props.usePageEditor) {
    navigateTo(
      buildDashboardEditorRoute(current, {
        mode: current.allowUpdate === false ? "view" : "edit",
        row: rawRow,
        backTo: route.fullPath,
      }),
    );
    return;
  }

  drawerMode.value = current.allowUpdate === false ? "view" : "edit";
  activeRecord.value = rawRow;
  formValues.value = buildFormValues(current, rawRow);
  drawerOpen.value = true;
  notice.value = null;
}

function closeDrawer() {
  drawerOpen.value = false;
  activeRecord.value = null;
}

async function submitRecord() {
  const current = resource.value;
  if (!current || drawerMode.value === "view") return;

  isSaving.value = true;
  notice.value = null;

  try {
    const payload = serializeFormValues(current, formValues.value, drawerMode.value);

    if (drawerMode.value === "create") {
      await $fetch(`/api/dashboard/${current.id}`, {
        method: "POST",
        body: { data: payload },
      });
      successToast(`${current.label} created successfully.`);
    } else if (activeRecord.value) {
      await $fetch(`/api/dashboard/${current.id}`, {
        method: "PATCH",
        body: {
          ...buildRecordIdentifier(current, activeRecord.value),
          data: payload,
        },
      });
      successToast(`${current.label} updated successfully.`);
    }

    notice.value = null;
    await loadAll();
    closeDrawer();
  } catch (error) {
    notice.value =
      error instanceof Error ? error.message : "Could not save the record.";
  } finally {
    isSaving.value = false;
  }
}

async function deleteRecord(row: Record<string, unknown>) {
  const current = resource.value;
  if (!current || current.allowDelete === false) return;

  const rawRow = (row.__rawRow as Record<string, unknown> | undefined) ?? row;
  const label = String(
    row[current.rowLabelKey ?? "id"] ??
      rawRow[current.rowLabelKey ?? "id"] ??
      row.id ??
      rawRow.id ??
      "record",
  );
  const confirmed = window.confirm(
    `Delete ${current.label.toLowerCase()} "${label}"?`,
  );
  if (!confirmed) return;

  try {
    await $fetch(`/api/dashboard/${current.id}`, {
      method: "DELETE",
      body: buildRecordIdentifier(current, rawRow),
    });
    successToast(`${current.label} deleted successfully.`);
    notice.value = null;
    await loadAll();
  } catch (error) {
    notice.value =
      error instanceof Error ? error.message : "Could not delete the record.";
  }
}

const resolvedFields = computed(() => {
  const current = resource.value;
  if (!current) return [];

  return current.fields.map((field) => ({
    ...field,
    options: getFieldOptions(field, lookupRowsByResourceId),
  }));
});

const displayRows = computed(() => {
  const current = resource.value;
  if (!current) return [];

  const selectFields = current.fields.filter(
    (field) => field.kind === "select" || field.kind === "multiselect",
  );

  return resourceRows.value.map((row) => {
    const copy: Record<string, unknown> = { ...row, __rawRow: row };

    for (const field of selectFields) {
      const options = getFieldOptions(field, lookupRowsByResourceId);
      const value = row[field.key];

      if (field.kind === "multiselect") {
        const selected = Array.isArray(value)
          ? value.map((entry) => String(entry))
          : value == null || value === ""
            ? []
            : [String(value)];

        copy[field.key] = selected
          .map(
            (entry) =>
              options.find((option) => option.value === entry)?.label ?? entry,
          )
          .join(", ");
        continue;
      }

      const match = options.find((option) => option.value === String(value ?? ""));
      if (match) {
        copy[field.key] = match.label;
      }
    }

    return copy;
  });
});

const filteredRows = computed(() => {
  const rows = props.rowFilter
    ? displayRows.value.filter((row) => props.rowFilter?.(row))
    : displayRows.value;

  const term = searchTerm.value.trim().toLowerCase();
  if (!term) return rows;

  return rows.filter((row) =>
    Object.entries(row).some(
      ([key, value]) =>
        !key.startsWith("__") &&
        String(value ?? "").toLowerCase().includes(term),
    ),
  );
});

function getRawValue(row: Record<string, unknown>, key: string) {
  const rawRow = row.__rawRow as Record<string, unknown> | undefined;
  return row[key] ?? rawRow?.[key];
}

function getRowTitle(row: Record<string, unknown>) {
  return (
    String(getRawValue(row, "title") ?? "").trim() ||
    String(getRawValue(row, "name") ?? "").trim() ||
    String(getRawValue(row, "section_key") ?? "").trim() ||
    String(getRawValue(row, "slug") ?? "").trim() ||
    String(getRawValue(row, "id") ?? "").trim() ||
    "Untitled record"
  );
}

function getRowSummary(value: unknown, limit = 180) {
  const text = richTextToPlainText(String(value ?? ""))
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return "";
  if (text.length <= limit) return text;

  return `${text.slice(0, limit - 1).trimEnd()}…`;
}

function resolveImageUrl(value: unknown) {
  return resolveStorageUrl(String(value ?? ""), "media");
}

function getBooleanLabel(value: unknown) {
  return value ? "Active" : "Inactive";
}

function formatDateTime(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return raw;
  }

  return parsed.toLocaleString();
}

function sortByDisplayOrder(rows: Record<string, unknown>[]) {
  return [...rows].sort((left, right) => {
    const leftOrder = Number(getRawValue(left, "display_order") ?? 0);
    const rightOrder = Number(getRawValue(right, "display_order") ?? 0);

    if (leftOrder !== rightOrder) return leftOrder - rightOrder;

    return getRowTitle(left).localeCompare(getRowTitle(right));
  });
}

const pageEditorGroups = computed<PageEditorGroup[]>(() => {
  const current = resource.value;
  if (!current) return [];

  const rows = sortByDisplayOrder(filteredRows.value);

  if (current.id !== "page_section_items") {
    return [
      {
        id: `${current.id}-group`,
        title: current.label,
        description: current.description,
        rows,
      },
    ];
  }

  const pageSections = lookupRowsByResourceId.page_sections ?? [];
  const sectionsById = new Map<string, Record<string, unknown>>();
  for (const section of pageSections) {
    sectionsById.set(String(section.id ?? ""), section);
  }

  const grouped = new Map<
    string,
    {
      section: Record<string, unknown> | null;
      rows: Record<string, unknown>[];
    }
  >();

  for (const row of rows) {
    const rawRow = row.__rawRow as Record<string, unknown> | undefined;
    const sectionId = String(rawRow?.section_id ?? row.section_id ?? "");
    const section = sectionsById.get(sectionId) ?? null;
    const key = sectionId || `group-${row.id ?? getRowTitle(row)}`;

    if (!grouped.has(key)) {
      grouped.set(key, { section, rows: [] });
    }

    grouped.get(key)?.rows.push(row);
  }

  return [...grouped.entries()]
    .map(([id, value]) => {
      const section = value.section;
      return {
        id,
        title:
          String(section?.title ?? "").trim() ||
          String(section?.section_key ?? "").trim() ||
          "Ungrouped section items",
        subtitle:
          String(section?.section_key ?? "").trim() ||
          String(section?.page_slug ?? "").trim() ||
          undefined,
        description:
          String(section?.summary ?? "").trim() ||
          getRowSummary(section?.body ?? null) ||
          undefined,
        order: Number(section?.display_order ?? 0),
        rows: sortByDisplayOrder(value.rows),
      };
    })
    .sort((left, right) => {
      if (left.order !== right.order) return left.order - right.order;
      return left.title.localeCompare(right.title);
    });
});
</script>

<template>
  <section class="rounded-card border border-border bg-surface p-5 shadow-card">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p class="text-caption font-semibold uppercase tracking-wide text-info">
          {{ title }}
        </p>
        <p v-if="description" class="mt-2 max-w-3xl text-small text-ink-muted">
          {{ description }}
        </p>
        <p v-if="props.usePageEditor" class="mt-3 text-caption text-ink-muted">
          Cards are ordered to match the public page layout.
        </p>
      </div>

      <button
        v-if="resource && resource.allowCreate !== false"
        type="button"
        class="inline-flex items-center gap-2 rounded-control bg-primary px-4 py-2.5 text-small font-semibold text-white hover:bg-primary-dark"
        @click="openCreate"
      >
        <Icon name="lucide:plus" class="size-4" aria-hidden="true" />
        {{ createButtonLabel }}
      </button>
    </div>

    <div v-if="notice" class="mt-4 rounded-card border border-border bg-surface-alt px-4 py-3 text-small text-ink">
      {{ notice }}
    </div>

    <div v-if="resourceError" class="mt-4 rounded-card border border-danger/30 bg-danger/5 px-4 py-3 text-small text-danger">
      {{ resourceError }}
    </div>

    <div v-if="!hideSearch" class="mt-5">
      <label class="block">
        <span class="mb-2 block text-small font-semibold text-ink">
          {{ searchLabel }}
        </span>
        <input
          v-model="searchTerm"
          type="search"
          class="w-full rounded-card border border-border bg-surface px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary"
          :placeholder="searchPlaceholder"
        />
      </label>
    </div>

    <div class="mt-5">
      <template v-if="resource && props.usePageEditor">
        <div v-if="resourceLoading" class="rounded-card border border-border bg-surface px-5 py-4 text-small text-ink-muted">
          Loading {{ resource.label.toLowerCase() }}...
        </div>

        <div v-else-if="pageEditorGroups.length" class="space-y-5">
          <section
            v-for="group in pageEditorGroups"
            :key="group.id"
            class="rounded-card border border-border bg-surface p-5 shadow-card"
          >
            <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div class="max-w-3xl">
                <p class="text-caption font-semibold uppercase tracking-wide text-info">
                  Page layout
                </p>
                <h3 class="mt-1 font-display text-h3 text-ink">
                  {{ group.title }}
                </h3>
                <p v-if="group.subtitle" class="mt-1 text-small font-medium text-ink-muted">
                  {{ group.subtitle }}
                </p>
                <p v-if="group.description" class="mt-2 text-small text-ink-muted">
                  {{ group.description }}
                </p>
              </div>

              <p class="text-caption font-semibold uppercase tracking-wide text-ink-muted">
                {{ group.rows.length }} {{ group.rows.length === 1 ? "record" : "records" }}
              </p>
            </div>

            <div class="mt-5 space-y-4">
              <article
                v-for="row in group.rows"
                :key="String(getRawValue(row, 'id') ?? row.id ?? getRowTitle(row))"
                class="rounded-card border border-border bg-[#fbfcfe] p-4 transition-colors hover:border-primary/20 hover:bg-white md:p-5"
              >
                <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div class="min-w-0 flex-1 space-y-4">
                    <div class="flex flex-wrap items-center gap-2">
                      <h4 class="min-w-0 font-display text-h4 text-ink">
                        {{ getRowTitle(row) }}
                      </h4>
                      <span
                        v-if="getRawValue(row, 'is_active') !== undefined"
                        class="rounded-full border border-border bg-surface-alt px-2.5 py-1 text-caption font-semibold uppercase tracking-wide text-ink-muted"
                      >
                        {{ getBooleanLabel(getRawValue(row, "is_active")) }}
                      </span>
                      <span
                        v-if="getRawValue(row, 'display_order') !== undefined"
                        class="rounded-full border border-border bg-surface-alt px-2.5 py-1 text-caption font-semibold uppercase tracking-wide text-ink-muted"
                      >
                        Order {{ getRawValue(row, "display_order") }}
                      </span>
                    </div>

                    <div v-if="resource.id === 'page_sections'" class="space-y-3">
                      <p
                        v-if="String(getRawValue(row, 'eyebrow') ?? '').trim()"
                        class="text-caption font-semibold uppercase tracking-wide text-info"
                      >
                        {{ getRawValue(row, "eyebrow") }}
                      </p>

                      <p v-if="getRowSummary(getRawValue(row, 'summary'))" class="text-small text-ink-muted">
                        {{ getRowSummary(getRawValue(row, "summary")) }}
                      </p>

                      <p v-if="getRowSummary(getRawValue(row, 'body'))" class="text-small text-ink-muted">
                        {{ getRowSummary(getRawValue(row, "body")) }}
                      </p>

                      <div class="flex flex-wrap gap-2">
                        <span class="rounded-full border border-border bg-surface-alt px-3 py-1 text-caption font-semibold uppercase tracking-wide text-ink-muted">
                          {{ String(getRawValue(row, "page_slug") ?? row.page_slug ?? "page") }}
                        </span>
                        <span class="rounded-full border border-border bg-surface-alt px-3 py-1 text-caption font-semibold uppercase tracking-wide text-ink-muted">
                          {{ String(getRawValue(row, "section_key") ?? row.section_key ?? "section") }}
                        </span>
                        <span class="rounded-full border border-border bg-surface-alt px-3 py-1 text-caption font-semibold uppercase tracking-wide text-ink-muted">
                          {{ String(getRawValue(row, "section_type") ?? row.section_type ?? "content") }}
                        </span>
                        <span
                          v-if="String(getRawValue(row, 'cta_label') ?? '').trim()"
                          class="rounded-full border border-border bg-surface-alt px-3 py-1 text-caption font-semibold uppercase tracking-wide text-ink-muted"
                        >
                          CTA: {{ getRawValue(row, "cta_label") }}
                        </span>
                      </div>
                    </div>

                    <div v-else-if="resource.id === 'page_section_items'" class="space-y-3">
                      <p class="text-small text-ink-muted">
                        Section:
                        <span class="font-semibold text-ink">
                          {{ String(getRawValue(row, "section_id") ?? row.section_id ?? "Unassigned") }}
                        </span>
                      </p>

                      <p v-if="getRowSummary(getRawValue(row, 'description'))" class="text-small text-ink-muted">
                        {{ getRowSummary(getRawValue(row, "description")) }}
                      </p>

                      <div class="flex flex-wrap gap-2">
                        <span
                          v-if="String(getRawValue(row, 'icon') ?? '').trim()"
                          class="rounded-full border border-border bg-surface-alt px-3 py-1 text-caption font-semibold uppercase tracking-wide text-ink-muted"
                        >
                          Icon: {{ getRawValue(row, "icon") }}
                        </span>
                        <span class="rounded-full border border-border bg-surface-alt px-3 py-1 text-caption font-semibold uppercase tracking-wide text-ink-muted">
                          {{ String(getRawValue(row, "section_id") ?? row.section_id ?? "section") }}
                        </span>
                        <span
                          v-if="String(getRawValue(row, 'cta_label') ?? '').trim()"
                          class="rounded-full border border-border bg-surface-alt px-3 py-1 text-caption font-semibold uppercase tracking-wide text-ink-muted"
                        >
                          CTA: {{ getRawValue(row, "cta_label") }}
                        </span>
                      </div>
                    </div>

                    <div v-else-if="resource.id === 'page_slides'" class="space-y-3">
                      <p v-if="String(getRawValue(row, 'eyebrow') ?? '').trim()" class="text-caption font-semibold uppercase tracking-wide text-info">
                        {{ getRawValue(row, "eyebrow") }}
                      </p>

                      <p v-if="getRowSummary(getRawValue(row, 'body'))" class="text-small text-ink-muted">
                        {{ getRowSummary(getRawValue(row, "body")) }}
                      </p>

                      <p v-if="String(getRawValue(row, 'caption') ?? '').trim()" class="text-small text-ink-muted">
                        {{ getRawValue(row, "caption") }}
                      </p>

                      <div class="flex flex-wrap gap-2">
                        <span class="rounded-full border border-border bg-surface-alt px-3 py-1 text-caption font-semibold uppercase tracking-wide text-ink-muted">
                          {{ String(getRawValue(row, "page_slug") ?? row.page_slug ?? "page") }}
                        </span>
                        <span class="rounded-full border border-border bg-surface-alt px-3 py-1 text-caption font-semibold uppercase tracking-wide text-ink-muted">
                          {{ String(getRawValue(row, "section_key") ?? row.section_key ?? "hero") }}
                        </span>
                        <span
                          v-if="String(getRawValue(row, 'cta_label') ?? '').trim()"
                          class="rounded-full border border-border bg-surface-alt px-3 py-1 text-caption font-semibold uppercase tracking-wide text-ink-muted"
                        >
                          CTA: {{ getRawValue(row, "cta_label") }}
                        </span>
                      </div>
                    </div>

                    <div class="flex flex-wrap items-center gap-2 border-t border-border pt-3 text-caption text-ink-muted">
                      <span class="rounded-full bg-surface-alt px-3 py-1 font-semibold uppercase tracking-wide">
                        {{ resource.label }}
                      </span>
                      <span v-if="String(getRawValue(row, 'updated_at') ?? '').trim()" class="font-mono">
                        Updated {{ formatDateTime(getRawValue(row, "updated_at")) }}
                      </span>
                    </div>
                  </div>

                  <div class="flex shrink-0 flex-col gap-3 xl:w-[280px]">
                    <div
                      v-if="String(getRawValue(row, 'image_url') ?? '').trim()"
                      class="overflow-hidden rounded-card border border-border bg-surface-alt"
                    >
                      <img
                        :src="resolveImageUrl(getRawValue(row, 'image_url'))"
                        :alt="String(getRawValue(row, 'image_alt') ?? getRowTitle(row))"
                        class="h-44 w-full object-cover"
                      />
                    </div>

                    <div v-else class="rounded-card border border-border bg-surface-alt px-4 py-5 text-small text-ink-muted">
                      <p class="font-semibold text-ink">No image attached</p>
                      <p class="mt-1">
                        {{ resource.id === "page_section_items" ? "Use this item card to manage text, icon, and action copy." : "This section is text-driven and can still include a body, CTA, or rich content." }}
                      </p>
                    </div>

                    <div class="flex items-center justify-end gap-2">
                      <BaseTableActionButton
                        label="Open record"
                        icon="lucide:eye"
                        tone="open"
                        @click="openRecord(row)"
                      />
                      <BaseTableActionButton
                        v-if="resource.allowUpdate !== false"
                        label="Edit record"
                        icon="lucide:pen-line"
                        tone="edit"
                        @click="openRecord(row)"
                      />
                      <BaseTableActionButton
                        v-if="resource.allowDelete !== false"
                        label="Delete record"
                        icon="lucide:trash-2"
                        tone="delete"
                        @click="deleteRecord(row)"
                      />
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </section>
        </div>

        <div v-else class="rounded-card border border-border bg-surface px-5 py-10 text-center">
          <p class="font-display text-h4 text-ink">{{ emptyTitle }}</p>
          <p class="mt-2 text-small text-ink-muted">{{ emptyDescription }}</p>
          <div v-if="$slots.empty" class="mt-4">
            <slot name="empty" />
          </div>
        </div>
      </template>

      <BaseTable
        v-else-if="resource"
        :columns="resource.columns"
        :rows="filteredRows"
        :row-key="resource.primaryKey ?? 'id'"
        :loading="resourceLoading"
        :empty-title="emptyTitle"
        :empty-description="emptyDescription"
        actions-label="Table actions"
      >
        <template #actions="{ row }">
          <div class="flex items-center justify-end gap-2">
            <BaseTableActionButton
              label="Open record"
              icon="lucide:eye"
              tone="open"
              @click="openRecord(row)"
            />
            <BaseTableActionButton
              v-if="resource.allowUpdate !== false"
              label="Edit record"
              icon="lucide:pen-line"
              tone="edit"
              @click="openRecord(row)"
            />
            <BaseTableActionButton
              v-if="resource.allowDelete !== false"
              label="Delete record"
              icon="lucide:trash-2"
              tone="delete"
              @click="deleteRecord(row)"
            />
          </div>
        </template>
      </BaseTable>
    </div>

    <BaseCrudDrawer
      v-if="resource && !props.usePageEditor"
      v-model:open="drawerOpen"
      :title="`${drawerMode === 'create' ? 'Create' : drawerMode === 'edit' ? 'Edit' : 'View'} ${resource.label}`"
      :description="resource.description"
      :fields="resolvedFields"
      :model-value="formValues"
      :submit-label="drawerMode === 'create' ? 'Create record' : 'Save changes'"
      :loading="isSaving"
      :read-only="drawerMode === 'view'"
      @update:modelValue="formValues = $event"
      @submit="submitRecord"
      @cancel="closeDrawer"
    />
  </section>
</template>

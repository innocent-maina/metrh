<script setup lang="ts">
import {
  buildFormValues,
  getDashboardResource,
  getFieldOptions,
  serializeFormValues,
  type CrudResourceConfig,
} from "~~/shared/dashboard-crud";

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
}

const props = withDefaults(defineProps<Props>(), {
  description: "",
  queryFilters: () => ({}),
  lookupQueryFilters: () => ({}),
  createDefaults: () => ({}),
  emptyTitle: "No records yet",
  emptyDescription: "Create the first record to get started.",
  hideSearch: false,
});

const supabase = useSupabaseClient();
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

function applyFilters(
  query: ReturnType<typeof supabase.from>,
  filters: Record<string, FilterValue>,
) {
  let nextQuery = query;
  for (const [key, value] of Object.entries(filters)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      const entries = value.map((entry) => String(entry));
      if (entries.length > 0) {
        nextQuery = nextQuery.in(key, entries);
      }
      continue;
    }

    nextQuery = nextQuery.eq(key, value as never);
  }
  return nextQuery;
}

async function loadResourceRows(
  resourceId: string,
  filters: Record<string, FilterValue> = {},
) {
  const current = getDashboardResource(resourceId)?.resource;
  if (!current) return [];

  let query = supabase.from(current.table as never).select("*");
  query = applyFilters(query, filters);

  if (current.defaultSort) {
    query = query.order(current.defaultSort.key, {
      ascending: current.defaultSort.ascending ?? false,
    });
  }

  if (current.singleton) {
    query = query.limit(1);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as Record<string, unknown>[];
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
    const payload = serializeFormValues(current, formValues.value);

    if (drawerMode.value === "create") {
      await $fetch(`/api/dashboard/${current.id}`, {
        method: "POST",
        body: { data: payload },
      });
      notice.value = `${current.label} created successfully.`;
    } else if (activeRecord.value) {
      await $fetch(`/api/dashboard/${current.id}`, {
        method: "PATCH",
        body: {
          ...buildRecordIdentifier(current, activeRecord.value),
          data: payload,
        },
      });
      notice.value = `${current.label} updated successfully.`;
    }

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
  const label = String(rawRow[current.rowLabelKey ?? "id"] ?? rawRow.id ?? "record");
  const confirmed = window.confirm(
    `Delete ${current.label.toLowerCase()} "${label}"?`,
  );
  if (!confirmed) return;

  try {
    await $fetch(`/api/dashboard/${current.id}`, {
      method: "DELETE",
      body: buildRecordIdentifier(current, rawRow),
    });
    notice.value = `${current.label} deleted successfully.`;
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
      </div>

      <button
        v-if="resource && resource.allowCreate !== false"
        type="button"
        class="rounded-control bg-primary px-4 py-2.5 text-small font-semibold text-white hover:bg-primary-dark"
        @click="openCreate"
      >
        New record
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
        <span class="mb-2 block text-small font-semibold text-ink">Search</span>
        <input
          v-model="searchTerm"
          type="search"
          class="w-full rounded-card border border-border bg-surface px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary"
          placeholder="Search records"
        />
      </label>
    </div>

    <div class="mt-5">
      <BaseTable
        v-if="resource"
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
            <button
              type="button"
              class="rounded-control border border-border px-3 py-1.5 text-caption font-semibold uppercase tracking-wide text-ink hover:bg-surface-alt"
              @click="openRecord(row)"
            >
              Open
            </button>
            <button
              v-if="resource.allowUpdate !== false"
              type="button"
              class="rounded-control border border-primary/30 px-3 py-1.5 text-caption font-semibold uppercase tracking-wide text-primary hover:bg-primary/5"
              @click="openRecord(row)"
            >
              Edit
            </button>
            <button
              v-if="resource.allowDelete !== false"
              type="button"
              class="rounded-control border border-danger/30 px-3 py-1.5 text-caption font-semibold uppercase tracking-wide text-danger hover:bg-danger/5"
              @click="deleteRecord(row)"
            >
              Delete
            </button>
          </div>
        </template>
      </BaseTable>
    </div>

    <BaseCrudDrawer
      v-if="resource"
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

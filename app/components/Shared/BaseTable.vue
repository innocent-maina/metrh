<script setup lang="ts">
import type { CrudColumn } from "~~/shared/dashboard-crud";

interface Props {
  columns: CrudColumn[];
  rows: Record<string, unknown>[];
  rowKey?: string | string[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  actionsLabel?: string;
  showActions?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  rowKey: "id",
  loading: false,
  emptyTitle: "No records yet",
  emptyDescription: "Create the first record to get started.",
  actionsLabel: "Actions",
  showActions: true,
});

const hasRows = computed(() => props.rows.length > 0);

function formatCell(value: unknown, kind?: CrudColumn["kind"]) {
  if (value == null || value === "") return "—";

  if (kind === "boolean") {
    return value ? "Yes" : "No";
  }

  if (kind === "date") {
    const text = String(value);
    return text.length >= 10 ? text.slice(0, 10) : text;
  }

  if (kind === "time") {
    const text = String(value);
    return text.length >= 5 ? text.slice(0, 5) : text;
  }

  return String(value);
}

function getRowKey(row: Record<string, unknown>) {
  const source = (row.__rawRow as Record<string, unknown> | undefined) ?? row;

  if (Array.isArray(props.rowKey)) {
    return props.rowKey.map((key) => String(source[key] ?? "")).join("::");
  }

  return String(source[props.rowKey] ?? props.rowKey);
}
</script>

<template>
  <div class="overflow-hidden rounded-card border border-border bg-white">
    <div v-if="loading" class="border-b border-border px-5 py-4 text-small text-ink-muted">
      Loading records...
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-border text-left">
        <thead class="bg-surface-alt">
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              class="px-5 py-3 text-caption font-semibold uppercase tracking-wide text-ink-muted"
              :class="column.class"
            >
              {{ column.label }}
            </th>
            <th
              v-if="showActions"
              scope="col"
              class="px-5 py-3 text-right text-caption font-semibold uppercase tracking-wide text-ink-muted"
            >
              {{ actionsLabel }}
            </th>
          </tr>
        </thead>

        <tbody v-if="hasRows" class="divide-y divide-border">
          <tr v-for="row in rows" :key="getRowKey(row)">
            <td
              v-for="column in columns"
              :key="column.key"
              class="px-5 py-4 text-small text-ink"
              :class="column.class"
            >
              {{ formatCell(row[column.key], column.kind) }}
            </td>
            <td v-if="showActions" class="px-5 py-4 text-right">
              <slot name="actions" :row="row" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="!hasRows && !loading" class="border-t border-border px-5 py-10 text-center">
      <p class="font-display text-h4 text-ink">{{ emptyTitle }}</p>
      <p class="mt-2 text-small text-ink-muted">{{ emptyDescription }}</p>
      <div v-if="$slots.empty" class="mt-4">
        <slot name="empty" />
      </div>
    </div>
  </div>
</template>

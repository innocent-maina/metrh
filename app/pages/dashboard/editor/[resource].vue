<script setup lang="ts">
import type { CrudEditorMode } from "~~/shared/dashboard-crud";

definePageMeta({ layout: "dashboard" });

const route = useRoute();

const resourceId = computed(() => String(route.params.resource ?? ""));

const mode = computed<CrudEditorMode>(() => {
  const raw = String(route.query.mode ?? "");
  if (raw === "create" || raw === "edit" || raw === "view") {
    return raw;
  }

  if (String(route.query.id ?? "") || String(route.query.identifier ?? "")) {
    return "edit";
  }

  return "create";
});

const recordId = computed(() => String(route.query.id ?? ""));

const recordIdentifier = computed<Record<string, string>>(() => {
  const raw = route.query.identifier;
  if (typeof raw !== "string" || !raw.trim()) return {};

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed).map(([key, value]) => [key, String(value ?? "")]),
    );
  } catch {
    return {};
  }
});

const defaults = computed<Record<string, unknown>>(() => {
  const raw = route.query.defaults;
  if (typeof raw !== "string" || !raw.trim()) return {};

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return parsed ?? {};
  } catch {
    return {};
  }
});

const backTo = computed(() => String(route.query.backTo ?? "/dashboard"));
</script>

<template>
  <JobPostingEditor
    v-if="resourceId === 'job_postings'"
    :mode="mode"
    :record-id="recordId"
    :record-identifier="recordIdentifier"
    :defaults="defaults"
    :back-to="backTo"
  />
  <CmsResourceEditor
    v-else
    :resource-id="resourceId"
    :mode="mode"
    :record-id="recordId"
    :record-identifier="recordIdentifier"
    :defaults="defaults"
    :back-to="backTo"
  />
</template>

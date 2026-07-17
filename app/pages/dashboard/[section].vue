<script setup lang="ts">
import {
  buildFormValues,
  buildDashboardEditorRoute,
  getDashboardSection,
  getFieldOptions,
  serializeFormValues,
  type CrudResourceConfig,
} from "~~/shared/dashboard-crud";

definePageMeta({ layout: "dashboard" });

const route = useRoute();
const router = useRouter();
const { hasRole } = useDashboardRoles();

const sectionId = computed(() => String(route.params.section ?? ""));
const section = computed(() => getDashboardSection(sectionId.value));

if (!section.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "Dashboard section not found.",
  });
}

const visibleResources = computed(() => {
  const current = section.value;
  if (!current) return [];

  const resources =
    current.id === "careers"
      ? current.resources.filter((resource) => resource.id === "job_postings")
      : current.id === "tenders"
        ? current.resources.filter((resource) => resource.id === "tenders")
      : current.resources;

  return resources.filter((resource) =>
    resource.readRoles.some((role) => hasRole(role)),
  );
});

if (visibleResources.value.length === 0) {
  await navigateTo("/dashboard/unauthorized");
}

useSeoMeta({
  title: () => `${section.value?.label} — MeTRH Dashboard`,
  description: () => section.value?.description,
});

const resourceRows = reactive<Record<string, Record<string, unknown>[]>>({});
const resourceErrors = reactive<Record<string, string | null>>({});
const resourceLoading = reactive<Record<string, boolean>>({});
const drawerOpen = ref(false);
const drawerMode = ref<"create" | "edit" | "view">("create");
const activeResourceId = ref<string>(
  String(route.query.resource ?? visibleResources.value[0]?.id ?? ""),
);
const activeRecord = ref<Record<string, unknown> | null>(null);
const formValues = ref<Record<string, unknown>>({});
const isSaving = ref(false);
const isResettingPassword = ref(false);
const notice = ref<string | null>(null);
const tempPassword = ref<string | null>(null);
const tempPasswordFor = ref<string | null>(null);
const searchTerm = ref("");
const isCareersSection = computed(() => section.value?.id === "careers");
const isSingletonResource = computed(() => Boolean(currentResource.value?.singleton));
const useEditorPage = computed(() =>
  ["blog", "careers", "services", "tenders"].includes(section.value?.id ?? ""),
);

const searchPlaceholder = computed(() => "Search records");

watch(
  visibleResources,
  (resources) => {
    if (resources.length === 0) return;

    const activeId = activeResourceId.value;
    const isValid = resources.some((resource) => resource.id === activeId);
    if (!isValid) {
      const firstResource = resources[0];
      if (firstResource) {
        activeResourceId.value = firstResource.id;
      }
    }
  },
  { immediate: true },
);

watch(
  () => route.query.resource,
  (resourceId) => {
    const nextId = String(resourceId ?? "");
    if (nextId && nextId !== activeResourceId.value) {
      activeResourceId.value = nextId;
    }
  },
);

watch(activeResourceId, async (resourceId) => {
  if (!resourceId) return;

  const currentQuery = String(route.query.resource ?? "");
  if (currentQuery !== resourceId) {
    await router.replace({
      query: { ...route.query, resource: resourceId },
    });
  }
});

const currentResource = computed<CrudResourceConfig | null>(() => {
  return (
    visibleResources.value.find(
      (resource) => resource.id === activeResourceId.value,
    ) ??
    visibleResources.value[0] ??
    null
  );
});

const canWriteCurrentResource = computed(() => {
  const resource = currentResource.value;
  if (!resource) return false;
  return (resource.writeRoles ?? resource.readRoles).some((role) =>
    hasRole(role),
  );
});

watch(
  currentResource,
  (resource) => {
    if (!resource?.singleton) return;

    const row = resourceRows[resource.id]?.[0] ?? null;
    activeRecord.value = row;
    formValues.value = buildFormValues(resource, row);
    drawerMode.value = "edit";
  },
  { immediate: true },
);

function getPrimaryKeyFields(resource: CrudResourceConfig) {
  if (!resource.primaryKey) return ["id"];
  return Array.isArray(resource.primaryKey)
    ? resource.primaryKey
    : [resource.primaryKey];
}

function buildRecordIdentifier(
  resource: CrudResourceConfig,
  row: Record<string, unknown>,
) {
  const keyFields = getPrimaryKeyFields(resource);

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

async function loadResource(resourceId: string) {
  resourceLoading[resourceId] = true;
  resourceErrors[resourceId] = null;

  try {
    const resourceMeta = visibleResources.value.find(
      (resource) => resource.id === resourceId,
    );

    if (!resourceMeta) {
      resourceRows[resourceId] = [];
      return;
    }

    resourceRows[resourceId] = await fetchDashboardResourceRows(resourceMeta.id);

    if (resourceMeta.singleton && currentResource.value?.id === resourceMeta.id) {
      const row = resourceRows[resourceId][0] ?? null;
      activeRecord.value = row;
      formValues.value = buildFormValues(resourceMeta, row);
      drawerMode.value = "edit";
    }
  } catch (error) {
    resourceErrors[resourceId] =
      error instanceof Error ? error.message : "Could not load records.";
    resourceRows[resourceId] = [];
  } finally {
    resourceLoading[resourceId] = false;
  }
}

async function refreshActiveResource() {
  if (!currentResource.value) return;
  await loadResource(currentResource.value.id);
}

async function openRecord(row: Record<string, unknown>) {
  const resource = currentResource.value;
  if (!resource) return;

  const rawRow = (row.__rawRow as Record<string, unknown> | undefined) ?? row;

  if (useEditorPage.value) {
    await navigateTo(
      buildDashboardEditorRoute(resource, {
        mode: canWriteCurrentResource.value ? "edit" : "view",
        row: rawRow,
        backTo: route.fullPath,
      }),
    );
    return;
  }

  drawerMode.value = canWriteCurrentResource.value ? "edit" : "view";
  activeRecord.value = rawRow;
  formValues.value = buildFormValues(resource, rawRow);
  drawerOpen.value = true;
  notice.value = null;
  tempPassword.value = null;
  tempPasswordFor.value = null;
}

function closeDrawer() {
  drawerOpen.value = false;
  activeRecord.value = null;
}

async function submitRecord() {
  const resource = currentResource.value;
  if (!resource || drawerMode.value === "view") return;

  isSaving.value = true;
  notice.value = null;

  try {
    const payload = serializeFormValues(
      resource,
      formValues.value,
      drawerMode.value,
    );

    if (drawerMode.value === "create") {
      const result = await $fetch<{
        row: Record<string, unknown>;
        tempPassword?: string;
      }>(`/api/dashboard/${resource.id}`, {
        method: "POST",
        body: { data: payload },
      });
      notice.value = `${resource.label} created successfully.`;
      if (resource.id === "profiles" && result.tempPassword) {
        tempPassword.value = result.tempPassword;
        tempPasswordFor.value = String(formValues.value.email ?? "");
      }
    } else if (activeRecord.value) {
      await $fetch(`/api/dashboard/${resource.id}`, {
        method: "PATCH",
        body: {
          ...buildRecordIdentifier(resource, activeRecord.value),
          data: payload,
        },
      });
      notice.value = `${resource.label} updated successfully.`;
    }

    await refreshActiveResource();
    closeDrawer();
  } catch (error) {
    notice.value =
      error instanceof Error ? error.message : "Could not save the record.";
  } finally {
    isSaving.value = false;
  }
}

async function resetPasswordForCurrentProfile() {
  const resource = currentResource.value;
  if (!resource || resource.id !== "profiles" || !activeRecord.value) return;

  isResettingPassword.value = true;
  notice.value = null;

  try {
    const result = await $fetch<{ tempPassword: string }>(
      `/api/dashboard/profiles/${String(activeRecord.value.id)}/reset-password`,
      { method: "POST" },
    );
    tempPassword.value = result.tempPassword;
    tempPasswordFor.value = String(activeRecord.value.email ?? "");
    notice.value = "Password reset successfully.";
  } catch (error) {
    notice.value =
      error instanceof Error ? error.message : "Could not reset the password.";
  } finally {
    isResettingPassword.value = false;
  }
}

async function toggleProfileActivation(row: Record<string, unknown>) {
  const resource = currentResource.value;
  if (
    !resource ||
    resource.id !== "profiles" ||
    !canWriteCurrentResource.value ||
    resource.allowUpdate === false
  ) {
    return;
  }

  const rawRow = (row.__rawRow as Record<string, unknown> | undefined) ?? row;
  const isActive = Boolean(rawRow.is_active);
  const nextIsActive = !isActive;
  const label = String(rawRow.full_name ?? "this user");
  const confirmed = window.confirm(
    `${nextIsActive ? "Reactivate" : "Deactivate"} ${label}?`,
  );
  if (!confirmed) return;

  try {
    await $fetch(`/api/dashboard/${resource.id}`, {
      method: "PATCH",
      body: {
        ...buildRecordIdentifier(resource, rawRow),
        data: { is_active: nextIsActive },
      },
    });

    if (activeRecord.value && String(activeRecord.value.id) === String(rawRow.id)) {
      activeRecord.value = {
        ...activeRecord.value,
        is_active: nextIsActive,
      };
      formValues.value = {
        ...formValues.value,
        is_active: nextIsActive,
      };
    }

    notice.value = `${label} ${
      nextIsActive ? "reactivated" : "deactivated"
    } successfully.`;
    await refreshActiveResource();
  } catch (error) {
    notice.value =
      error instanceof Error
        ? error.message
        : "Could not update the account status.";
  }
}

async function deleteRecord(row: Record<string, unknown>) {
  const resource = currentResource.value;
  if (
    !resource ||
    !canWriteCurrentResource.value ||
    resource.allowDelete === false
  ) {
    return;
  }

  const rawRow = (row.__rawRow as Record<string, unknown> | undefined) ?? row;
  const label = String(
    rawRow[resource.rowLabelKey ?? "id"] ?? rawRow.id ?? "record",
  );
  const confirmed = window.confirm(
    `Delete ${resource.label.toLowerCase()} "${label}"?`,
  );
  if (!confirmed) return;

  try {
    await $fetch(`/api/dashboard/${resource.id}`, {
      method: "DELETE",
      body: buildRecordIdentifier(resource, rawRow),
    });
    notice.value = `${resource.label} deleted successfully.`;
    await refreshActiveResource();
  } catch (error) {
    notice.value =
      error instanceof Error ? error.message : "Could not delete the record.";
  }
}

const resolvedFields = computed(() => {
  const resource = currentResource.value;
  if (!resource) return [];

  return resource.fields
    .filter((field) => !field.createOnly || drawerMode.value === "create")
    .map((field) => ({
      ...field,
      options: getFieldOptions(field, resourceRows),
    }));
});

const displayRows = computed(() => {
  const resource = currentResource.value;
  if (!resource) return [];

  const rows = resourceRows[resource.id] ?? [];
  const selectFields = resource.fields.filter(
    (field) => field.kind === "select" || field.kind === "multiselect",
  );

  return rows.map((row) => {
    const copy: Record<string, unknown> = { ...row, __rawRow: row };

    for (const field of selectFields) {
      const options = getFieldOptions(field, resourceRows);
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

      const match = options.find(
        (option) => option.value === String(value ?? ""),
      );
      if (match) {
        copy[field.key] = match.label;
      }
    }

    return copy;
  });
});

const filteredRows = computed(() => {
  const term = searchTerm.value.trim().toLowerCase();
  if (!term) return displayRows.value;

  return displayRows.value.filter((row) =>
    Object.entries(row).some(
      ([key, value]) =>
        !key.startsWith("__") &&
        String(value ?? "")
          .toLowerCase()
          .includes(term),
    ),
  );
});

await Promise.all(
  visibleResources.value.map((resource) => loadResource(resource.id)),
);

watch(
  () => currentResource.value?.id,
  async (resourceId) => {
    if (!resourceId) return;
    if (resourceRows[resourceId] !== undefined || resourceErrors[resourceId])
      return;
    await loadResource(resourceId);
  },
  { immediate: true },
);
</script>

<template>
  <div class="space-y-6">
    <section
      class="rounded-card border border-border bg-surface p-5 shadow-card"
    >
      <div v-if="!isSingletonResource" class="mb-5">
        <label class="block">
          <span class="mb-2 block text-small font-semibold text-ink">Search</span>
          <input
            v-model="searchTerm"
            type="search"
            class="w-full rounded-card border border-border bg-surface px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary"
            :placeholder="searchPlaceholder"
          />
        </label>
      </div>

      <div
        v-if="notice"
        class="mt-4 rounded-card border border-border bg-surface-alt px-4 py-3 text-small text-ink"
      >
        {{ notice }}
      </div>

      <div
        v-if="tempPassword"
        class="mt-4 rounded-card border border-warning/30 bg-warning/5 px-4 py-3 text-small text-ink"
      >
        <p class="font-semibold text-warning">
          Temporary password for {{ tempPasswordFor || "this staff account" }}
        </p>
        <p class="mt-1 break-all font-mono text-body text-ink">
          {{ tempPassword }}
        </p>
        <p class="mt-2 text-caption text-ink-muted">
          Share this once. The user can change it after signing in.
        </p>
      </div>

      <div
        v-if="resourceErrors[currentResource?.id ?? '']"
        class="mt-4 rounded-card border border-danger/30 bg-danger/5 px-4 py-3 text-small text-danger"
      >
        {{ resourceErrors[currentResource?.id ?? ""] }}
      </div>

      <div class="mt-5">
        <template v-if="currentResource && isSingletonResource">
          <BaseCrudForm
            :title="currentResource!.label"
            :description="currentResource!.description"
            :fields="resolvedFields"
            :model-value="formValues"
            :submit-label="currentResource!.submitLabel ?? 'Save changes'"
            :loading="isSaving"
            :read-only="!canWriteCurrentResource"
            :hide-cancel-button="true"
            @update:modelValue="formValues = $event"
            @submit="submitRecord"
            @cancel="closeDrawer"
          />
        </template>

        <template v-else-if="currentResource">
          <BaseTable
            :columns="currentResource!.columns"
            :rows="filteredRows"
            :row-key="currentResource!.primaryKey ?? 'id'"
            :loading="Boolean(resourceLoading[currentResource!.id])"
            :empty-title="`No ${currentResource!.label.toLowerCase()} found`"
            empty-description="No records found."
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
                  v-if="
                    canWriteCurrentResource &&
                    currentResource!.allowUpdate !== false
                  "
                  label="Edit record"
                  icon="lucide:pen-line"
                  tone="edit"
                  @click="openRecord(row)"
                />
                <BaseTableActionButton
                  v-if="
                    canWriteCurrentResource &&
                    currentResource!.id === 'profiles' &&
                    currentResource!.allowUpdate !== false
                  "
                  :label="
                    row.is_active === false
                      ? 'Reactivate account'
                      : 'Deactivate account'
                  "
                  icon="lucide:power"
                  tone="warning"
                  @click="toggleProfileActivation(row)"
                >
                </BaseTableActionButton>
                <BaseTableActionButton
                  v-if="
                    canWriteCurrentResource &&
                    currentResource!.allowDelete !== false &&
                    !(isCareersSection && currentResource!.id === 'job_postings')
                  "
                  label="Delete record"
                  icon="lucide:trash-2"
                  tone="delete"
                  @click="deleteRecord(row)"
                />
              </div>
            </template>
          </BaseTable>
        </template>
      </div>
    </section>

    <BaseCrudDrawer
      v-if="currentResource && !useEditorPage && !isSingletonResource"
      v-model:open="drawerOpen"
      :title="`${drawerMode === 'create' ? 'Create' : drawerMode === 'edit' ? 'Edit' : 'View'} ${currentResource.label}`"
      :description="currentResource.description"
      :fields="resolvedFields"
      :model-value="formValues"
      :submit-label="
        currentResource.submitLabel ??
        (drawerMode === 'create' ? 'Create record' : 'Save changes')
      "
      :loading="isSaving"
      :read-only="drawerMode === 'view' || !canWriteCurrentResource"
      @update:modelValue="formValues = $event"
      @submit="submitRecord"
      @cancel="closeDrawer"
    >
      <template #footer-actions>
        <button
          v-if="
            currentResource.id === 'profiles' &&
            drawerMode === 'edit' &&
            activeRecord
          "
          type="button"
          class="rounded-control border border-warning/30 px-4 py-2.5 text-small font-semibold text-warning hover:bg-warning/5 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="isResettingPassword"
          @click="resetPasswordForCurrentProfile"
        >
          {{ isResettingPassword ? "Resetting..." : "Reset password" }}
        </button>
      </template>
    </BaseCrudDrawer>
  </div>
</template>

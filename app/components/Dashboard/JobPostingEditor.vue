<script setup lang="ts">
import {
  buildDashboardEditorRoute,
  buildFormValues,
  buildResourceIdentifier,
  getDashboardResource,
  getFieldOptions,
  serializeFormValues,
  type CrudEditorMode,
  type CrudResourceConfig,
} from "~~/shared/dashboard-crud";

interface Props {
  mode?: CrudEditorMode;
  recordId?: string;
  recordIdentifier?: Record<string, string>;
  defaults?: Record<string, unknown>;
  backTo?: string;
}

const props = withDefaults(defineProps<Props>(), {
  mode: "edit",
  recordId: "",
  recordIdentifier: () => ({}),
  defaults: () => ({}),
  backTo: "",
});

const route = useRoute();
const router = useRouter();
const { hasRole } = useDashboardRoles();

const postingMeta = getDashboardResource("job_postings");
const applicationsMeta = getDashboardResource("job_applications");

if (!postingMeta || !applicationsMeta) {
  throw createError({
    statusCode: 404,
    statusMessage: "Careers editor resources not found.",
  });
}

const postingResource = postingMeta.resource;
const applicationsResource = applicationsMeta.resource;

if (!postingResource.readRoles.some((role) => hasRole(role))) {
  await navigateTo("/dashboard/unauthorized");
}

if (props.mode !== "view" && !(postingResource.writeRoles ?? postingResource.readRoles).some((role) => hasRole(role))) {
  await navigateTo("/dashboard/unauthorized");
}

if (props.mode === "create" && postingResource.allowCreate === false) {
  throw createError({
    statusCode: 405,
    statusMessage: "This resource cannot be created from the dashboard.",
  });
}

useSeoMeta({
  title: () =>
    `${props.mode === "create" ? "Create" : props.mode === "view" ? "View" : "Edit"} Job Posting — MeTRH Dashboard`,
  description: () => postingResource.description,
});

const activeTab = ref<"info" | "applications">("info");
const resourceError = ref<string | null>(null);
const notice = ref<string | null>(null);
const postingLoading = ref(false);
const applicationsLoading = ref(false);
const isSaving = ref(false);
const isDeactivating = ref(false);
const activeRecord = ref<Record<string, unknown> | null>(null);
const formValues = ref<Record<string, unknown>>({});
const applications = ref<Record<string, unknown>[]>([]);
const selectedApplication = ref<Record<string, unknown> | null>(null);
const selectedApplicationLinks = reactive<Record<string, string | null>>({
  resume_url: null,
  supporting_document_url: null,
});
const lookupRowsByResourceId = reactive<Record<string, Record<string, unknown>[]>>(
  {},
);

const backTo = computed(() => props.backTo || String(route.query.backTo ?? "/dashboard/careers"));
const readOnly = computed(() => props.mode === "view" || !((postingResource.writeRoles ?? postingResource.readRoles).some((role) => hasRole(role))));
const canWrite = computed(() =>
  (postingResource.writeRoles ?? postingResource.readRoles).some((role) =>
    hasRole(role),
  ),
);

function getPrimaryKeyFields(resource: CrudResourceConfig) {
  if (!resource.primaryKey) return ["id"];
  return Array.isArray(resource.primaryKey)
    ? resource.primaryKey
    : [resource.primaryKey];
}

function resolveFieldLabel(
  field: CrudResourceConfig["fields"][number],
  value: unknown,
) {
  const options = getFieldOptions(field, lookupRowsByResourceId);
  if (field.kind === "multiselect") {
    const selected = Array.isArray(value)
      ? value.map((entry) => String(entry))
      : value == null || value === ""
        ? []
        : [String(value)];

    return selected
      .map(
        (entry) =>
          options.find((option) => option.value === entry)?.label ?? entry,
      )
      .join(", ");
  }

  if (field.kind === "select") {
    const match = options.find((option) => option.value === String(value ?? ""));
    return match?.label ?? String(value ?? "—");
  }

  if (field.kind === "checkbox") {
    return value ? "Yes" : "No";
  }

  if (field.kind === "date") {
    const text = String(value ?? "");
    return text ? text.slice(0, 10) : "—";
  }

  if (field.kind === "time") {
    const text = String(value ?? "");
    return text ? text.slice(0, 5) : "—";
  }

  return String(value ?? "—");
}

function resolveDocumentName(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  try {
    const url = new URL(raw);
    return url.pathname.split("/").filter(Boolean).pop() ?? raw;
  } catch {
    const noQuery = raw.includes("?") ? raw.slice(0, raw.indexOf("?")) : raw;
    return noQuery.split("/").filter(Boolean).pop() ?? raw;
  }
}

async function fetchApplicationDocumentUrls(applicationId: string) {
  const response = await $fetch<{
    resumeUrl: string;
    supportingDocumentUrl: string | null;
  }>("/api/storage/documents/sign-application-urls", {
    method: "POST",
    body: { applicationId },
  });

  return response;
}

async function loadLookupRows() {
  const lookupResourceIds = new Set(
    applicationsResource.fields
      .map((field) => field.optionsFromResourceId)
      .filter((value): value is string => Boolean(value)),
  );

  await Promise.all(
    Array.from(lookupResourceIds).map(async (lookupResourceId) => {
      const lookupResource = getDashboardResource(lookupResourceId)?.resource;
      if (!lookupResource) return;

      lookupRowsByResourceId[lookupResourceId] = await fetchDashboardResourceRows(
        lookupResource.id,
      );
    }),
  );
}

async function loadPosting() {
  postingLoading.value = true;
  resourceError.value = null;

  try {
    await loadLookupRows();

    if (props.mode === "create") {
      activeRecord.value = null;
      formValues.value = {
        ...buildFormValues(postingResource),
        ...props.defaults,
      };
      applications.value = [];
      activeTab.value = "info";
      return;
    }

    const data = props.recordId
      ? await fetchDashboardResourceRecord(postingResource.id, { id: props.recordId })
      : Object.keys(props.recordIdentifier).length > 0
        ? await fetchDashboardResourceRecord(postingResource.id, {
            identifier: props.recordIdentifier,
          })
        : null;
    if (!data) throw new Error("Job posting not found.");

    activeRecord.value = data as Record<string, unknown>;
    formValues.value = buildFormValues(postingResource, data as Record<string, unknown>);
    await loadApplications(data as Record<string, unknown>);
  } catch (error) {
    resourceError.value =
      error instanceof Error ? error.message : "Could not load the record.";
    activeRecord.value = null;
    formValues.value = {};
    applications.value = [];
  } finally {
    postingLoading.value = false;
  }
}

async function loadApplications(record?: Record<string, unknown> | null) {
  const posting = record ?? activeRecord.value;
  if (!posting?.id) return;

  applicationsLoading.value = true;

  try {
    applications.value = await fetchDashboardResourceRows(
      applicationsResource.id,
      { job_id: String(posting.id) },
    );
  } catch (error) {
    resourceError.value =
      error instanceof Error ? error.message : "Could not load applications.";
    applications.value = [];
  } finally {
    applicationsLoading.value = false;
  }
}

const refreshKey = computed(() =>
  JSON.stringify({
    mode: props.mode,
    recordId: props.recordId,
    recordIdentifier: props.recordIdentifier,
    defaults: props.defaults,
  }),
);

watch(refreshKey, loadPosting, { immediate: true });

watch(activeTab, async (tab) => {
  if (tab === "applications" && activeRecord.value) {
    await loadApplications(activeRecord.value);
  }
});

const applicationDisplayRows = computed(() =>
  applications.value.map((row) => {
    const copy: Record<string, unknown> = { ...row, __rawRow: row };
    for (const field of applicationsResource.fields) {
      if (field.serverOnly) continue;
      copy[field.key] = resolveFieldLabel(field, row[field.key]);
    }
    return copy;
  }),
);

const postingStatus = computed(() => String(formValues.value.status ?? activeRecord.value?.status ?? ""));
const postingFields = computed(() => postingResource.fields);
const applicationColumns = applicationsResource.columns;

async function submitPosting() {
  if (props.mode === "view") return;

  isSaving.value = true;
  notice.value = null;

  try {
    const payload = serializeFormValues(postingResource, formValues.value, props.mode);

    if (props.mode === "create") {
      const result = await $fetch<{
        row: Record<string, unknown>;
      }>(`/api/dashboard/${postingResource.id}`, {
        method: "POST",
        body: { data: payload },
      });

      notice.value = `${postingResource.label} created successfully.`;
      await navigateTo(
        buildDashboardEditorRoute(postingResource, {
          mode: "edit",
          row: result.row,
          backTo: backTo.value,
        }),
      );
      return;
    }

    if (activeRecord.value) {
      await $fetch(`/api/dashboard/${postingResource.id}`, {
        method: "PATCH",
        body: {
          ...buildResourceIdentifier(postingResource, activeRecord.value),
          data: payload,
        },
      });
      notice.value = `${postingResource.label} updated successfully.`;
      await loadPosting();
    }
  } catch (error) {
    notice.value =
      error instanceof Error ? error.message : "Could not save the record.";
  } finally {
    isSaving.value = false;
  }
}

async function deactivatePosting() {
  if (!activeRecord.value || postingStatus.value === "closed") return;

  isDeactivating.value = true;
  notice.value = null;

  try {
    await $fetch(`/api/dashboard/${postingResource.id}`, {
      method: "PATCH",
      body: {
        ...buildResourceIdentifier(postingResource, activeRecord.value),
        data: { status: "closed" },
      },
    });
    notice.value = "Job posting deactivated successfully.";
    await loadPosting();
  } catch (error) {
    notice.value =
      error instanceof Error ? error.message : "Could not deactivate the job posting.";
  } finally {
    isDeactivating.value = false;
  }
}

async function openApplication(row: Record<string, unknown>) {
  const rawRow = (row.__rawRow as Record<string, unknown> | undefined) ?? row;
  selectedApplication.value = rawRow;

  if (!rawRow.id) {
    selectedApplicationLinks.resume_url = null;
    selectedApplicationLinks.supporting_document_url = null;
    return;
  }

  try {
    const links = await fetchApplicationDocumentUrls(String(rawRow.id));
    selectedApplicationLinks.resume_url = links.resumeUrl;
    selectedApplicationLinks.supporting_document_url =
      links.supportingDocumentUrl;
  } catch (error) {
    console.warn("[careers] Could not sign application documents.", error);
    selectedApplicationLinks.resume_url = null;
    selectedApplicationLinks.supporting_document_url = null;
  }
}

function closeApplication() {
  selectedApplication.value = null;
  selectedApplicationLinks.resume_url = null;
  selectedApplicationLinks.supporting_document_url = null;
}
</script>

<template>
  <div class="space-y-6">
    <section class="rounded-card border border-border bg-surface p-6 md:p-8 shadow-card">
      <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div class="max-w-3xl">
          <p class="text-small font-semibold uppercase tracking-wide text-info">
            Careers
          </p>
          <h2 class="mt-2 font-display font-bold text-h1 text-ink">
            {{ props.mode === "create" ? "Create job posting" : props.mode === "view" ? "View job posting" : "Edit job posting" }}
          </h2>
          <p class="mt-4 text-body text-ink-muted">
            Manage the vacancy details on the Info tab and review linked applications on the Applications tab.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <NuxtLink
            :to="backTo"
            class="rounded-control border border-border px-4 py-2.5 text-small font-semibold text-ink hover:bg-surface-alt"
          >
            Back to careers
          </NuxtLink>
          <button
            v-if="activeRecord && postingStatus !== 'closed' && canWrite"
            type="button"
            class="rounded-control border border-warning/30 px-4 py-2.5 text-small font-semibold text-warning hover:bg-warning/5 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="isDeactivating"
            @click="deactivatePosting"
          >
            {{ isDeactivating ? "Deactivating..." : "Deactivate" }}
          </button>
          <span
            v-if="postingStatus === 'closed'"
            class="rounded-full bg-surface-alt px-3 py-1.5 text-caption font-semibold uppercase tracking-wide text-ink-muted"
          >
            Closed
          </span>
        </div>
      </div>
    </section>

    <div
      v-if="notice"
      class="rounded-card border border-border bg-surface-alt px-4 py-3 text-small text-ink"
    >
      {{ notice }}
    </div>

    <div
      v-if="resourceError"
      class="rounded-card border border-danger/30 bg-danger/5 px-4 py-3 text-small text-danger"
    >
      {{ resourceError }}
    </div>

    <section class="rounded-card border border-border bg-surface p-6 shadow-card">
      <div class="flex flex-wrap items-center gap-3 border-b border-border pb-4">
        <button
          type="button"
          class="rounded-full border px-4 py-2 text-small font-semibold transition-colors"
          :class="
            activeTab === 'info'
              ? 'border-primary bg-primary text-white'
              : 'border-border bg-surface-alt text-ink hover:border-primary/30 hover:bg-surface'
          "
          @click="activeTab = 'info'"
        >
          Info
        </button>
        <button
          type="button"
          class="rounded-full border px-4 py-2 text-small font-semibold transition-colors"
          :class="
            activeTab === 'applications'
              ? 'border-primary bg-primary text-white'
              : 'border-border bg-surface-alt text-ink hover:border-primary/30 hover:bg-surface'
          "
          :disabled="!activeRecord"
          @click="activeTab = 'applications'"
        >
          Applications
        </button>
      </div>

      <div v-if="activeTab === 'info'" class="pt-6">
        <BaseCrudForm
          v-if="!postingLoading"
          :title="postingResource.label"
          :description="postingResource.description"
          :fields="postingFields"
          :model-value="formValues"
          :submit-label="props.mode === 'create' ? 'Create record' : 'Save changes'"
          :loading="isSaving"
          :read-only="readOnly"
          @update:modelValue="formValues = $event"
          @submit="submitPosting"
          @cancel="router.push(backTo)"
        >
          <template #footer-actions>
            <button
              v-if="activeRecord && postingStatus !== 'closed' && canWrite"
              type="button"
              class="rounded-control border border-warning/30 px-4 py-2.5 text-small font-semibold text-warning hover:bg-warning/5 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="isDeactivating"
              @click="deactivatePosting"
            >
              {{ isDeactivating ? "Deactivating..." : "Deactivate" }}
            </button>
          </template>
        </BaseCrudForm>
      </div>

      <div v-else class="pt-6">
        <div v-if="!activeRecord" class="rounded-card border border-border bg-surface-alt px-4 py-3 text-small text-ink-muted">
          Save the job posting before reviewing applications.
        </div>

        <div v-else class="space-y-4">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-caption font-semibold uppercase tracking-wide text-info">
                Applications
              </p>
              <h3 class="mt-1 font-display text-h3 text-ink">
                {{ applications.length }} application{{ applications.length === 1 ? "" : "s" }}
              </h3>
            </div>
            <p class="text-small text-ink-muted">
              Click a row to open the full application popup.
            </p>
          </div>

          <BaseTable
            :columns="applicationColumns"
            :rows="applicationDisplayRows"
            row-key="id"
            :loading="applicationsLoading"
            empty-title="No applications yet"
            empty-description="Applications will appear here after candidates submit them."
            actions-label="Application actions"
          >
            <template #actions="{ row }">
              <div class="flex items-center justify-end gap-2">
                <BaseTableActionButton
                  label="Open application"
                  icon="lucide:eye"
                  tone="open"
                  @click="openApplication(row)"
                />
              </div>
            </template>
          </BaseTable>
        </div>
      </div>
    </section>

    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="selectedApplication"
          class="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4 py-6"
        >
          <button
            type="button"
            class="absolute inset-0 cursor-default"
            aria-label="Close application details"
            @click="closeApplication"
          />

          <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="scale-95 opacity-0"
            enter-to-class="scale-100 opacity-100"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="scale-100 opacity-100"
            leave-to-class="scale-95 opacity-0"
          >
            <aside
              class="relative z-10 max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-card border border-border bg-surface shadow-elevated"
            >
              <header class="border-b border-border px-5 py-4 sm:px-6">
                <div class="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p class="text-caption font-semibold uppercase tracking-wide text-info">
                      Application details
                    </p>
                    <h3 class="mt-1 font-display text-h3 text-ink">
                      {{ String(selectedApplication.applicant_name ?? "Applicant") }}
                    </h3>
                    <p class="mt-2 text-small text-ink-muted">
                      {{ String(selectedApplication.email ?? "") }}
                    </p>
                  </div>
                  <button
                    type="button"
                    class="rounded-control border border-border px-3 py-2 text-small font-semibold text-ink hover:bg-surface-alt"
                    @click="closeApplication"
                  >
                    Close
                  </button>
                </div>
              </header>

              <div class="max-h-[calc(90vh-6rem)] overflow-y-auto px-5 py-5 sm:px-6">
                <div class="grid gap-4 md:grid-cols-2">
                  <div
                    v-for="field in applicationsResource.fields"
                    :key="field.key"
                    v-show="!field.serverOnly"
                    class="rounded-card border border-border bg-surface-alt p-4"
                    :class="field.kind === 'textarea' || field.kind === 'upload' ? 'md:col-span-2' : ''"
                  >
                    <p class="text-caption font-semibold uppercase tracking-wide text-info">
                      {{ field.label }}
                    </p>

                    <div v-if="field.kind === 'upload'" class="mt-2 space-y-2">
                      <a
                        v-if="field.key === 'resume_url' && selectedApplicationLinks.resume_url"
                        :href="selectedApplicationLinks.resume_url"
                        target="_blank"
                        rel="noreferrer"
                        class="inline-flex rounded-control border border-primary/25 px-3 py-2 text-small font-semibold text-primary hover:bg-primary/5"
                      >
                        Open {{ resolveDocumentName(selectedApplication.resume_url) || 'resume' }}
                      </a>
                      <a
                        v-else-if="field.key === 'supporting_document_url' && selectedApplicationLinks.supporting_document_url"
                        :href="selectedApplicationLinks.supporting_document_url"
                        target="_blank"
                        rel="noreferrer"
                        class="inline-flex rounded-control border border-primary/25 px-3 py-2 text-small font-semibold text-primary hover:bg-primary/5"
                      >
                        Open {{ resolveDocumentName(selectedApplication.supporting_document_url) || 'supporting document' }}
                      </a>
                      <p v-else class="text-small text-ink-muted">
                        No file uploaded.
                      </p>
                    </div>

                    <p
                      v-else
                      class="mt-2 whitespace-pre-wrap text-body text-ink"
                    >
                      {{
                        resolveFieldLabel(
                          field,
                          selectedApplication[field.key],
                        )
                      }}
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

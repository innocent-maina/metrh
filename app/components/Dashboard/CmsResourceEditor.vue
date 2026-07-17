<script setup lang="ts">
import {
  buildDashboardEditorRoute,
  buildFormValues,
  buildResourceIdentifier,
  getDashboardResource,
  getFieldOptions,
  serializeFormValues,
  type CrudEditorMode,
  type CrudField,
} from "~~/shared/dashboard-crud";
import { fetchSignedDocumentUrls } from "~~/app/composables/fetchSignedDocumentUrls";

interface Props {
  resourceId: string;
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
const resolveStorageUrl = usePublicStorageUrl();

const resourceMeta = computed(() => getDashboardResource(props.resourceId));

if (!resourceMeta.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "Resource not found.",
  });
}

const resource = resourceMeta.value.resource;
const section = resourceMeta.value.section;

const canRead = resource.readRoles.some((role) => hasRole(role));
const canWrite = (resource.writeRoles ?? resource.readRoles).some((role) =>
  hasRole(role),
);

if (!canRead) {
  await navigateTo("/dashboard/unauthorized");
}

if (props.mode !== "view" && !canWrite) {
  await navigateTo("/dashboard/unauthorized");
}

if (props.mode === "create" && resource.allowCreate === false) {
  throw createError({
    statusCode: 405,
    statusMessage: "This resource cannot be created from the dashboard.",
  });
}

if (props.mode !== "create" && resource.allowUpdate === false && props.mode !== "view") {
  throw createError({
    statusCode: 405,
    statusMessage: "This resource cannot be updated from the dashboard.",
  });
}

useSeoMeta({
  title: () =>
    `${props.mode === "create" ? "Create" : props.mode === "view" ? "View" : "Edit"} ${resource.label} — MeTRH Dashboard`,
  description: () => resource.description,
});

const lookupRowsByResourceId = reactive<Record<string, Record<string, unknown>[]>>(
  {},
);
const activeRecord = ref<Record<string, unknown> | null>(null);
const formValues = ref<Record<string, unknown>>({});
const tenderDocuments = ref<
  Array<Record<string, unknown> & { downloadUrl: string | null }>
>([]);
const supportingFiles = ref<
  Array<Record<string, unknown> & { downloadUrl: string | null }>
>([]);
const resourceLoading = ref(false);
const resourceError = ref<string | null>(null);
const relatedRecordsLoading = ref(false);
const relatedRecordsError = ref<string | null>(null);
const notice = ref<string | null>(null);
const isSaving = ref(false);

async function loadResourceRows(
  resourceId: string,
  filters: Record<string, string | number | boolean | null | Array<string | number | boolean>> = {},
) {
  const current = getDashboardResource(resourceId)?.resource;
  if (!current) return [];

  return await fetchDashboardResourceRows(resourceId, filters);
}

function getRecordIdentifier() {
  if (props.recordId) {
    return { id: props.recordId };
  }

  return Object.keys(props.recordIdentifier).length > 0
    ? { identifier: props.recordIdentifier }
    : null;
}

async function loadAll() {
  resourceLoading.value = true;
  resourceError.value = null;
  relatedRecordsError.value = null;

  try {
    const lookupResourceIds = new Set(
      resource.fields
        .map((field) => field.optionsFromResourceId)
        .filter((value): value is string => Boolean(value)),
    );

    await Promise.all(
      Array.from(lookupResourceIds).map(async (lookupResourceId) => {
        lookupRowsByResourceId[lookupResourceId] = await loadResourceRows(
          lookupResourceId,
        );
      }),
    );

    if (props.mode === "create") {
      activeRecord.value = null;
      formValues.value = {
        ...buildFormValues(resource),
        ...props.defaults,
      };
      tenderDocuments.value = [];
      supportingFiles.value = [];
      return;
    }

    const identifier = getRecordIdentifier();
    if (!identifier) {
      throw new Error("A record id is required.");
    }

    const data = await fetchDashboardResourceRecord(resource.id, identifier as never);
    if (!data) {
      throw new Error("Record not found.");
    }

    activeRecord.value = data as Record<string, unknown>;
    formValues.value = buildFormValues(resource, data as Record<string, unknown>);
    await loadTenderRelatedRecords();
  } catch (error) {
    resourceError.value =
      error instanceof Error ? error.message : "Could not load the record.";
    activeRecord.value = null;
    formValues.value = {};
    tenderDocuments.value = [];
    supportingFiles.value = [];
  } finally {
    resourceLoading.value = false;
  }
}

const refreshKey = computed(() =>
  JSON.stringify({
    resourceId: props.resourceId,
    mode: props.mode,
    recordId: props.recordId,
    recordIdentifier: props.recordIdentifier,
    defaults: props.defaults,
  }),
);

watch(refreshKey, loadAll, { immediate: true });

const resolvedFields = computed(() =>
  resource.fields.map((field) => ({
    ...field,
    options: getFieldOptions(field, lookupRowsByResourceId),
  })),
);

const editorFields = computed(() => {
  if (resource.id !== "blog_posts") {
    return resolvedFields.value;
  }

  const contentField = resolvedFields.value.find((field) => field.key === "content");
  if (!contentField) {
    return resolvedFields.value;
  }

  return [
    contentField,
    ...resolvedFields.value.filter((field) => field.key !== contentField.key),
  ];
});

const submitLabel = computed(() =>
  props.mode === "create" ? "Create record" : "Save changes",
);

const pageTitle = computed(() =>
  props.mode === "create"
    ? `Create ${resource.label}`
    : props.mode === "view"
      ? `View ${resource.label}`
      : `Edit ${resource.label}`,
);

const backTo = computed(() => props.backTo || String(route.query.backTo ?? "/dashboard"));
const readOnly = computed(() => props.mode === "view" || !canWrite);

function getStoredFileName(value: unknown) {
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

function resolvePublicUploadUrl(field: CrudField, value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (field.uploadBucket !== "media") return raw;

  return resolveStorageUrl(raw, "media");
}

function getRecordFileLabel(row: Record<string, unknown>, fallbackKey: string) {
  return String(row[fallbackKey] ?? row.file_name ?? row.title ?? row.id ?? "record");
}

async function loadTenderRelatedRecords() {
  if (resource.id !== "tenders") {
    tenderDocuments.value = [];
    supportingFiles.value = [];
    relatedRecordsError.value = null;
    return;
  }

  const tenderId = String(activeRecord.value?.id ?? "");
  if (!tenderId) {
    tenderDocuments.value = [];
    supportingFiles.value = [];
    relatedRecordsError.value = null;
    return;
  }

  relatedRecordsLoading.value = true;
  relatedRecordsError.value = null;

  try {
    const [documentRows, supportingRows] = await Promise.all([
      fetchDashboardResourceRows("tender_documents", { tender_id: tenderId }),
      fetchDashboardResourceRows("downloads"),
    ]);

    const [documentUrls, supportingUrls] = await Promise.all([
      fetchSignedDocumentUrls(
        documentRows.map((row) => ({
          resource: "tender_documents",
          id: String(row.id),
        })),
      ),
      fetchSignedDocumentUrls(
        supportingRows.map((row) => ({
          resource: "downloads",
          id: String(row.id),
        })),
      ),
    ]);

    tenderDocuments.value = documentRows.map((row) => ({
      ...row,
      downloadUrl: documentUrls.get(String(row.id)) ?? null,
    }));

    supportingFiles.value = supportingRows.map((row) => ({
      ...row,
      downloadUrl: supportingUrls.get(String(row.id)) ?? null,
    }));
  } catch (error) {
    relatedRecordsError.value =
      error instanceof Error
        ? error.message
        : "Could not load related tender files.";
    tenderDocuments.value = [];
    supportingFiles.value = [];
  } finally {
    relatedRecordsLoading.value = false;
  }
}

function updateField(key: string, value: unknown) {
  formValues.value = { ...formValues.value, [key]: value };
}

function getMultiSelectValues(fieldKey: string) {
  const raw = formValues.value[fieldKey];
  return Array.isArray(raw) ? raw.map((entry) => String(entry)) : [];
}

function toggleMultiSelect(fieldKey: string, optionValue: string, checked: boolean) {
  const current = getMultiSelectValues(fieldKey);
  const next = checked
    ? Array.from(new Set([...current, optionValue]))
    : current.filter((value) => value !== optionValue);
  updateField(fieldKey, next);
}

const uploadingFields = reactive<Record<string, boolean>>({});
const uploadErrors = reactive<Record<string, string | null>>({});

const isUploading = computed(() =>
  Object.values(uploadingFields).some((value) => value),
);

async function handleUploadChange(field: CrudField, event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0] ?? null;

  uploadErrors[field.key] = null;

  if (!file) return;
  if (!field.uploadBucket || !field.uploadFolder) {
    uploadErrors[field.key] = "This field is missing upload settings.";
    input.value = "";
    return;
  }

  uploadingFields[field.key] = true;

  try {
    const formData = new FormData();
    formData.append("bucket", field.uploadBucket);
    formData.append("folder", field.uploadFolder);
    formData.append("fileName", file.name);
    formData.append("file", file);

    const upload = await $fetch<{
      path: string;
      publicUrl: string | null;
    }>("/api/storage/dashboard/sign-upload", {
      method: "POST",
      body: formData,
    });

    const storedValue =
      field.uploadBucket === "media"
        ? upload.publicUrl ?? upload.path
        : upload.path;

    updateField(field.key, storedValue);
  } catch (error) {
    uploadErrors[field.key] =
      error instanceof Error ? error.message : "Could not upload the file.";
    input.value = "";
  } finally {
    uploadingFields[field.key] = false;
  }
}

async function submitRecord() {
  if (props.mode === "view") return;

  isSaving.value = true;
  notice.value = null;

  try {
    const payload = serializeFormValues(resource, formValues.value, props.mode);

    if (props.mode === "create") {
      const result = await $fetch<{
        row: Record<string, unknown>;
      }>(`/api/dashboard/${resource.id}`, {
        method: "POST",
        body: { data: payload },
      });

      notice.value = `${resource.label} created successfully.`;
      await navigateTo(
        buildDashboardEditorRoute(resource, {
          mode: "edit",
          row: result.row,
          backTo: backTo.value,
        }),
      );
      return;
    }

    if (activeRecord.value) {
      await $fetch(`/api/dashboard/${resource.id}`, {
        method: "PATCH",
        body: {
          ...buildResourceIdentifier(resource, activeRecord.value),
          data: payload,
        },
      });
      notice.value = `${resource.label} updated successfully.`;
      await loadAll();
    }
  } catch (error) {
    notice.value =
      error instanceof Error ? error.message : "Could not save the record.";
  } finally {
    isSaving.value = false;
  }
}

async function deleteRecord() {
  if (!activeRecord.value || resource.allowDelete === false) return;

  const label = String(
    activeRecord.value[resource.rowLabelKey ?? "id"] ??
      activeRecord.value.id ??
      "record",
  );
  const confirmed = window.confirm(
    `Delete ${resource.label.toLowerCase()} "${label}"?`,
  );
  if (!confirmed) return;

  try {
    await $fetch(`/api/dashboard/${resource.id}`, {
      method: "DELETE",
      body: buildResourceIdentifier(resource, activeRecord.value),
    });
    await navigateTo(backTo.value);
  } catch (error) {
    notice.value =
      error instanceof Error ? error.message : "Could not delete the record.";
  }
}
</script>

<template>
  <div class="space-y-6">
    <section class="rounded-card border border-border bg-surface p-6 md:p-8 shadow-card">
      <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div class="max-w-3xl">
          <p class="text-small font-semibold uppercase tracking-wide text-info">
            {{ section.label }}
          </p>
          <h2 class="mt-2 font-display font-bold text-h1 text-ink">
            {{ pageTitle }}
          </h2>
          <p class="mt-4 text-body text-ink-muted">
            {{ resource.description }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <NuxtLink
            :to="backTo"
            class="rounded-control border border-border px-4 py-2.5 text-small font-semibold text-ink hover:bg-surface-alt"
          >
            Back
          </NuxtLink>

          <button
            v-if="props.mode !== 'create' && resource.allowDelete !== false && activeRecord && canWrite"
            type="button"
            class="rounded-control border border-danger/30 px-4 py-2.5 text-small font-semibold text-danger hover:bg-danger/5"
            @click="deleteRecord"
          >
            Delete
          </button>
        </div>
      </div>
    </section>

    <div v-if="notice" class="rounded-card border border-border bg-surface-alt px-4 py-3 text-small text-ink">
      {{ notice }}
    </div>

    <div v-if="resourceError" class="rounded-card border border-danger/30 bg-danger/5 px-4 py-3 text-small text-danger">
      {{ resourceError }}
    </div>

    <section class="rounded-card border border-border bg-surface p-6 shadow-card">
      <form
        v-if="!resourceLoading && resource"
        class="space-y-6"
        @submit.prevent="submitRecord"
      >
        <div class="grid gap-4 md:grid-cols-2">
          <label
            v-for="field in editorFields"
            v-show="!field.serverOnly"
            :key="field.key"
            class="space-y-2"
            :class="field.kind === 'textarea' || field.kind === 'upload' || field.kind === 'richtext' || field.kind === 'multiselect' || field.kind === 'icon' ? 'md:col-span-2' : ''"
          >
            <span class="block text-small font-semibold text-ink">
              {{ field.label }}
              <span v-if="field.required" class="text-danger">*</span>
            </span>

            <RichTextEditor
              v-if="field.kind === 'richtext'"
              :model-value="String(formValues[field.key] ?? '')"
              :placeholder="field.placeholder"
              :required="field.required"
              :disabled="readOnly || field.disabled"
              :editor-class="
                resource.id === 'blog_posts' && field.key === 'content'
                  ? 'min-h-[30rem] lg:min-h-[38rem]'
                  : ''
              "
              @update:model-value="updateField(field.key, $event)"
            />

            <textarea
              v-else-if="field.kind === 'textarea'"
              :rows="field.rows ?? 5"
              class="w-full rounded-card border border-border bg-surface px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary"
              :placeholder="field.placeholder"
              :required="field.required"
              :disabled="readOnly || field.disabled"
              :value="String(formValues[field.key] ?? '')"
              @input="updateField(field.key, ($event.target as HTMLTextAreaElement).value)"
            />

            <input
              v-else-if="field.kind === 'json'"
              type="text"
              class="w-full rounded-card border border-border bg-surface px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary"
              :placeholder="field.placeholder"
              :required="field.required"
              :disabled="readOnly || field.disabled"
              :value="String(formValues[field.key] ?? '')"
              @input="updateField(field.key, ($event.target as HTMLInputElement).value)"
            />

            <div v-else-if="field.kind === 'upload'" class="space-y-3">
              <div
                v-if="field.uploadPreview === 'image' && resolvePublicUploadUrl(field, formValues[field.key])"
                class="overflow-hidden rounded-card border border-border bg-surface-alt"
              >
                <img
                  :src="resolvePublicUploadUrl(field, formValues[field.key])"
                  :alt="field.label"
                  class="max-h-56 w-full object-cover"
                />
              </div>

              <div
                v-else-if="String(formValues[field.key] ?? '').trim()"
                class="rounded-card border border-border bg-surface-alt px-4 py-3 text-small text-ink"
              >
                <p class="font-semibold text-ink">Current file</p>
                <p class="mt-1 break-all text-ink-muted">
                  {{ getStoredFileName(formValues[field.key]) }}
                </p>
              </div>

              <input
                type="file"
                class="w-full rounded-card border border-border bg-surface px-3 py-2.5 text-body text-ink outline-none transition-colors file:mr-4 file:rounded-control file:border-0 file:bg-surface-alt file:px-3 file:py-1.5 file:text-small file:font-semibold file:text-ink hover:file:bg-surface-alt focus:border-primary"
                :accept="field.accept"
                :required="field.required && !String(formValues[field.key] ?? '').trim()"
                :disabled="readOnly || field.disabled || uploadingFields[field.key]"
                @change="handleUploadChange(field, $event)"
              />

              <p class="text-caption text-ink-muted">
                {{ uploadingFields[field.key] ? "Uploading..." : field.helpText ?? "Choose a file to upload directly to Supabase storage." }}
              </p>
            </div>

            <div v-else-if="field.kind === 'multiselect'" class="space-y-3">
              <div class="grid gap-2 rounded-card border border-border bg-surface p-3">
                <div
                  v-for="option in field.options ?? []"
                  :key="option.value"
                  class="flex items-center gap-3 rounded-control px-2 py-1.5 hover:bg-surface-alt"
                >
                  <input
                    type="checkbox"
                    class="size-4 rounded border-border text-primary focus:ring-primary"
                    :disabled="readOnly || field.disabled"
                    :checked="Array.isArray(formValues[field.key]) ? (formValues[field.key] as unknown[]).map(String).includes(option.value) : false"
                    @change="toggleMultiSelect(field.key, option.value, ($event.target as HTMLInputElement).checked)"
                  />
                  <span class="text-small font-medium text-ink">
                    {{ option.label }}
                  </span>
                </div>
              </div>

              <p class="text-caption text-ink-muted">
                {{ field.helpText ?? "Choose one or more options." }}
              </p>
            </div>

            <IconPickerField
              v-else-if="field.kind === 'icon'"
              :model-value="String(formValues[field.key] ?? '')"
              :placeholder="field.placeholder ?? 'Choose an icon'"
              :disabled="readOnly || field.disabled"
              @update:model-value="updateField(field.key, $event)"
            />

            <select
              v-else-if="field.kind === 'select'"
              class="w-full rounded-card border border-border bg-surface px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary"
              :required="field.required"
              :disabled="readOnly || field.disabled"
              :value="String(formValues[field.key] ?? '')"
              @change="updateField(field.key, ($event.target as HTMLSelectElement).value)"
            >
              <option value="">Select an option</option>
              <option
                v-for="option in field.options ?? []"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>

            <input
              v-else-if="field.kind === 'checkbox'"
              type="checkbox"
              class="size-4 rounded border-border text-primary focus:ring-primary"
              :disabled="readOnly || field.disabled"
              :checked="Boolean(formValues[field.key])"
              @change="updateField(field.key, ($event.target as HTMLInputElement).checked)"
            />

            <input
              v-else
              :type="field.kind === 'password' ? 'password' : field.kind === 'number' ? 'number' : field.kind === 'date' ? 'date' : field.kind === 'time' ? 'time' : 'text'"
              class="w-full rounded-card border border-border bg-surface px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary"
              :placeholder="field.placeholder"
              :required="field.required"
              :disabled="readOnly || field.disabled"
              :autocomplete="field.kind === 'password' ? 'new-password' : undefined"
              :value="String(formValues[field.key] ?? '')"
              @input="updateField(field.key, ($event.target as HTMLInputElement).value)"
            />

            <p v-if="field.helpText && field.kind !== 'upload' && field.kind !== 'multiselect'" class="text-caption text-ink-muted">
              {{ field.helpText }}
            </p>
            <p v-if="uploadErrors[field.key]" class="text-caption text-danger">
              {{ uploadErrors[field.key] }}
            </p>
          </label>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <div class="flex flex-wrap items-center gap-3">
            <p v-if="props.mode !== 'view'" class="text-caption text-ink-muted">
              Changes save through the same dashboard API used by the rest of the admin.
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <button
              type="button"
              class="rounded-control border border-border px-4 py-2.5 text-small font-semibold text-ink hover:bg-surface-alt"
              @click="router.push(backTo)"
            >
              {{ props.mode === 'view' ? "Close" : "Cancel" }}
            </button>
            <button
              v-if="props.mode !== 'view'"
              type="submit"
              class="rounded-control bg-primary px-4 py-2.5 text-small font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="isSaving || isUploading"
            >
              {{ isSaving ? "Saving..." : isUploading ? "Uploading..." : submitLabel }}
            </button>
          </div>
        </div>
      </form>

      <div
        v-if="activeRecord && resource.id === 'tenders' && props.mode !== 'create' && !resourceLoading"
        class="mt-8 border-t border-border pt-6"
      >
        <div class="mb-4 max-w-3xl">
          <p class="text-caption font-semibold uppercase tracking-wide text-info">
            Related records
          </p>
          <h3 class="mt-1 font-display text-h3 text-ink">
            Attachments and supporting files
          </h3>
          <p class="mt-2 text-small text-ink-muted">
            Read-only file previews for the current tender.
          </p>
        </div>

        <div
          v-if="relatedRecordsError"
          class="mb-4 rounded-card border border-danger/30 bg-danger/5 px-4 py-3 text-small text-danger"
        >
          {{ relatedRecordsError }}
        </div>

        <div v-else-if="relatedRecordsLoading" class="text-small text-ink-muted">
          Loading related files...
        </div>

        <div v-else class="grid gap-4 lg:grid-cols-2">
          <section class="rounded-card border border-border bg-surface-alt/40">
            <header class="border-b border-border px-4 py-3">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="font-semibold text-ink">Attachments</p>
                  <p class="text-caption text-ink-muted">
                    {{ tenderDocuments.length }} file{{ tenderDocuments.length === 1 ? "" : "s" }}
                  </p>
                </div>
              </div>
            </header>

            <div v-if="tenderDocuments.length > 0" class="divide-y divide-border">
              <div
                v-for="document in tenderDocuments"
                :key="String(document.id)"
                class="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div class="min-w-0">
                  <p class="truncate font-medium text-ink">
                    {{ getRecordFileLabel(document, "file_name") }}
                  </p>
                  <p class="mt-1 break-all text-caption text-ink-muted">
                    {{ getStoredFileName(document.file_url) }}
                  </p>
                </div>

                <a
                  v-if="document.downloadUrl"
                  :href="document.downloadUrl"
                  target="_blank"
                  rel="noreferrer"
                  class="rounded-control border border-border px-3 py-2 text-small font-semibold text-ink hover:bg-surface"
                >
                  Download
                </a>
                <span v-else class="text-caption text-ink-muted">
                  File unavailable
                </span>
              </div>
            </div>

            <div v-else class="px-4 py-6 text-small text-ink-muted">
              No attachments have been linked to this tender yet.
            </div>
          </section>

          <section class="rounded-card border border-border bg-surface-alt/40">
            <header class="border-b border-border px-4 py-3">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="font-semibold text-ink">Supporting files</p>
                  <p class="text-caption text-ink-muted">
                    {{ supportingFiles.length }} file{{ supportingFiles.length === 1 ? "" : "s" }}
                  </p>
                </div>
              </div>
            </header>

            <div v-if="supportingFiles.length > 0" class="divide-y divide-border">
              <div
                v-for="file in supportingFiles"
                :key="String(file.id)"
                class="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div class="min-w-0">
                  <p class="truncate font-medium text-ink">
                    {{ getRecordFileLabel(file, "title") }}
                  </p>
                  <p class="mt-1 break-all text-caption text-ink-muted">
                    {{ String(file.category ?? "Supporting file") }}
                  </p>
                  <p class="mt-1 text-caption text-ink-muted">
                    {{ file.is_published ? "Published" : "Unpublished" }}
                  </p>
                </div>

                <a
                  v-if="file.downloadUrl"
                  :href="file.downloadUrl"
                  target="_blank"
                  rel="noreferrer"
                  class="rounded-control border border-border px-3 py-2 text-small font-semibold text-ink hover:bg-surface"
                >
                  Download
                </a>
                <span v-else class="text-caption text-ink-muted">
                  File unavailable
                </span>
              </div>
            </div>

            <div v-else class="px-4 py-6 text-small text-ink-muted">
              No supporting files are available yet.
            </div>
          </section>
        </div>
      </div>

      <div v-if="resourceLoading" class="py-8 text-small text-ink-muted">
        Loading editor...
      </div>
    </section>
  </div>
</template>

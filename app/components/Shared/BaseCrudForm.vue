<script setup lang="ts">
import type { CrudField } from "~~/shared/dashboard-crud";

interface Props {
  title: string;
  description?: string;
  fields: CrudField[];
  modelValue: Record<string, unknown>;
  submitLabel: string;
  loading?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  hideCancelButton?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  description: "",
  loading: false,
  readOnly: false,
  disabled: false,
  hideCancelButton: false,
});

const emit = defineEmits<{
  (event: "update:modelValue", value: Record<string, unknown>): void;
  (event: "submit"): void;
  (event: "cancel"): void;
}>();

const supabase = useSupabaseClient();
const uploadingFields = reactive<Record<string, boolean>>({});
const uploadErrors = reactive<Record<string, string | null>>({});
const formRef = ref<HTMLFormElement | null>(null);

function updateField(key: string, value: unknown) {
  emit("update:modelValue", { ...props.modelValue, [key]: value });
}

function getMultiSelectValues(fieldKey: string) {
  const raw = props.modelValue[fieldKey];
  return Array.isArray(raw) ? raw.map((entry) => String(entry)) : [];
}

function toggleMultiSelect(
  fieldKey: string,
  optionValue: string,
  checked: boolean,
) {
  const current = getMultiSelectValues(fieldKey);
  const next = checked
    ? Array.from(new Set([...current, optionValue]))
    : current.filter((value) => value !== optionValue);
  updateField(fieldKey, next);
}

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
  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:")) return raw;
  if (field.uploadBucket !== "media") return raw;

  return supabase.storage.from("media").getPublicUrl(raw).data.publicUrl;
}

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
    const upload = await $fetch<{
      path: string;
      token: string;
      signedUrl: string;
    }>("/api/storage/dashboard/sign-upload", {
      method: "POST",
      body: {
        bucket: field.uploadBucket,
        folder: field.uploadFolder,
        fileName: file.name,
      },
    });

    const { error } = await supabase.storage
      .from(field.uploadBucket)
      .uploadToSignedUrl(upload.path, upload.token, file, {
        contentType: file.type || "application/octet-stream",
      });

    if (error) {
      throw new Error(error.message);
    }

    const storedValue =
      field.uploadBucket === "media"
        ? supabase.storage.from(field.uploadBucket).getPublicUrl(upload.path).data
            .publicUrl
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

function handleSubmit() {
  if (!formRef.value?.reportValidity()) {
    return;
  }

  emit("submit");
}
</script>

<template>
  <div class="rounded-card bg-surface-alt/30">
    <header class="border-b border-border px-5 py-4 sm:px-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-caption font-semibold uppercase tracking-wide text-info">
            Record editor
          </p>
          <h3 class="mt-1 font-display text-h3 text-ink">{{ title }}</h3>
          <p v-if="description" class="mt-2 text-small text-ink-muted">
            {{ description }}
          </p>
        </div>
      </div>
    </header>

    <form
      ref="formRef"
      class="px-5 py-5 sm:px-6"
      @submit.prevent="handleSubmit"
    >
      <div class="grid gap-4 md:grid-cols-2">
        <label
          v-for="field in fields"
          v-show="!field.serverOnly"
          :key="field.key"
          class="space-y-2"
          :class="
            field.kind === 'textarea' ||
            field.kind === 'json' ||
            field.kind === 'upload' ||
            field.kind === 'richtext' ||
            field.kind === 'multiselect' ||
            field.kind === 'icon'
              ? 'md:col-span-2'
              : ''
          "
        >
          <span class="block text-small font-semibold text-ink">
            {{ field.label }}
            <span v-if="field.required" class="text-danger">*</span>
          </span>

          <RichTextEditor
            v-if="field.kind === 'richtext'"
            :model-value="String(modelValue[field.key] ?? '')"
            :placeholder="field.placeholder"
            :required="field.required"
            :disabled="readOnly || disabled || field.disabled"
            @update:model-value="updateField(field.key, $event)"
          />

          <textarea
            v-else-if="field.kind === 'textarea' || field.kind === 'json'"
            :rows="field.rows ?? 5"
            class="w-full rounded-card border border-border bg-surface px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary"
            :placeholder="field.placeholder"
            :required="field.required"
            :disabled="readOnly || disabled || field.disabled"
            :value="String(modelValue[field.key] ?? '')"
            @input="
              updateField(field.key, ($event.target as HTMLTextAreaElement).value)
            "
          />

          <div v-else-if="field.kind === 'upload'" class="space-y-3">
            <div
              v-if="
                field.uploadPreview === 'image' &&
                resolvePublicUploadUrl(field, modelValue[field.key])
              "
              class="overflow-hidden rounded-card border border-border bg-surface-alt"
            >
              <img
                :src="resolvePublicUploadUrl(field, modelValue[field.key])"
                :alt="field.label"
                class="max-h-56 w-full object-cover"
              />
            </div>

            <div
              v-else-if="String(modelValue[field.key] ?? '').trim()"
              class="rounded-card border border-border bg-surface-alt px-4 py-3 text-small text-ink"
            >
              <p class="font-semibold text-ink">Current file</p>
              <p class="mt-1 break-all text-ink-muted">
                {{ getStoredFileName(modelValue[field.key]) }}
              </p>
            </div>

            <input
              type="file"
              class="w-full rounded-card border border-border bg-surface px-3 py-2.5 text-body text-ink outline-none transition-colors file:mr-4 file:rounded-control file:border-0 file:bg-surface-alt file:px-3 file:py-1.5 file:text-small file:font-semibold file:text-ink hover:file:bg-surface-alt focus:border-primary"
              :accept="field.accept"
              :required="field.required && !String(modelValue[field.key] ?? '').trim()"
              :disabled="
                readOnly || disabled || field.disabled || uploadingFields[field.key]
              "
              @change="handleUploadChange(field, $event)"
            />

            <p class="text-caption text-ink-muted">
              {{
                uploadingFields[field.key]
                  ? 'Uploading...'
                  : field.helpText ??
                    'Choose a file to upload directly to Supabase storage.'
              }}
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
                  :disabled="readOnly || disabled || field.disabled"
                  :checked="
                    Array.isArray(modelValue[field.key])
                      ? (modelValue[field.key] as unknown[]).map(String).includes(option.value)
                      : false
                  "
                  @change="
                    toggleMultiSelect(
                      field.key,
                      option.value,
                      ($event.target as HTMLInputElement).checked,
                    )
                  "
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
            :model-value="String(modelValue[field.key] ?? '')"
            :placeholder="field.placeholder ?? 'Choose an icon'"
            :disabled="readOnly || disabled || field.disabled"
            @update:model-value="updateField(field.key, $event)"
          />

          <select
            v-else-if="field.kind === 'select'"
            class="w-full rounded-card border border-border bg-surface px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary"
            :required="field.required"
            :disabled="readOnly || disabled || field.disabled"
            :value="String(modelValue[field.key] ?? '')"
            @change="
              updateField(field.key, ($event.target as HTMLSelectElement).value)
            "
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
            :disabled="readOnly || disabled || field.disabled"
            :checked="Boolean(modelValue[field.key])"
            @change="
              updateField(field.key, ($event.target as HTMLInputElement).checked)
            "
          />

          <input
            v-else
            :type="
              field.kind === 'number'
                ? 'number'
                : field.kind === 'date'
                  ? 'date'
                  : field.kind === 'time'
                    ? 'time'
                    : 'text'
            "
            class="w-full rounded-card border border-border bg-surface px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary"
            :placeholder="field.placeholder"
            :required="field.required"
            :disabled="readOnly || disabled || field.disabled"
            :value="String(modelValue[field.key] ?? '')"
            @input="updateField(field.key, ($event.target as HTMLInputElement).value)"
          />

          <p
            v-if="
              field.helpText &&
              field.kind !== 'upload' &&
              field.kind !== 'multiselect'
            "
            class="text-caption text-ink-muted"
          >
            {{ field.helpText }}
          </p>
          <p v-if="uploadErrors[field.key]" class="text-caption text-danger">
            {{ uploadErrors[field.key] }}
          </p>
        </label>
      </div>

      <div
        v-if="!readOnly"
        class="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"
      >
        <div class="flex flex-wrap items-center gap-3">
          <slot name="footer-actions" />
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <button
            v-if="!hideCancelButton"
            type="button"
            class="rounded-control border border-border px-4 py-2.5 text-small font-semibold text-ink hover:bg-surface-alt"
            @click="emit('cancel')"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="rounded-control bg-primary px-4 py-2.5 text-small font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="loading || Object.values(uploadingFields).some(Boolean)"
          >
            {{
              loading
                ? "Saving..."
                : Object.values(uploadingFields).some(Boolean)
                  ? "Uploading..."
                  : submitLabel
            }}
          </button>
        </div>
      </div>

      <div v-else class="mt-6 border-t border-border pt-4">
        <button
          type="button"
          class="rounded-control border border-border px-4 py-2.5 text-small font-semibold text-ink hover:bg-surface-alt"
          @click="emit('cancel')"
        >
          Close
        </button>
      </div>
    </form>
  </div>
</template>

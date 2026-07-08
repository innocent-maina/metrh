<script setup lang="ts">
import type { CrudField } from "~~/shared/dashboard-crud";

interface Props {
  open: boolean;
  title: string;
  description?: string;
  fields: CrudField[];
  modelValue: Record<string, unknown>;
  submitLabel: string;
  loading?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  description: "",
  loading: false,
  readOnly: false,
  disabled: false,
});

const emit = defineEmits<{
  (event: "update:open", value: boolean): void;
  (event: "update:modelValue", value: Record<string, unknown>): void;
  (event: "submit"): void;
  (event: "cancel"): void;
}>();

function updateField(key: string, value: unknown) {
  emit("update:modelValue", { ...props.modelValue, [key]: value });
}

function close() {
  emit("cancel");
  emit("update:open", false);
}
</script>

<template>
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
        v-if="open"
        class="fixed inset-0 z-50 flex items-stretch justify-end bg-ink/50 px-0 py-0"
      >
        <button
          type="button"
          class="absolute inset-0 cursor-default"
          aria-label="Close form"
          @click="close"
        />

        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="translate-x-full"
          enter-to-class="translate-x-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="translate-x-0"
          leave-to-class="translate-x-full"
        >
          <aside
            class="relative z-10 flex h-full w-full max-w-2xl flex-col border-l border-border bg-surface shadow-elevated"
          >
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
                <button
                  type="button"
                  class="rounded-control border border-border px-3 py-2 text-small font-semibold text-ink hover:bg-surface-alt"
                  @click="close"
                >
                  Close
                </button>
              </div>
            </header>

            <form class="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6" @submit.prevent="emit('submit')">
              <div class="grid gap-4 md:grid-cols-2">
                <label
                  v-for="field in fields"
                  v-show="!field.serverOnly"
                  :key="field.key"
                  class="space-y-2"
                  :class="field.kind === 'textarea' || field.kind === 'json' ? 'md:col-span-2' : ''"
                >
                  <span class="block text-small font-semibold text-ink">
                    {{ field.label }}
                    <span v-if="field.required" class="text-danger">*</span>
                  </span>

                  <textarea
                    v-if="field.kind === 'textarea' || field.kind === 'json'"
                    :rows="field.rows ?? 5"
                    class="w-full rounded-card border border-border bg-white px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary"
                    :placeholder="field.placeholder"
                    :required="field.required"
                    :disabled="readOnly || disabled || field.disabled"
                    :value="String(modelValue[field.key] ?? '')"
                    @input="updateField(field.key, ($event.target as HTMLTextAreaElement).value)"
                  />

                  <select
                    v-else-if="field.kind === 'select'"
                    class="w-full rounded-card border border-border bg-white px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary"
                    :required="field.required"
                    :disabled="readOnly || disabled || field.disabled"
                    :value="String(modelValue[field.key] ?? '')"
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
                    :disabled="readOnly || disabled || field.disabled"
                    :checked="Boolean(modelValue[field.key])"
                    @change="updateField(field.key, ($event.target as HTMLInputElement).checked)"
                  />

                  <input
                    v-else
                    :type="field.kind === 'number' ? 'number' : field.kind === 'date' ? 'date' : field.kind === 'time' ? 'time' : 'text'"
                    class="w-full rounded-card border border-border bg-white px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary"
                    :placeholder="field.placeholder"
                    :required="field.required"
                    :disabled="readOnly || disabled || field.disabled"
                    :value="String(modelValue[field.key] ?? '')"
                    @input="updateField(field.key, ($event.target as HTMLInputElement).value)"
                  />

                  <p v-if="field.helpText" class="text-caption text-ink-muted">
                    {{ field.helpText }}
                  </p>
                </label>
              </div>

              <div v-if="!readOnly" class="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  class="rounded-control border border-border px-4 py-2.5 text-small font-semibold text-ink hover:bg-surface-alt"
                  @click="close"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="rounded-control bg-primary px-4 py-2.5 text-small font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
                  :disabled="loading"
                >
                  {{ loading ? "Saving..." : submitLabel }}
                </button>
              </div>
              <div v-else class="mt-6 border-t border-border pt-4">
                <button
                  type="button"
                  class="rounded-control border border-border px-4 py-2.5 text-small font-semibold text-ink hover:bg-surface-alt"
                  @click="close"
                >
                  Close
                </button>
              </div>
            </form>
          </aside>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

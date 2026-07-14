<script setup lang="ts">
import { richTextToHtml, richTextToPlainText } from "~~/shared/rich-text";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
  }>(),
  {
    placeholder: "",
    disabled: false,
    required: false,
  },
);

const emit = defineEmits<{
  (event: "update:modelValue", value: string): void;
}>();

const editorRef = ref<HTMLElement | null>(null);

function syncEditorContent(value: string) {
  const editor = editorRef.value;
  if (!editor) return;

  const sanitized = richTextToHtml(value);
  if (editor.innerHTML !== sanitized) {
    editor.innerHTML = sanitized;
  }
}

function emitEditorValue(rawValue: string) {
  emit("update:modelValue", richTextToHtml(rawValue));
}

function applyFormat(command: string, value?: string) {
  if (props.disabled) return;

  editorRef.value?.focus();
  document.execCommand(command, false, value);
  emitEditorValue(editorRef.value?.innerHTML ?? "");
}

function promptForLink() {
  if (props.disabled) return;

  const currentSelection = window.getSelection();
  const selectedText = currentSelection?.toString().trim() ?? "";
  const url = window.prompt("Enter a link URL", "https://");

  if (!url) return;
  applyFormat("createLink", url);

  if (!selectedText) {
    emitEditorValue(editorRef.value?.innerHTML ?? "");
  }
}

function clearFormatting() {
  if (props.disabled) return;

  editorRef.value?.focus();
  document.execCommand("removeFormat");
  emitEditorValue(editorRef.value?.innerHTML ?? "");
}

function handleInput() {
  emitEditorValue(editorRef.value?.innerHTML ?? "");
}

function handlePaste(event: ClipboardEvent) {
  if (props.disabled) return;

  event.preventDefault();

  const html = event.clipboardData?.getData("text/html") ?? "";
  const text = event.clipboardData?.getData("text/plain") ?? "";
  const value = html || text.replace(/\n/g, "<br>");

  document.execCommand("insertHTML", false, richTextToHtml(value));
  emitEditorValue(editorRef.value?.innerHTML ?? "");
}

const plainTextValue = computed(() => richTextToPlainText(props.modelValue));

watch(
  () => props.modelValue,
  (value) => {
    syncEditorContent(value);
  },
  { immediate: true },
);

onMounted(() => {
  syncEditorContent(props.modelValue);
});
</script>

<template>
  <div class="space-y-3">
    <div
      class="flex flex-wrap items-center gap-2 rounded-card border border-border bg-surface-alt p-2"
      aria-label="Rich text toolbar"
    >
      <button
        type="button"
        class="rounded-control border border-border bg-surface px-3 py-1.5 text-caption font-semibold uppercase tracking-wide text-ink hover:bg-surface"
        :disabled="disabled"
        @mousedown.prevent
        @click="applyFormat('formatBlock', 'h2')"
      >
        H2
      </button>
      <button
        type="button"
        class="rounded-control border border-border bg-surface px-3 py-1.5 text-caption font-semibold uppercase tracking-wide text-ink hover:bg-surface"
        :disabled="disabled"
        @mousedown.prevent
        @click="applyFormat('formatBlock', 'h3')"
      >
        H3
      </button>
      <button
        type="button"
        class="rounded-control border border-border bg-surface px-3 py-1.5 text-caption font-semibold uppercase tracking-wide text-ink hover:bg-surface"
        :disabled="disabled"
        @mousedown.prevent
        @click="applyFormat('bold')"
      >
        Bold
      </button>
      <button
        type="button"
        class="rounded-control border border-border bg-surface px-3 py-1.5 text-caption font-semibold uppercase tracking-wide text-ink hover:bg-surface"
        :disabled="disabled"
        @mousedown.prevent
        @click="applyFormat('italic')"
      >
        Italic
      </button>
      <button
        type="button"
        class="rounded-control border border-border bg-surface px-3 py-1.5 text-caption font-semibold uppercase tracking-wide text-ink hover:bg-surface"
        :disabled="disabled"
        @mousedown.prevent
        @click="applyFormat('insertUnorderedList')"
      >
        Bullets
      </button>
      <button
        type="button"
        class="rounded-control border border-border bg-surface px-3 py-1.5 text-caption font-semibold uppercase tracking-wide text-ink hover:bg-surface"
        :disabled="disabled"
        @mousedown.prevent
        @click="applyFormat('insertOrderedList')"
      >
        Numbered
      </button>
      <button
        type="button"
        class="rounded-control border border-border bg-surface px-3 py-1.5 text-caption font-semibold uppercase tracking-wide text-ink hover:bg-surface"
        :disabled="disabled"
        @mousedown.prevent
        @click="applyFormat('formatBlock', 'blockquote')"
      >
        Quote
      </button>
      <button
        type="button"
        class="rounded-control border border-border bg-surface px-3 py-1.5 text-caption font-semibold uppercase tracking-wide text-ink hover:bg-surface"
        :disabled="disabled"
        @mousedown.prevent
        @click="promptForLink"
      >
        Link
      </button>
      <button
        type="button"
        class="rounded-control border border-border bg-surface px-3 py-1.5 text-caption font-semibold uppercase tracking-wide text-ink hover:bg-surface"
        :disabled="disabled"
        @mousedown.prevent
        @click="clearFormatting"
      >
        Clear
      </button>
    </div>

    <div class="relative">
      <div
        ref="editorRef"
        class="min-h-72 rounded-card border border-border bg-surface px-4 py-3 text-body text-ink outline-none transition-colors focus:border-primary"
        :class="disabled ? 'cursor-not-allowed bg-surface-alt/60' : ''"
        :contenteditable="!disabled"
        role="textbox"
        :aria-multiline="true"
        :data-placeholder="placeholder"
        @input="handleInput"
        @paste="handlePaste"
      />

      <div
        v-if="!plainTextValue.trim() && placeholder"
        class="pointer-events-none absolute left-4 top-3 text-body text-ink-muted"
      >
        {{ placeholder }}
      </div>

      <textarea
        class="absolute left-0 top-0 h-px w-px opacity-0 pointer-events-none"
        :value="plainTextValue"
        :required="required"
        tabindex="-1"
        aria-hidden="true"
      />
    </div>
  </div>
</template>

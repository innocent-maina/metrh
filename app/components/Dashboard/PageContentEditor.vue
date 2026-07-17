<script setup lang="ts">
import { richTextToHtml } from "~~/shared/rich-text";

interface Props {
  slug: string;
  title: string;
  description: string;
  backTo?: string;
}

type PageRecord = Record<string, unknown> & {
  id: string;
  slug: string;
  title: string;
  content: string | null;
  seo_title: string | null;
  seo_description: string | null;
  status: string | null;
  updated_at?: string | null;
};

const props = withDefaults(defineProps<Props>(), {
  backTo: "/dashboard/pages-and-content",
});

const supabase = useSupabaseClient();

const statusOptions = [
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
  { label: "Archived", value: "archived" },
];

const loadedPage = ref<PageRecord | null>(null);
const isLoading = ref(true);
const isEditing = ref(true);
const isSaving = ref(false);
const notice = ref<string | null>(null);
const loadError = ref<string | null>(null);

const draft = reactive({
  slug: props.slug,
  title: "",
  content: "",
  seo_title: "",
  seo_description: "",
  status: "draft",
});

function toDraftValue(value: unknown) {
  return String(value ?? "");
}

function syncDraft(page: PageRecord | null) {
  loadedPage.value = page;
  draft.slug = props.slug;
  draft.title = toDraftValue(page?.title);
  draft.content = toDraftValue(page?.content);
  draft.seo_title = toDraftValue(page?.seo_title);
  draft.seo_description = toDraftValue(page?.seo_description);
  draft.status = toDraftValue(page?.status) || "draft";
}

async function loadPage() {
  isLoading.value = true;
  loadError.value = null;

  try {
    const { data, error } = await supabase
      .from("pages" as never)
      .select("*")
      .eq("slug", props.slug)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error("Page not found.");
    }

    syncDraft(data as PageRecord);
  } catch (error) {
    loadedPage.value = null;
    loadError.value =
      error instanceof Error ? error.message : "Could not load the page.";
  } finally {
    isLoading.value = false;
  }
}

await loadPage();

const previewHtml = computed(() => richTextToHtml(draft.content));

const isDirty = computed(() => {
  const page = loadedPage.value;
  if (!page) return false;

  return (
    draft.title !== toDraftValue(page.title) ||
    draft.content !== toDraftValue(page.content) ||
    draft.seo_title !== toDraftValue(page.seo_title) ||
    draft.seo_description !== toDraftValue(page.seo_description) ||
    draft.status !== toDraftValue(page.status || "draft")
  );
});

const lastUpdated = computed(() => {
  const value = loadedPage.value?.updated_at;
  if (!value) return "";

  const formatted = new Date(value);
  if (Number.isNaN(formatted.getTime())) {
    return value;
  }

  return formatted.toLocaleString();
});

async function saveChanges() {
  if (!loadedPage.value) return;

  isSaving.value = true;
  notice.value = null;

  try {
    const payload = {
      title: draft.title.trim(),
      slug: props.slug,
      content: draft.content,
      seo_title: draft.seo_title.trim() || null,
      seo_description: draft.seo_description.trim() || null,
      status: draft.status || "draft",
    };

    const { data, error } = await (supabase.from("pages" as never) as any)
      .update(payload)
      .eq("id", loadedPage.value.id)
      .select("*")
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      syncDraft(data as PageRecord);
    } else {
      await loadPage();
    }

    notice.value = `${props.title} saved successfully.`;
  } catch (error) {
    notice.value =
      error instanceof Error ? error.message : "Could not save the page.";
  } finally {
    isSaving.value = false;
  }
}

function startEditing() {
  isEditing.value = true;
}

function stopEditing() {
  if (isDirty.value) {
    const confirmed = window.confirm(
      "Discard unsaved changes and stop editing this page?",
    );

    if (!confirmed) {
      return;
    }
  }

  syncDraft(loadedPage.value);
  isEditing.value = false;
}
</script>

<template>
  <div class="space-y-6">
    <section class="rounded-card border border-border bg-surface p-6 md:p-8 shadow-card">
      <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div class="max-w-3xl">
          <p class="text-small font-semibold uppercase tracking-wide text-info">
            Legal
          </p>
          <h2 class="mt-2 font-display font-bold text-h1 text-ink">
            {{ title }}
          </h2>
          <p class="mt-4 text-body text-ink-muted">
            {{ description }}
          </p>
          <p v-if="lastUpdated" class="mt-3 text-caption text-ink-muted">
            Last updated: {{ lastUpdated }}
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
            type="button"
            class="rounded-control border border-border px-4 py-2.5 text-small font-semibold text-ink hover:bg-surface-alt"
            @click="isEditing ? stopEditing() : startEditing()"
          >
            {{ isEditing ? "Stop editing" : "Edit page" }}
          </button>
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
      v-if="loadError"
      class="rounded-card border border-danger/30 bg-danger/5 px-4 py-3 text-small text-danger"
    >
      {{ loadError }}
    </div>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
      <section class="rounded-card border border-border bg-surface p-6 shadow-card">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-small font-semibold uppercase tracking-wide text-info">
              Live preview
            </p>
            <h3 class="mt-1 font-display font-semibold text-h3 text-ink">
              {{ draft.title || title }}
            </h3>
          </div>

          <span
            class="rounded-full border border-border bg-surface-alt px-3 py-1 text-caption font-semibold uppercase tracking-wide text-ink-muted"
          >
            {{ draft.status || "draft" }}
          </span>
        </div>

        <div class="mt-5 rounded-card border border-border bg-[#f8f9fb] p-6">
          <div
            v-if="previewHtml"
            class="page-preview text-body text-ink"
            v-html="previewHtml"
          />
          <p v-else class="text-body text-ink-muted">
            Add page content to see the preview here.
          </p>
        </div>
      </section>

      <section class="rounded-card border border-border bg-surface p-6 shadow-card">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-small font-semibold uppercase tracking-wide text-info">
              Editor
            </p>
            <h3 class="mt-1 font-display font-semibold text-h3 text-ink">
              Page details
            </h3>
          </div>

          <p
            :class="isEditing ? 'text-primary' : 'text-ink-muted'"
            class="text-caption font-semibold uppercase tracking-wide"
          >
            {{ isEditing ? "Editing enabled" : "Read only" }}
          </p>
        </div>

        <form class="mt-6 space-y-5" @submit.prevent="saveChanges">
          <label class="block space-y-2">
            <span class="block text-small font-semibold text-ink">Title</span>
            <input
              v-model="draft.title"
              type="text"
              class="w-full rounded-card border border-border bg-surface px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:bg-surface-alt/60"
              :disabled="!isEditing"
            />
          </label>

          <label class="block space-y-2">
            <span class="block text-small font-semibold text-ink">Slug</span>
            <input
              v-model="draft.slug"
              type="text"
              class="w-full rounded-card border border-border bg-surface-alt px-3 py-2.5 text-body text-ink-muted outline-none"
              disabled
            />
          </label>

          <label class="block space-y-2">
            <span class="block text-small font-semibold text-ink">Status</span>
            <select
              v-model="draft.status"
              class="w-full rounded-card border border-border bg-surface px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:bg-surface-alt/60"
              :disabled="!isEditing"
            >
              <option
                v-for="option in statusOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </label>

          <label class="block space-y-2">
            <span class="block text-small font-semibold text-ink">
              SEO title
            </span>
            <input
              v-model="draft.seo_title"
              type="text"
              class="w-full rounded-card border border-border bg-surface px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:bg-surface-alt/60"
              :disabled="!isEditing"
            />
          </label>

          <label class="block space-y-2">
            <span class="block text-small font-semibold text-ink">
              SEO description
            </span>
            <textarea
              v-model="draft.seo_description"
              rows="4"
              class="w-full rounded-card border border-border bg-surface px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:bg-surface-alt/60"
              :disabled="!isEditing"
            />
          </label>

          <label class="block space-y-2">
            <span class="block text-small font-semibold text-ink">
              Page content
            </span>
            <RichTextEditor
              v-model="draft.content"
              placeholder="Write the page content here."
              :disabled="!isEditing"
            />
          </label>

          <div class="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p class="text-caption text-ink-muted">
              {{ isEditing ? "Use the toolbar to format headings, lists, quotes, and links." : "Click Edit page to make changes again." }}
            </p>

            <button
              v-if="isEditing"
              type="submit"
              class="rounded-control bg-primary px-4 py-2.5 text-small font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="isSaving || isLoading"
            >
              {{ isSaving ? "Saving..." : "Save changes" }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </div>
</template>

<style scoped>
.page-preview :deep(h2) {
  font-family: var(--font-display);
  font-size: var(--text-h3);
  font-weight: 600;
  color: var(--color-ink);
  margin: 1.75rem 0 0.75rem;
}

.page-preview :deep(h3) {
  font-family: var(--font-display);
  font-size: var(--text-h4);
  font-weight: 600;
  color: var(--color-ink);
  margin: 1.5rem 0 0.5rem;
}

.page-preview :deep(p) {
  margin-bottom: 1rem;
  color: var(--color-ink-muted);
}

.page-preview :deep(ul),
.page-preview :deep(ol) {
  margin: 0 0 1rem;
  padding-left: 1.5rem;
  color: var(--color-ink-muted);
}

.page-preview :deep(li) {
  margin: 0.35rem 0;
}

.page-preview :deep(a) {
  color: var(--color-primary);
  text-decoration: underline;
}

.page-preview :deep(blockquote) {
  margin: 1rem 0;
  border-left: 3px solid var(--color-primary);
  padding-left: 1rem;
  color: var(--color-ink-muted);
}
</style>

<script setup lang="ts">
const props = defineProps<{
  slug: string;
}>();

const { data, pending, error } = useLegalPage(props.slug);

useSeoMeta({
  title: () => data.value?.seo_title || data.value?.title || "MeTRH",
  description: () => data.value?.seo_description || undefined,
});
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">
    <div v-if="pending" class="animate-pulse space-y-4" aria-busy="true">
      <div class="h-8 w-2/3 rounded bg-surface-alt" />
      <div class="h-4 w-full rounded bg-surface-alt" />
      <div class="h-4 w-full rounded bg-surface-alt" />
      <div class="h-4 w-5/6 rounded bg-surface-alt" />
    </div>

    <div
      v-else-if="error"
      class="rounded-card border border-dashed border-border bg-surface-alt p-10 text-center"
    >
      <Icon
        name="lucide:file-question"
        class="size-6 mx-auto text-ink-muted"
        aria-hidden="true"
      />
      <p class="mt-3 text-small text-ink-muted">
        This page hasn't been published yet. Check back soon, or
        <NuxtLink to="/contact" class="text-primary hover:underline"
          >contact us</NuxtLink
        >
        if you need this information now.
      </p>
    </div>

    <template v-else-if="data">
      <h1 class="font-display font-semibold text-h1 text-ink">
        {{ data.title }}
      </h1>
      <p class="mt-2 text-caption text-ink-muted">
        Last updated
        {{
          new Date(data.updated_at).toLocaleDateString("en-KE", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        }}
      </p>
      <!--
        Content is authored exclusively by staff through /dashboard/pages
        (never from public input), so rendering it as HTML here is safe —
        this is the standard CMS-content trust boundary, not user-generated
        content.
      -->
      <div
        class="legal-content mt-8 text-body text-ink"
        v-html="data.content"
      />
    </template>
  </div>
</template>

<style scoped>
.legal-content :deep(h2) {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--text-h3);
  color: var(--color-ink);
  margin-top: 2rem;
  margin-bottom: 0.75rem;
}
.legal-content :deep(p) {
  margin-bottom: 1rem;
  color: var(--color-ink-muted);
}
.legal-content :deep(ul) {
  list-style: disc;
  padding-left: 1.5rem;
  margin-bottom: 1rem;
  color: var(--color-ink-muted);
}
.legal-content :deep(a) {
  color: var(--color-primary);
  text-decoration: underline;
}
</style>

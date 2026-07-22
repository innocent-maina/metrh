<script setup lang="ts">
const props = defineProps<{
  title: string;
  seoTitle?: string;
  seoDescription?: string;
  content: string;
}>();

const legalImages = useHospitalMedia();

useSeoMeta({
  title: () => props.seoTitle || props.title || "MeTRH",
  description: () => props.seoDescription || undefined,
});
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">
    <h1 class="font-display font-semibold text-h1 text-ink">
      {{ title }}
    </h1>

    <div class="legal-content mt-8 text-body text-ink" v-html="content" />
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

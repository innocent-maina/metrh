<script setup lang="ts">
definePageMeta({ layout: "dashboard" });

const sections = useDashboardSections();
const pagesAndContentSection = computed(
  () => sections.find((section) => section.id === "pages-and-content") ?? null,
);

const childLinks = computed(() => pagesAndContentSection.value?.children ?? []);

useSeoMeta({
  title: "Pages & Content — MeTRH Dashboard",
  description: "Edit public pages, homepage content, and legal pages.",
});
</script>

<template>
  <div class="space-y-6">
    <section class="rounded-card border border-border bg-surface p-6 md:p-8 shadow-card">
      <div class="max-w-3xl">
        <p class="text-small font-semibold uppercase tracking-wide text-info">
          Pages &amp; Content
        </p>
        <h2 class="mt-2 font-display font-bold text-h1 text-ink">
          Public pages and legal pages
        </h2>
        <p class="mt-4 text-body text-ink-muted">
          Use the child pages in the sidebar to edit the homepage, About,
          Services, Careers, Blog, Contact, Tenders, and legal page content.
        </p>
      </div>
    </section>

    <section class="rounded-card border border-border bg-surface p-6 shadow-card">
      <h3 class="font-display font-semibold text-h3 text-ink">Quick access</h3>
      <div class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <NuxtLink
          v-for="child in childLinks"
          :key="child.id"
          :to="child.to"
          class="rounded-card border border-border bg-surface-alt p-5 hover:border-primary/30 hover:bg-surface transition-colors"
        >
          <p class="font-display font-semibold text-h4 text-ink">
            {{ child.label }}
          </p>
          <p class="mt-2 text-small text-ink-muted">
            {{ child.description }}
          </p>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

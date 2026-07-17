<script setup lang="ts">
definePageMeta({ layout: "dashboard" });

const { data: homeSections } = await useAsyncData(
  "dashboard-pages-home-sections",
  async () => {
    return (await fetchDashboardResourceRows("page_sections", {
      page_slug: "home",
      is_active: true,
    })) as Array<{ id: string; section_key: string }>;
  },
  { default: () => [] as Array<{ id: string; section_key: string }> },
);

const homeSectionIds = computed(() =>
  (homeSections.value ?? []).map((row) => row.id),
);

const heroDefaults = {
  page_slug: "home",
  section_key: "hero",
};

const sectionDefaults = {
  page_slug: "home",
};

useSeoMeta({
  title: "Home Content — MeTRH Dashboard",
  description: "Edit homepage slides, stats, highlights, and support links.",
});
</script>

<template>
  <div class="space-y-6">
    <section class="rounded-card border border-border bg-surface p-6 md:p-8 shadow-card">
      <div class="max-w-3xl">
        <p class="text-small font-semibold uppercase tracking-wide text-info">
          Home
        </p>
        <h2 class="mt-2 font-display font-bold text-h1 text-ink">
          Homepage content
        </h2>
        <p class="mt-4 text-body text-ink-muted">
          Edit the hero carousel, MeTRH at a glance, community impact, and
          teaching context content shown on the public homepage.
        </p>
      </div>
    </section>

    <CmsResourcePanel
      resource-id="page_slides"
      title="Hero slides"
      description="Edit the rotating homepage hero slides."
      use-page-editor
      :query-filters="heroDefaults"
      :lookup-query-filters="{}"
      :create-defaults="heroDefaults"
    />

    <CmsResourcePanel
      resource-id="page_sections"
      title="Homepage sections"
      description="Edit MeTRH at a glance, community impact, services overview, careers CTA, and teaching context sections."
      use-page-editor
      :query-filters="sectionDefaults"
      :create-defaults="sectionDefaults"
    />

    <CmsResourcePanel
      resource-id="page_section_items"
      title="Homepage section items"
      description="Edit the homepage highlight items, stats, and teaching links."
      use-page-editor
      :query-filters="{ section_id: homeSectionIds }"
      :lookup-query-filters="{ page_sections: { page_slug: 'home' } }"
      :create-defaults="{ section_id: homeSectionIds[0] ?? '' }"
    />
  </div>
</template>

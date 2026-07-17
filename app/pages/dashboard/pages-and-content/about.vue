<script setup lang="ts">
definePageMeta({ layout: "dashboard" });

const { data: aboutSections } = await useAsyncData(
  "dashboard-pages-about-sections",
  async () => {
    return (await fetchDashboardResourceRows("page_sections", {
      page_slug: "about",
      is_active: true,
    })) as Array<{ id: string; section_key: string }>;
  },
  { default: () => [] as Array<{ id: string; section_key: string }> },
);

const aboutSectionIds = computed(() =>
  (aboutSections.value ?? []).map((row) => row.id),
);

const aboutDefaults = {
  page_slug: "about",
};

useSeoMeta({
  title: "About Content — MeTRH Dashboard",
  description: "Edit the About page hero, vision, values, and growth content.",
});
</script>

<template>
  <div class="space-y-6">
    <section class="rounded-card border border-border bg-surface p-6 md:p-8 shadow-card">
      <div class="max-w-3xl">
        <p class="text-small font-semibold uppercase tracking-wide text-info">
          About
        </p>
        <h2 class="mt-2 font-display font-bold text-h1 text-ink">
          About page content
        </h2>
        <p class="mt-4 text-body text-ink-muted">
          Edit the vision, mission, values, strategic goals, and growth
          sections that shape the public About page.
        </p>
      </div>
    </section>

    <CmsResourcePanel
      resource-id="page_sections"
      title="About sections"
      description="Edit the introductory block and the About page content sections."
      use-page-editor
      :query-filters="aboutDefaults"
      :create-defaults="aboutDefaults"
    />

    <CmsResourcePanel
      resource-id="page_section_items"
      title="About section items"
      description="Edit the values, goals, growth projects, and teaching links."
      use-page-editor
      :query-filters="{ section_id: aboutSectionIds }"
      :lookup-query-filters="{ page_sections: { page_slug: 'about' } }"
      :create-defaults="{ section_id: aboutSectionIds[0] ?? '' }"
    />
  </div>
</template>

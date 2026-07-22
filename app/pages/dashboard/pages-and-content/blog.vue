<script setup lang="ts">
definePageMeta({ layout: "dashboard" });

const blogDefaults = {
  page_slug: "blog",
  section_key: "blog-intro",
  section_type: "content",
  eyebrow: "Blog & news",
  title: "Milestones, community impact, and service updates",
  summary:
    "MeTRH uses this space for stories that matter to patients, families, referrers, and the wider Meru community.",
};

const blogFilters = {
  page_slug: "blog",
};

useSeoMeta({
  title: "Blog Content — MeTRH Dashboard",
  description: "Edit the Blog page intro and editorial copy.",
});
</script>

<template>
  <div class="space-y-6">
    <section class="rounded-card border border-border bg-surface p-6 md:p-8 shadow-card">
      <div class="max-w-3xl">
        <p class="text-small font-semibold uppercase tracking-wide text-info">
          Blog
        </p>
        <h2 class="mt-2 font-display font-bold text-h1 text-ink">
          Blog page content
        </h2>
        <p class="mt-4 text-body text-ink-muted">
          Edit the public blog introduction and editorial framing.
        </p>
      </div>
    </section>

    <CmsResourcePanel
      resource-id="page_sections"
      title="Blog sections"
      description="Edit the introductory block and supporting text for the Blog page."
      use-page-editor
      :query-filters="blogFilters"
      :create-defaults="blogDefaults"
    />
  </div>
</template>

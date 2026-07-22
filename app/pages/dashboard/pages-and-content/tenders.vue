<script setup lang="ts">
definePageMeta({ layout: "dashboard" });

const tendersDefaults = {
  page_slug: "tenders",
  section_key: "tenders-intro",
  section_type: "content",
  eyebrow: "Tenders",
  title: "Tender notices and supporting files",
  summary:
    "This section is designed for open tender notices, supplier lists, and procurement PDFs.",
};

const tendersFilters = {
  page_slug: "tenders",
};

useSeoMeta({
  title: "Tenders Content — MeTRH Dashboard",
  description: "Edit the Tenders page intro and procurement copy.",
});
</script>

<template>
  <div class="space-y-6">
    <section class="rounded-card border border-border bg-surface p-6 md:p-8 shadow-card">
      <div class="max-w-3xl">
        <p class="text-small font-semibold uppercase tracking-wide text-info">
          Tenders
        </p>
        <h2 class="mt-2 font-display font-bold text-h1 text-ink">
          Tenders page content
        </h2>
        <p class="mt-4 text-body text-ink-muted">
          Edit the public tender introduction and supporting copy.
        </p>
      </div>
    </section>

    <CmsResourcePanel
      resource-id="page_sections"
      title="Tenders sections"
      description="Edit the introductory block and support text for the Tenders page."
      use-page-editor
      :query-filters="tendersFilters"
      :create-defaults="tendersDefaults"
    />
  </div>
</template>

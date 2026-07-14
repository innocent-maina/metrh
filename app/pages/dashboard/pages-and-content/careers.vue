<script setup lang="ts">
definePageMeta({ layout: "dashboard" });

const careersDefaults = {
  page_slug: "careers",
  section_key: "careers-intro",
  section_type: "content",
  eyebrow: "Careers & opportunities",
  title: "Current openings and recruitment rounds",
  summary:
    "MeTRH recruits on a rolling basis. When there are live openings, they appear here with application instructions and upload support.",
};

useSeoMeta({
  title: "Careers Content — MeTRH Dashboard",
  description: "Edit the Careers page intro and recruitment copy.",
});
</script>

<template>
  <div class="space-y-6">
    <section class="rounded-card border border-border bg-surface p-6 md:p-8 shadow-card">
      <div class="max-w-3xl">
        <p class="text-small font-semibold uppercase tracking-wide text-info">
          Careers
        </p>
        <h2 class="mt-2 font-display font-bold text-h1 text-ink">
          Careers page content
        </h2>
        <p class="mt-4 text-body text-ink-muted">
          Edit the public recruitment introduction and supporting copy.
        </p>
      </div>
    </section>

    <CmsResourcePanel
      resource-id="page_sections"
      title="Careers sections"
      description="Edit the Careers page introduction and support copy."
      :query-filters="careersDefaults"
      :create-defaults="careersDefaults"
    />
  </div>
</template>

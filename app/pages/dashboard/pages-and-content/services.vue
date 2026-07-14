<script setup lang="ts">
definePageMeta({ layout: "dashboard" });

const serviceDefaults = {
  page_slug: "services",
  section_key: "services-intro",
  section_type: "content",
  eyebrow: "Services",
  title: "Clinical services organized for fast access",
  summary:
    "MeTRH's services are grouped by department so patients, families, and referrers can find what they need without scanning a wall of text.",
};

useSeoMeta({
  title: "Services Content — MeTRH Dashboard",
  description: "Edit the Services page intro and support copy.",
});
</script>

<template>
  <div class="space-y-6">
    <section class="rounded-card border border-border bg-surface p-6 md:p-8 shadow-card">
      <div class="max-w-3xl">
        <p class="text-small font-semibold uppercase tracking-wide text-info">
          Services
        </p>
        <h2 class="mt-2 font-display font-bold text-h1 text-ink">
          Services page content
        </h2>
        <p class="mt-4 text-body text-ink-muted">
          Edit the introductory copy and support messaging for the public
          Services page.
        </p>
      </div>
    </section>

    <CmsResourcePanel
      resource-id="page_sections"
      title="Services sections"
      description="Edit the introductory text and any services page callouts."
      :query-filters="serviceDefaults"
      :create-defaults="serviceDefaults"
    />
  </div>
</template>

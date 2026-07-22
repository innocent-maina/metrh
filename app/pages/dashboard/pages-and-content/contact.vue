<script setup lang="ts">
definePageMeta({ layout: "dashboard" });

const contactDefaults = {
  page_slug: "contact",
  section_key: "contact-intro",
  section_type: "content",
  eyebrow: "Contact",
  title: "Reach MeTRH quickly and clearly",
  summary:
    "Use the emergency line for urgent care. Use the form for general enquiries, directions, appointments, and institutional requests.",
};

const contactFilters = {
  page_slug: "contact",
};

useSeoMeta({
  title: "Contact Content — MeTRH Dashboard",
  description: "Edit the Contact page intro and enquiry copy.",
});
</script>

<template>
  <div class="space-y-6">
    <section class="rounded-card border border-border bg-surface p-6 md:p-8 shadow-card">
      <div class="max-w-3xl">
        <p class="text-small font-semibold uppercase tracking-wide text-info">
          Contact
        </p>
        <h2 class="mt-2 font-display font-bold text-h1 text-ink">
          Contact page content
        </h2>
        <p class="mt-4 text-body text-ink-muted">
          Edit the public contact introduction and enquiry framing.
        </p>
      </div>
    </section>

    <CmsResourcePanel
      resource-id="page_sections"
      title="Contact sections"
      description="Edit the introductory block and support text for the Contact page."
      use-page-editor
      :query-filters="contactFilters"
      :create-defaults="contactDefaults"
    />
  </div>
</template>

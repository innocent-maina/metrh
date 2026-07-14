<script setup lang="ts">
definePageMeta({ layout: "dashboard" });

useSeoMeta({
  title: "Terms of Service — Pages & Content",
  description: "Edit the terms of service page content.",
});
</script>

<template>
  <div class="space-y-6">
    <section class="rounded-card border border-border bg-surface p-6 md:p-8 shadow-card">
      <div class="max-w-3xl">
        <p class="text-small font-semibold uppercase tracking-wide text-info">
          Legal
        </p>
        <h2 class="mt-2 font-display font-bold text-h1 text-ink">
          Terms of service
        </h2>
        <p class="mt-4 text-body text-ink-muted">
          Edit the terms of service content, SEO title, and publication status.
        </p>
      </div>
    </section>

    <CmsResourcePanel
      resource-id="pages"
      title="Terms of service page"
      description="Keep the terms of service content up to date."
      :query-filters="{ slug: 'terms-of-service' }"
      :create-defaults="{ slug: 'terms-of-service', title: 'Terms of Service' }"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "dashboard" });

useSeoMeta({
  title: "Terms of Use — Pages & Content",
  description: "Edit the terms of use page content.",
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
          Terms of use
        </h2>
        <p class="mt-4 text-body text-ink-muted">
          Edit the terms of use content, SEO title, and publication status.
        </p>
      </div>
    </section>

    <CmsResourcePanel
      resource-id="pages"
      title="Terms of use page"
      description="Keep the terms of use content up to date."
      :query-filters="{ slug: 'terms-of-use' }"
      :create-defaults="{ slug: 'terms-of-use', title: 'Terms of Use' }"
    />
  </div>
</template>

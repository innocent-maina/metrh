<script setup lang="ts">
definePageMeta({ layout: "dashboard" });

useSeoMeta({
  title: "Cookie Policy — Pages & Content",
  description: "Edit the cookie policy page content.",
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
          Cookie policy
        </h2>
        <p class="mt-4 text-body text-ink-muted">
          Edit the cookie policy content, SEO title, and publication status.
        </p>
      </div>
    </section>

    <CmsResourcePanel
      resource-id="pages"
      title="Cookie policy page"
      description="Keep the cookie policy content up to date."
      :query-filters="{ slug: 'cookie-policy' }"
      :create-defaults="{ slug: 'cookie-policy', title: 'Cookie Policy' }"
    />
  </div>
</template>

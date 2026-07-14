<script setup lang="ts">
definePageMeta({ layout: "dashboard" });

useSeoMeta({
  title: "Privacy Policy — Pages & Content",
  description: "Edit the privacy policy page content.",
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
          Privacy policy
        </h2>
        <p class="mt-4 text-body text-ink-muted">
          Edit the privacy policy content, SEO title, and publication status.
        </p>
      </div>
    </section>

    <CmsResourcePanel
      resource-id="pages"
      title="Privacy policy page"
      description="Keep the privacy policy content up to date."
      :query-filters="{ slug: 'privacy-policy' }"
      :create-defaults="{ slug: 'privacy-policy', title: 'Privacy Policy' }"
    />
  </div>
</template>

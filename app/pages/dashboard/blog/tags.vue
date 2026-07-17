<script setup lang="ts">
definePageMeta({ layout: "dashboard" });

useSeoMeta({
  title: "Blog Tags — MeTRH Dashboard",
  description: "Manage blog tags in their own CRUD table.",
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
          Blog tags
        </h2>
        <p class="mt-4 text-body text-ink-muted">
          Reuse tags across stories to keep related posts connected.
        </p>
      </div>
    </section>

    <CmsResourcePanel
      resource-id="blog_tags"
      title="Tags"
      description="Create and maintain the shared tag table for blog posts."
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "dashboard" });

useSeoMeta({
  title: "Blog Categories — MeTRH Dashboard",
  description: "Manage blog categories in their own CRUD table.",
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
          Blog categories
        </h2>
        <p class="mt-4 text-body text-ink-muted">
          Organize blog posts into editorial buckets.
        </p>
      </div>
    </section>

    <CmsResourcePanel
      resource-id="blog_categories"
      title="Categories"
      description="Create and maintain the category table used by blog posts."
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "dashboard" });

useSeoMeta({
  title: "Blog Post Tags — MeTRH Dashboard",
  description: "Manage post-to-tag links in their own CRUD table.",
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
          Post tags
        </h2>
        <p class="mt-4 text-body text-ink-muted">
          Connect blog posts to tags with a dedicated linking table.
        </p>
      </div>
    </section>

    <CmsResourcePanel
      resource-id="blog_post_tags"
      title="Post tags"
      description="Assign tags to published posts from a dedicated junction table."
    />
  </div>
</template>

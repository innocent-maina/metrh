<script setup lang="ts">
definePageMeta({ layout: "dashboard" });

useSeoMeta({
  title: "Cookie Policy — Pages & Content",
  description: "Edit the cookie policy page with a live preview.",
});
</script>

<template>
  <DashboardPageContentEditor
    slug="cookie-policy"
    title="Cookie policy"
    description="Edit the cookie policy content, metadata, and live preview."
  />
</template>

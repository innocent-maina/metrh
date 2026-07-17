<script setup lang="ts">
definePageMeta({ layout: "dashboard" });

useSeoMeta({
  title: "Terms of Service — Pages & Content",
  description: "Edit the terms of service page with a live editor and preview.",
});
</script>

<template>
  <DashboardPageContentEditor
    slug="terms-of-service"
    title="Terms of service"
    description="Edit the terms of service content, metadata, and live preview."
  />
</template>

<script setup lang="ts">
definePageMeta({ layout: "dashboard" });

useSeoMeta({
  title: "Terms of Use — Pages & Content",
  description: "Edit the terms of use page with a live preview.",
});
</script>

<template>
  <DashboardPageContentEditor
    slug="terms-of-use"
    title="Terms of use"
    description="Edit the terms of use content, metadata, and live preview."
  />
</template>

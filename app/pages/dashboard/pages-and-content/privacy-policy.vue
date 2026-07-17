<script setup lang="ts">
definePageMeta({ layout: "dashboard" });

useSeoMeta({
  title: "Privacy Policy — Pages & Content",
  description: "Edit the privacy policy page with a live preview.",
});
</script>

<template>
  <DashboardPageContentEditor
    slug="privacy-policy"
    title="Privacy policy"
    description="Edit the privacy policy content, metadata, and live preview."
  />
</template>

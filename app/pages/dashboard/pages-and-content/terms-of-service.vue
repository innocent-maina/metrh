<script setup lang="ts">
import { termsOfServicePage } from "~/content/legalPages";

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
    :fallback-page="{
      title: termsOfServicePage.title,
      content: termsOfServicePage.content,
      seo_title: termsOfServicePage.seoTitle,
      seo_description: termsOfServicePage.seoDescription,
      status: 'published',
    }"
  />
</template>

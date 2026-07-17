<script setup lang="ts">
import { cookiePolicyPage } from "~/content/legalPages";

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
    :fallback-page="{
      title: cookiePolicyPage.title,
      content: cookiePolicyPage.content,
      seo_title: cookiePolicyPage.seoTitle,
      seo_description: cookiePolicyPage.seoDescription,
      status: 'published',
    }"
  />
</template>

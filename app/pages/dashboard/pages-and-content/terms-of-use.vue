<script setup lang="ts">
import { termsOfUsePage } from "~/content/legalPages";

definePageMeta({ layout: "dashboard" });

useSeoMeta({
  title: "Terms of Use — Pages & Content",
  description: "Edit the terms of use page with a live preview.",
});
</script>

<template>
  <PageContentEditor
    slug="terms-of-use"
    title="Terms of use"
    description="Edit the terms of use content, metadata, and live preview."
    :fallback-page="{
      title: termsOfUsePage.title,
      content: termsOfUsePage.content,
      seo_title: termsOfUsePage.seoTitle,
      seo_description: termsOfUsePage.seoDescription,
      status: 'published',
    }"
  />
</template>

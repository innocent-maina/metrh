<script setup lang="ts">
import { termsOfUsePage } from "~/content/legalPages";

definePageMeta({ layout: "default" });

const { data: page } = await useCmsPage("terms-of-use", {
  id: "terms-of-use",
  slug: "terms-of-use",
  title: termsOfUsePage.title,
  content: termsOfUsePage.content,
  seo_title: termsOfUsePage.seoTitle,
  seo_description: termsOfUsePage.seoDescription,
  status: "published",
  updated_by: null,
  created_at: "",
  updated_at: "",
});
</script>

<template>
  <LegalPageBody
    :title="page?.title || termsOfUsePage.title"
    :seo-title="page?.seo_title || termsOfUsePage.seoTitle"
    :seo-description="page?.seo_description || termsOfUsePage.seoDescription"
    :content="page?.content || termsOfUsePage.content"
  />
</template>

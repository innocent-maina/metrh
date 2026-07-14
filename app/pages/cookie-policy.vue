<script setup lang="ts">
import { cookiePolicyPage } from "~/content/legalPages";

definePageMeta({ layout: "default" });

const { data: page } = await useCmsPage("cookie-policy", {
  id: "cookie-policy",
  slug: "cookie-policy",
  title: cookiePolicyPage.title,
  content: cookiePolicyPage.content,
  seo_title: cookiePolicyPage.seoTitle,
  seo_description: cookiePolicyPage.seoDescription,
  status: "published",
  updated_by: null,
  created_at: "",
  updated_at: "",
});
</script>

<template>
  <LegalPageBody
    :title="page?.title || cookiePolicyPage.title"
    :seo-title="page?.seo_title || cookiePolicyPage.seoTitle"
    :seo-description="page?.seo_description || cookiePolicyPage.seoDescription"
    :content="page?.content || cookiePolicyPage.content"
  />
</template>

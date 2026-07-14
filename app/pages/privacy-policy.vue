<script setup lang="ts">
import { privacyPolicyPage } from "~/content/legalPages";

definePageMeta({ layout: "default" });

const { data: page } = await useCmsPage("privacy-policy", {
  id: "privacy-policy",
  slug: "privacy-policy",
  title: privacyPolicyPage.title,
  content: privacyPolicyPage.content,
  seo_title: privacyPolicyPage.seoTitle,
  seo_description: privacyPolicyPage.seoDescription,
  status: "published",
  updated_by: null,
  created_at: "",
  updated_at: "",
});
</script>

<template>
  <LegalPageBody
    :title="page?.title || privacyPolicyPage.title"
    :seo-title="page?.seo_title || privacyPolicyPage.seoTitle"
    :seo-description="page?.seo_description || privacyPolicyPage.seoDescription"
    :content="page?.content || privacyPolicyPage.content"
  />
</template>

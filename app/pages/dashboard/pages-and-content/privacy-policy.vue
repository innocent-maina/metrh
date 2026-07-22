<script setup lang="ts">
import { privacyPolicyPage } from "~/content/legalPages";

definePageMeta({ layout: "dashboard" });

useSeoMeta({
  title: "Privacy Policy — Pages & Content",
  description: "Edit the privacy policy page with a live preview.",
});
</script>

<template>
  <PageContentEditor
    slug="privacy-policy"
    title="Privacy policy"
    description="Edit the privacy policy content, metadata, and live preview."
    :fallback-page="{
      title: privacyPolicyPage.title,
      content: privacyPolicyPage.content,
      seo_title: privacyPolicyPage.seoTitle,
      seo_description: privacyPolicyPage.seoDescription,
      status: 'published',
    }"
  />
</template>

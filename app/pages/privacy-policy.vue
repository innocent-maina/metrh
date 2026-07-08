<script setup lang="ts">
import { privacyPolicyPage } from "~/content/legalPages";

definePageMeta({ layout: "default" });
</script>

<template>
  <LegalPageBody
    :title="privacyPolicyPage.title"
    :seo-title="privacyPolicyPage.seoTitle"
    :seo-description="privacyPolicyPage.seoDescription"
    :content="privacyPolicyPage.content"
  />
</template>

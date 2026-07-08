<script setup lang="ts">
import { cookiePolicyPage } from "~/content/legalPages";

definePageMeta({ layout: "default" });
</script>

<template>
  <LegalPageBody
    :title="cookiePolicyPage.title"
    :seo-title="cookiePolicyPage.seoTitle"
    :seo-description="cookiePolicyPage.seoDescription"
    :content="cookiePolicyPage.content"
  />
</template>

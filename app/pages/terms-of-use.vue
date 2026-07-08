<script setup lang="ts">
import { termsOfUsePage } from "~/content/legalPages";

definePageMeta({ layout: "default" });
</script>

<template>
  <LegalPageBody
    :title="termsOfUsePage.title"
    :seo-title="termsOfUsePage.seoTitle"
    :seo-description="termsOfUsePage.seoDescription"
    :content="termsOfUsePage.content"
  />
</template>

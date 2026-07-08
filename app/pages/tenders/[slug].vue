<script setup lang="ts">
definePageMeta({ layout: "default" });

const route = useRoute();

useSeoMeta({
  title: "Tender details — MeTRH",
  description:
    "Tender detail page for Meru Teaching and Referral Hospital procurement notices.",
});

const tender = computed<null>(() => null);
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">
    <div class="mb-8">
      <NuxtLink
        to="/tenders"
        class="inline-flex items-center gap-1 text-small font-semibold text-primary hover:underline"
      >
        <Icon name="lucide:arrow-left" class="size-4" />
        Back to tenders
      </NuxtLink>
    </div>

    <div class="rounded-card border border-dashed border-border bg-white p-10 text-center shadow-card">
      <Icon name="lucide:file-question" class="mx-auto size-8 text-ink-muted" aria-hidden="true" />
      <h1 class="mt-4 font-display font-semibold text-h2 text-ink">
        Tender not found
      </h1>
      <p class="mt-3 text-body text-ink-muted">
        No public tender matches “{{ route.params.slug }}” yet. Once procurement
        publishes a notice, this route will render the detail view and attached
        documents.
      </p>
      <NuxtLink
        to="/contact"
        class="mt-6 inline-flex items-center gap-1 text-small font-semibold text-primary hover:underline"
      >
        Ask procurement
        <Icon name="lucide:arrow-right" class="size-4" />
      </NuxtLink>
    </div>
  </div>
</template>

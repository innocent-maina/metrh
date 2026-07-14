<script setup lang="ts">
const { data: homeContent } = await usePageContent("home");

const ctaSection = computed(
  () => homeContent.value?.sectionsByKey["careers-tenders"] ?? null,
);
</script>

<template>
  <section class="bg-surface" aria-label="Careers and tenders">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-16">
      <div class="grid md:grid-cols-2 gap-6">
        <div class="rounded-card border border-border bg-surface p-8">
          <span
            class="flex size-10 items-center justify-center rounded-control bg-accent/15 text-accent"
          >
            <Icon name="lucide:briefcase" class="size-5" aria-hidden="true" />
          </span>
          <h2 class="mt-4 font-display font-semibold text-h3 text-ink">
            {{ ctaSection?.title || "Careers &amp; opportunities" }}
          </h2>
          <p class="mt-2 text-small text-ink-muted">
            {{
              ctaSection?.summary ||
              "MeTRH recruits on a rolling basis — see current openings and how to apply."
            }}
          </p>
          <NuxtLink
            :to="ctaSection?.cta_href || '/careers'"
            class="mt-5 inline-flex items-center gap-1 text-small font-semibold text-primary hover:underline"
          >
            {{ ctaSection?.cta_label || "View open positions" }}
            <Icon name="lucide:arrow-right" class="size-4" />
          </NuxtLink>
        </div>

        <div class="rounded-card border border-border bg-surface p-8">
          <span
            class="flex size-10 items-center justify-center rounded-control bg-primary/10 text-primary"
          >
            <Icon name="lucide:file-text" class="size-5" aria-hidden="true" />
          </span>
          <h2 class="mt-4 font-display font-semibold text-h3 text-ink">
            Tenders
          </h2>
          <p class="mt-2 text-small text-ink-muted">
            Open tender notices, registered supplier lists, and procurement
            files for partners.
          </p>
          <NuxtLink
            to="/tenders"
            class="mt-5 inline-flex items-center gap-1 text-small font-semibold text-primary hover:underline"
          >
            View tenders
            <Icon name="lucide:arrow-right" class="size-4" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

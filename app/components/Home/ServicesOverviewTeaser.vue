<script setup lang="ts">
const { data: servicesData } = await usePublicServices();
const { data: homeContent } = await usePageContent("home");

const featuredCategories = computed(
  () => servicesData.value?.serviceGroups?.slice(0, 8) ?? [],
);

const servicesSection = computed(
  () => homeContent.value?.sectionsByKey["services-overview"] ?? null,
);
</script>

<template>
  <section class="bg-surface" aria-labelledby="services-overview-heading">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">
      <div class="flex items-end justify-between gap-4 mb-8">
        <div>
          <p class="text-small font-semibold uppercase tracking-wide text-info">
            {{ servicesSection?.eyebrow || "What we offer" }}
          </p>
          <h2
            id="services-overview-heading"
            class="mt-2 font-display font-semibold text-h2 text-ink"
          >
            {{ servicesSection?.title || "Services across every level of care" }}
          </h2>
          <p class="mt-3 max-w-2xl text-body text-ink-muted">
            {{
              servicesSection?.summary ||
              "Public, specialist, and support services grouped for quick scanning."
            }}
          </p>
        </div>
        <NuxtLink
          :to="servicesSection?.cta_href || '/services'"
          class="hidden sm:inline-flex items-center gap-1 text-small font-semibold text-primary hover:underline shrink-0"
        >
          {{ servicesSection?.cta_label || "View all services" }}
          <Icon name="lucide:arrow-right" class="size-4" />
        </NuxtLink>
      </div>

      <ul class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <li v-for="category in featuredCategories" :key="category.slug">
          <NuxtLink
            :to="`/services#${category.slug}`"
            class="flex h-full flex-col gap-3 rounded-card border border-border bg-surface p-5 hover:border-primary/40 hover:shadow-card transition-all"
          >
            <span
              class="flex size-9 items-center justify-center rounded-control bg-surface-alt text-primary"
            >
              <Icon :name="category.icon" class="size-5" aria-hidden="true" />
            </span>
            <span class="text-small font-semibold text-ink leading-snug">{{
              category.name
            }}</span>
          </NuxtLink>
        </li>
      </ul>

      <NuxtLink
        :to="servicesSection?.cta_href || '/services'"
        class="sm:hidden mt-6 inline-flex items-center gap-1 text-small font-semibold text-primary hover:underline"
      >
        {{ servicesSection?.cta_label || "View all services" }}
        <Icon name="lucide:arrow-right" class="size-4" />
      </NuxtLink>
    </div>
  </section>
</template>

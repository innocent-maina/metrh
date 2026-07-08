<script setup lang="ts">
// TODO(step 4): replace with a fetch of `service_categories` (ordered by
// display_order). Category names below match content.md §5 exactly.
const categories = [
  {
    name: "Emergency & Critical Care",
    icon: "lucide:siren",
    slug: "emergency-critical-care",
  },
  {
    name: "Outpatient & Specialized Clinics",
    icon: "lucide:clipboard-list",
    slug: "outpatient-clinics",
  },
  {
    name: "Surgery & Theatre",
    icon: "lucide:scissors",
    slug: "surgery-theatre",
  },
  {
    name: "Maternity, Newborn & Reproductive Health",
    icon: "lucide:baby",
    slug: "maternity-newborn",
  },
  { name: "Oncology / Cancer Care", icon: "lucide:ribbon", slug: "oncology" },
  {
    name: "Imaging & Diagnostics",
    icon: "lucide:scan-line",
    slug: "imaging-diagnostics",
  },
  { name: "Laboratory", icon: "lucide:flask-conical", slug: "laboratory" },
  {
    name: "Rehabilitation & Therapy",
    icon: "lucide:activity",
    slug: "rehabilitation-therapy",
  },
];
</script>

<template>
  <section class="bg-surface" aria-labelledby="services-overview-heading">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">
      <div class="flex items-end justify-between gap-4 mb-8">
        <div>
          <p class="text-small font-semibold uppercase tracking-wide text-info">
            What we offer
          </p>
          <h2
            id="services-overview-heading"
            class="mt-2 font-display font-semibold text-h2 text-ink"
          >
            Services across every level of care
          </h2>
        </div>
        <NuxtLink
          to="/services"
          class="hidden sm:inline-flex items-center gap-1 text-small font-semibold text-primary hover:underline shrink-0"
        >
          View all services
          <Icon name="lucide:arrow-right" class="size-4" />
        </NuxtLink>
      </div>

      <ul class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <li v-for="category in categories" :key="category.slug">
          <NuxtLink
            :to="`/services#${category.slug}`"
            class="flex h-full flex-col gap-3 rounded-card border border-border bg-white p-5 hover:border-primary/40 hover:shadow-card transition-all"
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
        to="/services"
        class="sm:hidden mt-6 inline-flex items-center gap-1 text-small font-semibold text-primary hover:underline"
      >
        View all services
        <Icon name="lucide:arrow-right" class="size-4" />
      </NuxtLink>
    </div>
  </section>
</template>

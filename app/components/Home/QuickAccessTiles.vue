<script setup lang="ts">
const tiles = [
  {
    label: "Find a Service",
    icon: "lucide:stethoscope",
    to: "/services",
    accent: false,
  },
  {
    label: "Clinic Schedule",
    icon: "lucide:calendar-days",
    to: "/services#clinic-schedule",
    accent: false,
  },
  { label: "Emergency", icon: "lucide:siren", to: "/contact", accent: true },
  { label: "Careers", icon: "lucide:briefcase", to: "/careers", accent: false },
  { label: "Tenders", icon: "lucide:file-text", to: "/tenders", accent: false },
];
</script>

<template>
  <section class="bg-surface" aria-label="Quick access">
    <div
      class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-8 md:-mt-10 relative z-10"
    >
      <ul class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <li v-for="tile in tiles" :key="tile.to">
          <NuxtLink
            :to="tile.to"
            class="flex flex-col items-center gap-2 rounded-card border border-border bg-white p-4 md:p-5 text-center shadow-card hover:shadow-elevated hover:-translate-y-0.5 transition-all"
          >
            <span
              class="flex size-10 items-center justify-center rounded-full"
              :class="
                tile.accent
                  ? 'bg-accent/15 text-accent'
                  : 'bg-surface-alt text-primary'
              "
            >
              <Icon :name="tile.icon" class="size-5" aria-hidden="true" />
            </span>
            <span class="text-small font-semibold text-ink">{{
              tile.label
            }}</span>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </section>
</template>

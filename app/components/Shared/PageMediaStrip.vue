<script setup lang="ts">
import type { HospitalMediaItem } from "~/composables/useHospitalMedia";

withDefaults(
  defineProps<{
    items: HospitalMediaItem[];
    title?: string;
    subtitle?: string;
    compact?: boolean;
  }>(),
  {
    compact: false,
  },
);
</script>

<template>
  <section class="border-y border-border bg-surface">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 md:py-6">
      <div v-if="title || subtitle" class="mb-4 flex flex-col gap-1">
        <p
          v-if="title"
          class="text-small font-semibold uppercase tracking-wide text-info"
        >
          {{ title }}
        </p>
        <p v-if="subtitle" class="text-caption text-ink-muted">
          {{ subtitle }}
        </p>
      </div>

      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <figure
          v-for="item in items"
          :key="item.src"
          class="group relative overflow-hidden rounded-card border border-border bg-white shadow-card"
          :class="compact ? 'aspect-[16/11]' : 'aspect-[4/3]'"
        >
          <img
            :src="item.src"
            :alt="item.alt"
            class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
          <div
            class="absolute inset-0 bg-gradient-to-t from-primary-dark/80 via-primary-dark/10 to-transparent"
          />
          <figcaption class="absolute inset-x-0 bottom-0 p-3">
            <p
              class="text-caption font-semibold uppercase tracking-wide text-accent"
            >
              {{ item.eyebrow }}
            </p>
            <p
              class="mt-1 text-small font-semibold text-white"
              :class="compact ? 'max-w-[10rem]' : 'max-w-[12rem]'"
            >
              {{ item.caption }}
            </p>
          </figcaption>
        </figure>
      </div>
    </div>
  </section>
</template>

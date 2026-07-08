<script setup lang="ts">
interface Stat {
  value: string;
  label: string;
}

defineProps<{
  stats: Stat[];
  title?: string;
  note?: string;
}>();
</script>

<template>
  <section class="bg-surface-alt border-y border-border">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <h2
        v-if="title"
        class="font-display font-semibold text-h2 text-ink text-center mb-10"
      >
        {{ title }}
      </h2>
      <dl class="grid grid-cols-2 md:grid-cols-4 gap-8">
        <div v-for="stat in stats" :key="stat.label" class="text-center">
          <dd class="tabular-nums text-h1 text-primary">{{ stat.value }}</dd>
          <dt class="mt-1 text-small text-ink-muted">{{ stat.label }}</dt>
        </div>
      </dl>
      <p v-if="note" class="mt-8 text-center text-caption text-ink-muted">
        {{ note }}
      </p>
    </div>
  </section>
</template>

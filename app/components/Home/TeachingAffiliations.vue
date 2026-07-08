<script setup lang="ts">
const affiliations = [
  "Kenya Methodist University (KeMU)",
  "Meru University of Science and Technology",
  "Kenya Medical Training College (KMTC)",
];
</script>

<template>
  <section class="bg-surface-alt" aria-labelledby="teaching-heading">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-16">
      <div class="grid md:grid-cols-2 gap-10 items-center">
        <div>
          <p class="text-small font-semibold uppercase tracking-wide text-info">
            Teaching &amp; research
          </p>
          <h2
            id="teaching-heading"
            class="mt-2 font-display font-semibold text-h2 text-ink"
          >
            A teaching hospital, not just a treating one
          </h2>
          <p class="mt-3 text-body text-ink-muted">
            MeTRH is the teaching hospital for three institutions and an
            internship centre for Ministry of Health interns, clinical officers,
            nurses, and nutritionists — with research activity conducted
            on-site, including published studies on antimicrobial resistance.
          </p>
        </div>
        <ul class="grid gap-4">
          <li
            v-for="name in affiliations"
            :key="name"
            class="flex items-center gap-3 rounded-card border border-border bg-white p-4"
          >
            <span
              class="flex size-9 items-center justify-center rounded-control bg-primary/10 text-primary shrink-0"
            >
              <Icon
                name="lucide:graduation-cap"
                class="size-5"
                aria-hidden="true"
              />
            </span>
            <span class="text-small font-semibold text-ink">{{ name }}</span>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const projects = [
  {
    title: "Dedicated Cancer Centre",
    status: "Public-Private Partnership · Under development",
    detail:
      "A 50-bed facility with anatomic pathology and medical imaging capacity, offering chemotherapy, radiotherapy, and surgery as treatment options. Registered with Kenya's PPP Directorate.",
    icon: "lucide:building-2",
  },
  {
    title: "New 250-bed ward block",
    status: "Under construction",
    detail:
      "Additional inpatient capacity as MeTRH's daily inpatient load regularly exceeds current bed capacity.",
    icon: "lucide:hammer",
  },
  {
    title: "Level 6 transition",
    status: "In progress",
    detail:
      "Hospital-wide departmental changes as MeTRH becomes a fully-fledged specialized referral hospital, expected to improve patient care levels and specialized service delivery.",
    icon: "lucide:trending-up",
  },
];
</script>

<template>
  <section
    id="growth"
    class="bg-surface-alt scroll-mt-24"
    aria-labelledby="growth-heading"
  >
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">
      <p class="text-small font-semibold uppercase tracking-wide text-info">
        Growth &amp; development
      </p>
      <h2
        id="growth-heading"
        class="mt-2 font-display font-semibold text-h2 text-ink max-w-2xl"
      >
        Built for where MeTRH is headed, not just where it is
      </h2>

      <ul class="mt-10 grid md:grid-cols-3 gap-6">
        <li
          v-for="project in projects"
          :key="project.title"
          class="rounded-card bg-white border border-border p-6"
        >
          <span
            class="flex size-10 items-center justify-center rounded-control bg-primary/10 text-primary"
          >
            <Icon :name="project.icon" class="size-5" aria-hidden="true" />
          </span>
          <h3 class="mt-4 font-display font-semibold text-h4 text-ink">
            {{ project.title }}
          </h3>
          <p
            class="mt-1 text-caption font-semibold text-accent uppercase tracking-wide"
          >
            {{ project.status }}
          </p>
          <p class="mt-2 text-small text-ink-muted">{{ project.detail }}</p>
        </li>
      </ul>
    </div>
  </section>
</template>

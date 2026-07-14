<script setup lang="ts">
const { data: aboutContent } = await usePageContent("about");

const defaultProjects = [
  {
    title: "Dedicated Cancer Centre",
    description:
      "A 50-bed facility with anatomic pathology and medical imaging capacity, offering chemotherapy, radiotherapy, and surgery as treatment options.",
    icon: "lucide:building-2",
  },
  {
    title: "New 250-bed ward block",
    description:
      "Additional inpatient capacity as MeTRH's daily inpatient load regularly exceeds current bed capacity.",
    icon: "lucide:hammer",
  },
  {
    title: "Level 6 transition",
    description:
      "Hospital-wide departmental changes as MeTRH becomes a fully-fledged specialized referral hospital.",
    icon: "lucide:trending-up",
  },
];

const growthSection = computed(
  () => aboutContent.value?.sectionsByKey["growth-development"] ?? null,
);

const projects = computed(
  () => {
    const rows =
      aboutContent.value?.itemsBySectionId[growthSection.value?.id ?? ""] ?? [];
    return rows.length > 0 ? rows : defaultProjects;
  },
);
</script>

<template>
  <section
    id="growth"
    class="bg-surface-alt scroll-mt-24"
    aria-labelledby="growth-heading"
  >
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">
      <p class="text-small font-semibold uppercase tracking-wide text-info">
        {{ growthSection?.eyebrow || "Growth &amp; development" }}
      </p>
      <h2
        id="growth-heading"
        class="mt-2 font-display font-semibold text-h2 text-ink max-w-2xl"
      >
        {{ growthSection?.title || "Built for where MeTRH is headed, not just where it is" }}
      </h2>
      <p class="mt-3 max-w-2xl text-body text-ink-muted">
        {{
          growthSection?.summary ||
          "Current projects that show where the hospital is heading next."
        }}
      </p>

      <ul class="mt-10 grid md:grid-cols-3 gap-6">
        <li
          v-for="project in projects"
          :key="project.title"
          class="rounded-card bg-surface border border-border p-6"
        >
          <span
            class="flex size-10 items-center justify-center rounded-control bg-primary/10 text-primary"
          >
            <Icon :name="project.icon || 'lucide:building-2'" class="size-5" aria-hidden="true" />
          </span>
          <h3 class="mt-4 font-display font-semibold text-h4 text-ink">
            {{ project.title }}
          </h3>
          <p class="mt-2 text-small text-ink-muted">
            {{ project.description || "" }}
          </p>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
const { data: aboutContent } = await usePageContent("about");

const defaultValues = [
  "Leadership & Integrity",
  "Compassion",
  "Professionalism & Excellence",
  "Creativity",
  "Teamwork & Team Spirit",
  "Responsiveness",
];

const defaultGoals = [
  "Meet the Highest Standard of Health Care",
  "Develop a Culture of Excellence",
  "Resource Sustainability",
  "Enhance Institutional Capacity",
  "Strategic Partnership",
  "Strengthening Information Management, Research, Innovation and Development",
];

const introSection = computed(
  () => aboutContent.value?.sectionsByKey["vision-mission"] ?? null,
);

const valuesSection = computed(
  () => aboutContent.value?.sectionsByKey["mission-values"] ?? null,
);

const goalsSection = computed(
  () => aboutContent.value?.sectionsByKey["strategic-goals"] ?? null,
);

const values = computed(
  () => {
    const rows =
      aboutContent.value?.itemsBySectionId[valuesSection.value?.id ?? ""] ?? [];
    return rows.length > 0 ? rows : defaultValues.map((title) => ({ title }));
  },
);

const goals = computed(
  () => {
    const rows =
      aboutContent.value?.itemsBySectionId[goalsSection.value?.id ?? ""] ?? [];
    return rows.length > 0 ? rows : defaultGoals.map((title) => ({ title }));
  },
);
</script>

<template>
  <section class="bg-surface" aria-labelledby="mission-heading">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">
      <div
        v-if="introSection?.body"
        class="mb-14 rounded-card border border-border bg-surface-alt p-6 md:p-8"
      >
        <p class="text-small font-semibold uppercase tracking-wide text-info">
          {{ introSection?.eyebrow || "Vision and mission" }}
        </p>
        <div
          class="mt-3 space-y-4 text-body text-ink"
          v-html="introSection.body"
        />
      </div>
      <div v-else class="grid md:grid-cols-2 gap-10 mb-14">
        <div>
          <p class="text-small font-semibold uppercase tracking-wide text-info">
            Vision
          </p>
          <p class="mt-2 font-display font-semibold text-h3 text-ink">
            A specialized referral hospital committed to excellence in
            innovative health care and training.
          </p>
        </div>
        <div>
          <p class="text-small font-semibold uppercase tracking-wide text-info">
            Mission
          </p>
          <p class="mt-2 text-body text-ink">
            To provide client-centered, innovative, specialized and affordable
            health care; facilitate training and research; and participate in
            county, national and global healthcare policy formulation.
          </p>
        </div>
      </div>

      <div class="grid lg:grid-cols-2 gap-10">
        <div>
          <h2
            id="mission-heading"
            class="font-display font-semibold text-h3 text-ink mb-4"
          >
            {{ valuesSection?.title || "Core Values" }}
          </h2>
          <ul class="grid sm:grid-cols-2 gap-3">
            <li
              v-for="value in values"
              :key="value.title"
              class="flex items-center gap-2.5 rounded-control border border-border bg-surface-alt px-3.5 py-2.5 text-small font-medium text-ink"
            >
              <Icon
                name="lucide:check-circle-2"
                class="size-4 text-primary shrink-0"
                aria-hidden="true"
              />
              {{ value.title }}
            </li>
          </ul>
        </div>

        <div>
          <h2 class="font-display font-semibold text-h3 text-ink mb-4">
            {{ goalsSection?.title || "Strategic Goals" }}
          </h2>
          <ol class="space-y-3">
            <li
              v-for="(goal, index) in goals"
              :key="goal.title"
              class="flex gap-3 text-small text-ink"
            >
              <span class="tabular-nums text-primary font-semibold shrink-0">{{
                String(index + 1).padStart(2, "0")
              }}</span>
              <span>{{ goal.title }}</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  </section>
</template>

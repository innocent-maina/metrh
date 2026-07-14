<script setup lang="ts">
const { data: homeContent } = await usePageContent("home");

const impactSection = computed(
  () => homeContent.value?.sectionsByKey["community-impact"] ?? null,
);

const items = computed(
  () =>
    homeContent.value?.itemsBySectionId[impactSection.value?.id ?? ""] ?? [],
);

const stories = [
  {
    title: "Arsenal Kenya Supporters' Club blood drive",
    detail:
      "Over 300 units collected in Meru town, timed around an Arsenal match — organized by AKSC in partnership with local health experts.",
    icon: "lucide:heart-handshake",
  },
  {
    title: "Manchester United Fans Kenya (Meru)",
    detail:
      "Around 100 fans donated blood at MeTRH in an organized club drive, covered by Nation Media and K24.",
    icon: "lucide:droplets",
  },
  {
    title: "County-led mass donation drives",
    detail:
      "Meru County Government and Kenya Red Cross have run mass blood donation drives, with real lives saved through transfusion at MeTRH documented by the County.",
    icon: "lucide:users",
  },
];

const impactStories = computed(() =>
  items.value.length > 0
    ? items.value.map((item, index) => ({
        title: item.title,
        detail: item.description || "",
        icon: item.icon || ["lucide:heart-handshake", "lucide:droplets", "lucide:users"][index] || "lucide:heart-handshake",
      }))
    : stories,
);
</script>

<template>
  <section
    class="bg-primary-dark text-white"
    aria-labelledby="community-impact-heading"
  >
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">
      <div class="max-w-2xl">
        <p class="text-small font-semibold uppercase tracking-wide text-accent">
          {{ impactSection?.eyebrow || "Community impact" }}
        </p>
        <h2
          id="community-impact-heading"
          class="mt-2 font-display font-semibold text-h2"
        >
          {{ impactSection?.title || "Blood donated here saves lives here" }}
        </h2>
        <p class="mt-3 text-body text-white/80">
          {{
            impactSection?.summary ||
            "Donated blood is critical for cancer patients, children with severe anaemia, and mothers during childbirth — demand rises during the rainy season with more road accidents on the Meru–Nanyuki highway."
          }}
        </p>
      </div>

      <ul class="mt-10 grid md:grid-cols-3 gap-6">
        <li
          v-for="story in impactStories"
          :key="story.title"
          class="rounded-card bg-surface/5 border border-surface/10 p-6"
        >
          <span
            class="flex size-9 items-center justify-center rounded-full bg-accent/20 text-accent"
          >
            <Icon :name="story.icon" class="size-5" aria-hidden="true" />
          </span>
          <h3 class="mt-4 font-display font-semibold text-h4">
            {{ story.title }}
          </h3>
          <p class="mt-2 text-small text-white/75">{{ story.detail }}</p>
        </li>
      </ul>
    </div>
  </section>
</template>

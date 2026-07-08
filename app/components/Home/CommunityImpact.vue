<script setup lang="ts">
// TODO(step 6): once `media_albums` has real blood-drive photo albums,
// pull the cover image + link through to /events/[slug] instead of the
// static entries below. Facts are from content.md §11 — real events,
// not invented; photos/exact quotes still need manual pull from Facebook
// per the build note in that section.
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
</script>

<template>
  <section
    class="bg-primary-dark text-white"
    aria-labelledby="community-impact-heading"
  >
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">
      <div class="max-w-2xl">
        <p class="text-small font-semibold uppercase tracking-wide text-accent">
          Community impact
        </p>
        <h2
          id="community-impact-heading"
          class="mt-2 font-display font-semibold text-h2"
        >
          Blood donated here saves lives here
        </h2>
        <p class="mt-3 text-body text-white/80">
          Donated blood is critical for cancer patients, children with severe
          anaemia, and mothers during childbirth — demand rises during the rainy
          season with more road accidents on the Meru–Nanyuki highway.
        </p>
      </div>

      <ul class="mt-10 grid md:grid-cols-3 gap-6">
        <li
          v-for="story in stories"
          :key="story.title"
          class="rounded-card bg-white/5 border border-white/10 p-6"
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

      <NuxtLink
        to="/events"
        class="mt-8 inline-flex items-center gap-1 text-small font-semibold text-accent hover:underline"
      >
        See events & media
        <Icon name="lucide:arrow-right" class="size-4" />
      </NuxtLink>
    </div>
  </section>
</template>

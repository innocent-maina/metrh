<script setup lang="ts">
definePageMeta({ layout: "default" });

const route = useRoute();
const { eventAlbums } = useMetrhContent();

const album = computed(() =>
  eventAlbums.find((entry) => entry.slug === route.params.slug),
);

if (!album.value) {
  throw createError({ statusCode: 404, statusMessage: "Album not found." });
}

useSeoMeta({
  title: () => `${album.value?.title} — MeTRH`,
  description: () => album.value?.summary,
});

const relatedAlbums = computed(() =>
  eventAlbums.filter((entry) => entry.slug !== route.params.slug),
);
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">
    <div class="mb-8">
      <NuxtLink
        to="/events"
        class="inline-flex items-center gap-1 text-small font-semibold text-primary hover:underline"
      >
        <Icon name="lucide:arrow-left" class="size-4" />
        Back to events
      </NuxtLink>
    </div>

    <div v-if="album" class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
      <article class="rounded-card border border-border bg-white p-6 md:p-8 shadow-card">
        <p class="text-caption font-semibold uppercase tracking-wide text-accent">
          {{ album.category }}
        </p>
        <h1 class="mt-2 font-display font-bold text-h1 text-ink">
          {{ album.title }}
        </h1>
        <p class="mt-2 text-caption text-ink-muted">
          {{ album.yearLabel }}
        </p>
        <p class="mt-5 text-body text-ink-muted">
          {{ album.summary }}
        </p>

        <div class="mt-8 grid gap-4 sm:grid-cols-3">
          <div
            v-for="highlight in album.highlights"
            :key="highlight"
            class="rounded-card bg-surface-alt p-4 text-small text-ink"
          >
            {{ highlight }}
          </div>
        </div>

        <div class="mt-8 rounded-card border border-dashed border-border bg-surface-alt p-6 text-body text-ink-muted">
          Album photos and video clips are managed from the dashboard and can be
          published here once uploaded.
        </div>
      </article>

      <aside class="space-y-4">
        <div class="rounded-card border border-border bg-white p-5">
          <p class="text-small font-semibold uppercase tracking-wide text-info">
            Related albums
          </p>
          <ul class="mt-4 space-y-3">
            <li v-for="item in relatedAlbums" :key="item.slug">
              <NuxtLink :to="`/events/${item.slug}`" class="block rounded-control border border-border px-3 py-2.5 hover:border-primary/30 hover:bg-surface-alt">
                <p class="text-caption font-semibold uppercase tracking-wide text-ink-muted">
                  {{ item.category }}
                </p>
                <p class="mt-1 text-small font-medium text-ink">
                  {{ item.title }}
                </p>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  </div>
</template>

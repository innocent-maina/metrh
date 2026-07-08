<script setup lang="ts">
definePageMeta({ layout: "default" });

const { eventAlbums } = useMetrhContent();

useSeoMeta({
  title: "Events & Media — MeTRH",
  description:
    "Browse MeTRH event albums and community media from blood drives, milestones, and health outreach activities.",
});

const search = ref("");
const activeCategory = ref("all");

const categories = computed(() => [
  { slug: "all", name: "All events" },
  ...Array.from(new Set(eventAlbums.map((album) => album.category))).map(
    (category) => ({
      slug: category.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name: category,
    }),
  ),
]);

function slugify(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const filteredAlbums = computed(() => {
  const term = search.value.trim().toLowerCase();

  return eventAlbums.filter((album) => {
    const categoryMatch =
      activeCategory.value === "all" || slugify(album.category) === activeCategory.value;
    if (!categoryMatch) return false;
    if (!term) return true;
    return (
      album.title.toLowerCase().includes(term) ||
      album.summary.toLowerCase().includes(term) ||
      album.highlights.some((highlight) => highlight.toLowerCase().includes(term))
    );
  });
});

const eventsImages = useHospitalMedia();
</script>

<template>
  <div>
    <section class="bg-surface">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div class="max-w-3xl">
          <p class="text-small font-semibold uppercase tracking-wide text-info">
            Events &amp; media
          </p>
          <h1 class="mt-2 font-display font-bold text-h1 text-ink">
            Community action and hospital milestones
          </h1>
          <p class="mt-4 text-body text-ink-muted">
            Blood drives, outreach campaigns, and milestone stories belong here.
            Albums can later hold photos and videos from the dashboard.
          </p>
        </div>
      </div>
    </section>

    <PageMediaStrip
      :items="eventsImages"
      title="Events and media"
      subtitle="Blood drives and community activity shown between the overview and the archive."
      compact
    />

    <section class="border-y border-border bg-surface-alt">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside class="rounded-card border border-border bg-white p-5 lg:sticky lg:top-24 lg:self-start">
            <label for="events-search" class="block text-small font-medium text-ink">
              Search albums
            </label>
            <div class="mt-2 flex items-center gap-2 rounded-control border border-border bg-surface px-3 py-2.5">
              <Icon name="lucide:search" class="size-4 text-ink-muted" aria-hidden="true" />
              <input
                id="events-search"
                v-model="search"
                type="search"
                placeholder="Title or highlight"
                class="w-full bg-transparent text-small text-ink outline-none placeholder:text-ink-muted"
              />
            </div>

            <div class="mt-6">
              <p class="text-small font-semibold text-ink">Filter by category</p>
              <div class="mt-3 space-y-2">
                <button
                  v-for="category in categories"
                  :key="category.slug"
                  type="button"
                  class="w-full rounded-control border px-3 py-2 text-left text-small transition-colors"
                  :class="
                    activeCategory === category.slug
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-white text-ink hover:border-primary/30 hover:bg-surface-alt'
                  "
                  @click="activeCategory = category.slug"
                >
                  {{ category.name }}
                </button>
              </div>
            </div>
          </aside>

          <div>
            <div class="mb-6 rounded-card border border-border bg-white p-5">
              <p class="text-small font-semibold uppercase tracking-wide text-info">
                {{ filteredAlbums.length }} albums
              </p>
              <p class="mt-1 text-small text-ink-muted">
                These entries are the public-facing record for community and
                outreach activity.
              </p>
            </div>

            <div v-if="filteredAlbums.length === 0" class="rounded-card border border-dashed border-border bg-white p-10 text-center">
              <Icon name="lucide:image-off" class="mx-auto size-6 text-ink-muted" aria-hidden="true" />
              <p class="mt-3 text-small text-ink-muted">
                No event albums match that filter.
              </p>
            </div>

            <ul v-else class="grid gap-5 md:grid-cols-2">
              <li
                v-for="album in filteredAlbums"
                :key="album.slug"
                class="rounded-card border border-border bg-white p-5 shadow-card"
              >
                <p class="text-caption font-semibold uppercase tracking-wide text-accent">
                  {{ album.category }}
                </p>
                <h2 class="mt-2 font-display font-semibold text-h3 text-ink">
                  {{ album.title }}
                </h2>
                <p class="mt-1 text-caption text-ink-muted">
                  {{ album.yearLabel }}
                </p>
                <p class="mt-3 text-small text-ink-muted">
                  {{ album.summary }}
                </p>
                <ul class="mt-4 flex flex-wrap gap-2">
                  <li
                    v-for="highlight in album.highlights"
                    :key="highlight"
                    class="rounded-full bg-surface-alt px-3 py-1.5 text-caption text-ink-muted"
                  >
                    {{ highlight }}
                  </li>
                </ul>
                <NuxtLink
                  :to="`/events/${album.slug}`"
                  class="mt-5 inline-flex items-center gap-1 text-small font-semibold text-primary hover:underline"
                >
                  View album
                  <Icon name="lucide:arrow-right" class="size-4" />
                </NuxtLink>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

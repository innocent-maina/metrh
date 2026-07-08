<script setup lang="ts">
definePageMeta({ layout: "default" });

const { milestoneStories } = useMetrhContent();

useSeoMeta({
  title: "Blog & News — MeTRH",
  description:
    "Read MeTRH milestones, service updates, and community impact stories from Meru Teaching and Referral Hospital.",
});

const search = ref("");
const activeCategory = ref("all");

const categories = computed(() => [
  { slug: "all", name: "All stories" },
  ...Array.from(new Set(milestoneStories.map((story) => story.category))).map(
    (category) => ({
      slug: slugify(category),
      name: category,
    }),
  ),
]);

function slugify(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const filteredStories = computed(() => {
  const term = search.value.trim().toLowerCase();

  return milestoneStories.filter((story) => {
    const categoryMatch =
      activeCategory.value === "all" || slugify(story.category) === activeCategory.value;
    if (!categoryMatch) return false;
    if (!term) return true;
    return (
      story.title.toLowerCase().includes(term) ||
      story.summary.toLowerCase().includes(term) ||
      story.body.toLowerCase().includes(term)
    );
  });
});
</script>

<template>
  <div>
    <section class="bg-surface">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div class="max-w-3xl">
          <p class="text-small font-semibold uppercase tracking-wide text-info">
            Blog &amp; news
          </p>
          <h1 class="mt-2 font-display font-bold text-h1 text-ink">
            Milestones, community impact, and service updates
          </h1>
          <p class="mt-4 text-body text-ink-muted">
            MeTRH uses this space for stories that matter to patients,
            families, referrers, and the wider Meru community.
          </p>
        </div>
      </div>
    </section>

    <section class="border-y border-border bg-surface-alt">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside class="rounded-card border border-border bg-white p-5 lg:sticky lg:top-24 lg:self-start">
            <label for="blog-search" class="block text-small font-medium text-ink">
              Search stories
            </label>
            <div class="mt-2 flex items-center gap-2 rounded-control border border-border bg-surface px-3 py-2.5">
              <Icon name="lucide:search" class="size-4 text-ink-muted" aria-hidden="true" />
              <input
                id="blog-search"
                v-model="search"
                type="search"
                placeholder="Title, summary, or body"
                class="w-full bg-transparent text-small text-ink outline-none placeholder:text-ink-muted"
              />
            </div>

            <div class="mt-6">
              <p class="text-small font-semibold text-ink">Filter by topic</p>
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
                {{ filteredStories.length }} published stories
              </p>
              <p class="mt-1 text-small text-ink-muted">
                Most items here are milestone stories and community impact notes
                from the hospital's public record.
              </p>
            </div>

            <div v-if="filteredStories.length === 0" class="rounded-card border border-dashed border-border bg-white p-10 text-center">
              <Icon name="lucide:file-search" class="mx-auto size-6 text-ink-muted" aria-hidden="true" />
              <p class="mt-3 text-small text-ink-muted">
                No stories match that filter.
              </p>
            </div>

            <ul v-else class="grid gap-5 md:grid-cols-2">
              <li
                v-for="story in filteredStories"
                :key="story.slug"
                class="rounded-card border border-border bg-white p-5 shadow-card"
              >
                <p class="text-caption font-semibold uppercase tracking-wide text-accent">
                  {{ story.category }}
                </p>
                <h2 class="mt-2 font-display font-semibold text-h3 text-ink">
                  {{ story.title }}
                </h2>
                <p class="mt-1 text-caption text-ink-muted">
                  {{ story.yearLabel }}
                </p>
                <p class="mt-3 text-small text-ink-muted">
                  {{ story.summary }}
                </p>
                <NuxtLink
                  :to="`/blog/${story.slug}`"
                  class="mt-5 inline-flex items-center gap-1 text-small font-semibold text-primary hover:underline"
                >
                  Read story
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

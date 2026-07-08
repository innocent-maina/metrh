<script setup lang="ts">
definePageMeta({ layout: "default" });

const route = useRoute();
const { milestoneStories } = useMetrhContent();

const story = computed(() =>
  milestoneStories.find((entry) => entry.slug === route.params.slug),
);

if (!story.value) {
  throw createError({ statusCode: 404, statusMessage: "Story not found." });
}

useSeoMeta({
  title: () => `${story.value?.title} — MeTRH`,
  description: () => story.value?.summary,
});

const relatedStories = computed(() =>
  milestoneStories.filter((entry) => entry.slug !== route.params.slug),
);
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">
    <div class="mb-8">
      <NuxtLink
        to="/blog"
        class="inline-flex items-center gap-1 text-small font-semibold text-primary hover:underline"
      >
        <Icon name="lucide:arrow-left" class="size-4" />
        Back to blog
      </NuxtLink>
    </div>

    <div v-if="story" class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
      <article class="rounded-card border border-border bg-white p-6 md:p-8 shadow-card">
        <p class="text-caption font-semibold uppercase tracking-wide text-accent">
          {{ story.category }}
        </p>
        <h1 class="mt-2 font-display font-bold text-h1 text-ink">
          {{ story.title }}
        </h1>
        <p class="mt-2 text-caption text-ink-muted">
          {{ story.yearLabel }}
        </p>
        <p class="mt-5 text-body text-ink-muted">
          {{ story.summary }}
        </p>
        <div class="mt-8 rounded-card bg-surface-alt p-5 text-body text-ink">
          {{ story.body }}
        </div>
      </article>

      <aside class="space-y-4">
        <div class="rounded-card border border-border bg-white p-5">
          <p class="text-small font-semibold uppercase tracking-wide text-info">
            Related stories
          </p>
          <ul class="mt-4 space-y-3">
            <li v-for="item in relatedStories" :key="item.slug">
              <NuxtLink :to="`/blog/${item.slug}`" class="block rounded-control border border-border px-3 py-2.5 hover:border-primary/30 hover:bg-surface-alt">
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

        <div class="rounded-card border border-border bg-primary-dark p-5 text-white">
          <p class="text-small font-semibold uppercase tracking-wide text-accent">
            Have a story idea?
          </p>
          <p class="mt-3 text-small text-white/80">
            Use the dashboard to publish milestones, service notices, and
            community updates.
          </p>
        </div>
      </aside>
    </div>
  </div>
</template>

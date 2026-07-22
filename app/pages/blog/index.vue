<script setup lang="ts">
import { richTextToPlainText } from "~~/shared/rich-text";

definePageMeta({ layout: "default" });

const { milestoneStories } = useMetrhContent();
const { data: blogContent } = await usePageContent("blog");
const resolveMediaUrl = usePublicStorageUrl();

type BlogCategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

type BlogPostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  category_id: string | null;
  published_at: string | null;
  reading_minutes: number | null;
  view_count: number;
  created_at: string;
  updated_at: string;
};

useSeoMeta({
  title: "Blog & News — MeTRH",
  description:
    "Read MeTRH milestones, service updates, and community impact stories from Meru Teaching and Referral Hospital.",
});

const search = ref("");
const activeCategory = ref("all");

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatDateLabel(value: string | null | undefined) {
  if (!value) return "Unpublished";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function summarize(text: string | null | undefined, fallback = "") {
  const source = richTextToPlainText(text ?? fallback).trim();
  if (!source) return "";

  const collapsed = source.replace(/\s+/g, " ");
  return collapsed.length > 180
    ? `${collapsed.slice(0, 177).trimEnd()}...`
    : collapsed;
}

function resolveBlogImageUrl(value: string | null | undefined) {
  return resolveMediaUrl(value, "media");
}

const { data: blogIndex } = await useAsyncData("public-blog-index", async () => {
  try {
    const response = await $fetch<{
      categories: BlogCategoryRow[];
      posts: BlogPostRow[];
    }>("/api/public/blog");

    const categoriesRows = response.categories ?? [];
    const postRows = response.posts ?? [];

    const categories = categoriesRows.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
    }));

    const categoriesById = new Map(categories.map((category) => [category.id, category]));
    const posts = postRows.map((post) => {
      const category = post.category_id ? categoriesById.get(post.category_id) : null;
      return {
        id: post.id,
        slug: post.slug,
        title: post.title,
        summary: summarize(post.excerpt, post.content),
        bodyText: richTextToPlainText(post.content),
        coverImageUrl: resolveBlogImageUrl(post.cover_image_url),
        category: category?.name ?? "Uncategorized",
        categorySlug: category?.slug ?? slugify(category?.name ?? "Uncategorized"),
        yearLabel: formatDateLabel(post.published_at ?? post.created_at),
        publishedAt: post.published_at,
        readingMinutes: post.reading_minutes,
        viewCount: post.view_count,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
      };
    });

    return { categories, posts };
  } catch (error) {
    console.warn("[blog] Falling back to seeded stories.", error);
    return {
      categories: Array.from(
        new Map(
          milestoneStories.map((story) => [
            slugify(story.category),
            { slug: slugify(story.category), name: story.category },
          ]),
        ).values(),
      ),
      posts: milestoneStories.map((story) => ({
        id: story.slug,
        slug: story.slug,
        title: story.title,
        summary: story.summary,
        body: story.body,
        bodyText: story.body,
        coverImageUrl: "",
        category: story.category,
        categorySlug: slugify(story.category),
        yearLabel: story.yearLabel,
        publishedAt: null,
        readingMinutes: null,
        viewCount: 0,
        createdAt: "",
        updatedAt: "",
      })),
    };
  }
});

const categories = computed(() => [
  { slug: "all", name: "All stories" },
  ...(blogIndex.value?.categories ?? []).map((category) => ({
    slug: category.slug,
    name: category.name,
  })),
]);

const filteredStories = computed(() => {
  const term = search.value.trim().toLowerCase();
  const stories = blogIndex.value?.posts ?? [];

  return stories.filter((story) => {
    const categoryMatch =
      activeCategory.value === "all" || story.categorySlug === activeCategory.value;
    if (!categoryMatch) return false;
    if (!term) return true;
    return (
      story.title.toLowerCase().includes(term) ||
      story.summary.toLowerCase().includes(term) ||
      story.bodyText.toLowerCase().includes(term)
    );
  });
});

const blogIntro = computed(
  () => blogContent.value?.sectionsByKey["blog-intro"] ?? null,
);
</script>

<template>
  <div>
    <section class="bg-surface">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div class="max-w-3xl">
          <p class="text-small font-semibold uppercase tracking-wide text-info">
            {{ blogIntro?.eyebrow || "Blog &amp; news" }}
          </p>
          <h1 class="mt-2 font-display font-bold text-h1 text-ink">
            {{
              blogIntro?.title ||
              "Milestones, community impact, and service updates"
            }}
          </h1>
          <p class="mt-4 text-body text-ink-muted">
            {{
              blogIntro?.summary ||
              "MeTRH uses this space for stories that matter to patients, families, referrers, and the wider Meru community."
            }}
          </p>
        </div>
      </div>
    </section>

    <section class="border-y border-border bg-surface-alt">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside class="rounded-card border border-border bg-surface p-5 lg:sticky lg:top-24 lg:self-start">
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
                      : 'border-border bg-surface text-ink hover:border-primary/30 hover:bg-surface-alt'
                  "
                  @click="activeCategory = category.slug"
                >
                  {{ category.name }}
                </button>
              </div>
            </div>
          </aside>

          <div>
            <div class="mb-6 rounded-card border border-border bg-surface p-5">
              <p class="text-small font-semibold uppercase tracking-wide text-info">
                {{ filteredStories.length }} published stories
              </p>
              <p class="mt-1 text-small text-ink-muted">
                Most items here are milestone stories and community impact notes
                from the hospital's public record.
              </p>
            </div>

            <div v-if="filteredStories.length === 0" class="rounded-card border border-dashed border-border bg-surface p-10 text-center">
              <Icon name="lucide:file-search" class="mx-auto size-6 text-ink-muted" aria-hidden="true" />
              <p class="mt-3 text-small text-ink-muted">
                No stories match that filter.
              </p>
            </div>

            <ul v-else class="grid gap-5 md:grid-cols-2">
              <li
                v-for="story in filteredStories"
                :key="story.slug"
                class="overflow-hidden rounded-card border border-border bg-surface shadow-card"
              >
                <NuxtLink :to="`/blog/${story.slug}`" class="block">
                  <img
                    v-if="story.coverImageUrl"
                    :src="story.coverImageUrl"
                    :alt="story.title"
                    loading="lazy"
                    class="aspect-[16/9] w-full object-cover"
                  />
                  <div class="p-5">
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
                    <span class="mt-5 inline-flex items-center gap-1 text-small font-semibold text-primary">
                      Read story
                      <Icon name="lucide:arrow-right" class="size-4" />
                    </span>
                  </div>
                </NuxtLink>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { Database } from "~~/types/database.types";
import { richTextToHtml, richTextToPlainText } from "~~/shared/rich-text";

definePageMeta({ layout: "default" });

const route = useRoute();
const slug = String(route.params.slug);
const supabase = useSupabaseClient<Database>();
const { milestoneStories } = useMetrhContent();

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

type BlogCategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

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

const { data: storyData } = await useAsyncData(`public-blog-${slug}`, async () => {
  try {
    const { data: postRow, error } = await supabase
      .from("blog_posts")
      .select("id,title,slug,excerpt,content,cover_image_url,category_id,published_at,reading_minutes,view_count,created_at,updated_at")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (error) throw error;

    const post = postRow as BlogPostRow | null;

    if (post) {
      const [{ data: categories, error: categoriesError }, { data: relatedPosts, error: relatedError }] =
        await Promise.all([
          supabase
            .from("blog_categories")
            .select("id,name,slug,description")
            .eq("id", post.category_id ?? ""),
          supabase
            .from("blog_posts")
            .select("id,title,slug,excerpt,content,category_id,published_at,reading_minutes,view_count,created_at,updated_at")
            .eq("status", "published")
            .order("published_at", { ascending: false })
            .limit(6),
        ]);

      if (categoriesError) throw categoriesError;
      if (relatedError) throw relatedError;

      const category = ((categories ?? []) as BlogCategoryRow[])[0] ?? null;
      const relatedRows = (relatedPosts ?? []) as BlogPostRow[];
      return {
        story: {
          id: post.id,
          slug: post.slug,
          title: post.title,
          summary: summarize(post.excerpt, post.content),
          bodyHtml: richTextToHtml(post.content),
          category: category?.name ?? "Uncategorized",
          categorySlug: category?.slug ?? "uncategorized",
          categoryDescription: category?.description ?? null,
          yearLabel: formatDateLabel(post.published_at ?? post.created_at),
          publishedAt: post.published_at,
          readingMinutes: post.reading_minutes,
          viewCount: post.view_count,
          coverImageUrl: post.cover_image_url,
          seoTitle: post.title,
          seoDescription: summarize(post.excerpt, post.content),
        },
        relatedStories: relatedRows
          .filter((entry) => entry.slug !== slug)
          .slice(0, 3)
          .map((entry) => ({
            slug: entry.slug,
            title: entry.title,
            category: "Published story",
          })),
      };
    }
  } catch (error) {
    console.warn("[blog] Falling back to seeded story.", error);
  }

  const fallback = milestoneStories.find((entry) => entry.slug === slug);
  if (!fallback) return null;

  return {
    story: {
      id: fallback.slug,
      slug: fallback.slug,
      title: fallback.title,
      summary: fallback.summary,
      bodyHtml: richTextToHtml(fallback.body),
      category: fallback.category,
      categorySlug: fallback.category.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      categoryDescription: null,
      yearLabel: fallback.yearLabel,
      publishedAt: null,
      readingMinutes: null,
      viewCount: 0,
      coverImageUrl: null,
      seoTitle: fallback.title,
      seoDescription: fallback.summary,
    },
    relatedStories: milestoneStories
      .filter((entry) => entry.slug !== slug)
      .slice(0, 3)
      .map((entry) => ({
        slug: entry.slug,
        title: entry.title,
        category: entry.category,
      })),
  };
});

const story = computed(() => storyData.value?.story ?? null);
const relatedStories = computed(() => storyData.value?.relatedStories ?? []);

if (!story.value) {
  throw createError({ statusCode: 404, statusMessage: "Story not found." });
}

useSeoMeta({
  title: () => `${story.value?.seoTitle ?? story.value?.title} — MeTRH`,
  description: () => story.value?.seoDescription ?? story.value?.summary,
});
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
          <span v-if="story.readingMinutes" class="ml-2">
            · {{ story.readingMinutes }} min read
          </span>
          <span v-if="story.viewCount" class="ml-2">
            · {{ story.viewCount }} views
          </span>
        </p>

        <img
          v-if="story.coverImageUrl"
          :src="story.coverImageUrl"
          :alt="story.title"
          class="mt-6 w-full rounded-card object-cover"
        />

        <p class="mt-5 text-body text-ink-muted">
          {{ story.summary }}
        </p>

        <div class="blog-content mt-8 rounded-card bg-surface-alt p-5 text-body text-ink" v-html="story.bodyHtml" />
      </article>

      <aside class="space-y-4">
        <div class="rounded-card border border-border bg-white p-5">
          <p class="text-small font-semibold uppercase tracking-wide text-info">
            Related stories
          </p>
          <ul class="mt-4 space-y-3">
            <li v-for="item in relatedStories" :key="item.slug">
              <NuxtLink
                :to="`/blog/${item.slug}`"
                class="block rounded-control border border-border px-3 py-2.5 hover:border-primary/30 hover:bg-surface-alt"
              >
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

<style scoped>
.blog-content :deep(h2) {
  margin-top: 1.75rem;
  margin-bottom: 0.75rem;
  font-size: var(--text-h2);
  line-height: var(--text-h2--line-height);
}

.blog-content :deep(h3) {
  margin-top: 1.5rem;
  margin-bottom: 0.6rem;
  font-size: var(--text-h3);
  line-height: var(--text-h3--line-height);
}

.blog-content :deep(h4) {
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
  font-size: var(--text-h4);
  line-height: var(--text-h4--line-height);
}

.blog-content :deep(p) {
  margin-bottom: 1rem;
  color: var(--color-ink-muted);
}

.blog-content :deep(div) {
  margin-bottom: 1rem;
  color: var(--color-ink-muted);
}

.blog-content :deep(ul),
.blog-content :deep(ol) {
  margin-bottom: 1rem;
  padding-left: 1.5rem;
  color: var(--color-ink-muted);
}

.blog-content :deep(ul) {
  list-style: disc;
}

.blog-content :deep(ol) {
  list-style: decimal;
}

.blog-content :deep(li) {
  margin-bottom: 0.5rem;
}

.blog-content :deep(blockquote) {
  margin: 1.25rem 0;
  border-left: 3px solid var(--color-accent);
  padding-left: 1rem;
  color: var(--color-ink);
  font-style: italic;
}

.blog-content :deep(a) {
  color: var(--color-primary);
  text-decoration: underline;
}

.blog-content :deep(strong),
.blog-content :deep(b) {
  color: var(--color-ink);
  font-weight: 700;
}

.blog-content :deep(code) {
  border-radius: 0.25rem;
  background: var(--color-surface);
  padding: 0.1rem 0.25rem;
  font-size: 0.92em;
}

.blog-content :deep(pre) {
  margin: 1rem 0;
  overflow-x: auto;
  border-radius: 0.5rem;
  background: var(--color-primary-dark);
  color: white;
  padding: 1rem;
}

.blog-content :deep(hr) {
  margin: 1.5rem 0;
  border: 0;
  border-top: 1px solid var(--color-border);
}
</style>

<script setup lang="ts">
import { richTextToPlainText } from "~~/shared/rich-text";

const props = withDefaults(
  defineProps<{
    pageSlug?: "home" | "about";
  }>(),
  {
    pageSlug: "about",
  },
);

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
  created_at: string;
};

const { data: homeContent } = await usePageContent("home");
const { data: aboutContent } = await usePageContent("about");
const resolveMediaUrl = usePublicStorageUrl();

const defaultAffiliations = [
  "Kenya Methodist University (KeMU)",
  "Meru University of Science and Technology",
  "Kenya Medical Training College (KMTC)",
];

const teachingSection = computed(
  () => {
    if (props.pageSlug === "home") {
      return (
        homeContent.value?.sectionsByKey["teaching-context-links"] ??
        homeContent.value?.sectionsByKey["teaching-affiliations"] ??
        null
      );
    }

    return (
      aboutContent.value?.sectionsByKey["teaching-affiliations"] ??
      homeContent.value?.sectionsByKey["teaching-context-links"] ??
      null
    );
  },
);

const affiliations = computed(
  () => {
    const rows =
      (props.pageSlug === "home"
        ? homeContent.value?.itemsBySectionId[teachingSection.value?.id ?? ""]
        : aboutContent.value?.itemsBySectionId[teachingSection.value?.id ?? ""]) ??
      [];
    return rows.length > 0
      ? rows
      : defaultAffiliations.map((title) => ({ title }));
  },
);

function formatDateLabel(value: string | null | undefined) {
  if (!value) return "Latest update";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function summarize(text: string | null | undefined, fallback = "") {
  const source = richTextToPlainText(text ?? fallback)
    .replace(/\s+/g, " ")
    .trim();

  return source.length > 130
    ? `${source.slice(0, 127).trimEnd()}...`
    : source;
}

const { data: blogPreviewData } = await useAsyncData(
  "home-blog-previews",
  async () => {
    const response = await $fetch<{
      categories: BlogCategoryRow[];
      posts: BlogPostRow[];
    }>("/api/public/blog");

    const categories = new Map(
      (response.categories ?? []).map((category) => [category.id, category]),
    );

    return (response.posts ?? []).slice(0, 3).map((post) => {
      const category = post.category_id ? categories.get(post.category_id) : null;

      return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        summary: summarize(post.excerpt, post.content),
        category: category?.name ?? "Hospital update",
        dateLabel: formatDateLabel(post.published_at ?? post.created_at),
        coverImageUrl: resolveMediaUrl(post.cover_image_url, "media"),
      };
    });
  },
);

const blogPreviews = computed(() => blogPreviewData.value ?? []);
</script>

<template>
  <section class="bg-surface-alt" aria-labelledby="teaching-heading">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-16">
      <div class="grid md:grid-cols-2 gap-10 items-center">
        <div>
          <p class="text-small font-semibold uppercase tracking-wide text-info">
            {{ teachingSection?.eyebrow || "Teaching &amp; research" }}
          </p>
          <h2
            id="teaching-heading"
            class="mt-2 font-display font-semibold text-h2 text-ink"
          >
            {{
              teachingSection?.title ||
              "A teaching hospital, not just a treating one"
            }}
          </h2>
          <p class="mt-3 text-body text-ink-muted">
            {{
              teachingSection?.summary ||
              "MeTRH is the teaching hospital for three institutions and an internship centre for Ministry of Health interns, clinical officers, nurses, and nutritionists — with research activity conducted on-site, including published studies on antimicrobial resistance."
            }}
          </p>
        </div>
        <ul class="grid gap-4">
          <li
            v-for="item in affiliations"
            :key="item.title"
            class="flex items-center gap-3 rounded-card border border-border bg-surface p-4"
          >
            <span
              class="flex size-9 items-center justify-center rounded-control bg-primary/10 text-primary shrink-0"
            >
              <Icon
                name="lucide:graduation-cap"
                class="size-5"
                aria-hidden="true"
              />
            </span>
            <span class="text-small font-semibold text-ink">{{ item.title }}</span>
          </li>
        </ul>
      </div>

      <section
        v-if="blogPreviews.length"
        class="mt-12 rounded-card border border-border bg-surface px-4 py-6 shadow-card sm:px-5 md:px-6 md:py-7 lg:mt-14 lg:px-7"
        aria-labelledby="home-blog-preview-heading"
      >
        <div>
          <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div class="max-w-2xl">
            <p
              id="home-blog-preview-heading"
              class="text-small font-semibold uppercase tracking-wide text-info"
            >
              Latest stories
            </p>
            <p class="mt-1 text-small text-ink-muted">
              Recent blog updates from MeTRH.
            </p>
            </div>
            <NuxtLink
              to="/blog"
              class="inline-flex items-center gap-1 text-small font-semibold text-primary hover:underline"
            >
              View all
              <Icon name="lucide:arrow-right" class="size-4" />
            </NuxtLink>
          </div>

          <ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            <li
              v-for="post in blogPreviews"
              :key="post.id"
              class="overflow-hidden rounded-card border border-border bg-surface shadow-card transition-all hover:border-primary/30 hover:shadow-elevated"
            >
              <NuxtLink :to="`/blog/${post.slug}`" class="flex h-full flex-col">
                <div class="bg-surface-alt">
                  <img
                    v-if="post.coverImageUrl"
                    :src="post.coverImageUrl"
                    :alt="post.title"
                    loading="lazy"
                    decoding="async"
                    class="aspect-[16/10] w-full object-cover"
                  />
                  <div
                    v-else
                    class="flex aspect-[16/10] w-full items-center justify-center text-primary"
                  >
                    <Icon name="lucide:newspaper" class="size-8" />
                  </div>
                </div>
                <div class="flex flex-1 flex-col p-4 sm:p-5">
                  <p class="text-caption font-semibold uppercase tracking-wide text-accent">
                    {{ post.category }}
                  </p>
                  <h3 class="mt-2 font-display text-h4 font-semibold text-ink">
                    {{ post.title }}
                  </h3>
                  <p class="mt-1 text-caption text-ink-muted">
                    {{ post.dateLabel }}
                  </p>
                  <p class="mt-3 text-small text-ink-muted">
                    {{ post.summary }}
                  </p>
                  <span class="mt-auto inline-flex items-center gap-1 pt-5 text-small font-semibold text-primary">
                    Read story
                    <Icon name="lucide:arrow-right" class="size-4" />
                  </span>
                </div>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </section>
    </div>
  </section>
</template>

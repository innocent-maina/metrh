<script setup lang="ts">
const { contactSummary, milestoneStories } = useMetrhContent();

// TODO(step 5): replace `milestoneSlides` with blog_posts flagged as
// milestones (e.g. a `is_featured` or category filter), fetched server-side.
// The pinned first slide (emergency + visiting hours) stays hardcoded here
// regardless — it should never depend on content being published.
//
// Every fact below is drawn directly from content.md — none invented.
interface NoticeSlide {
  id: string;
  kind: "pinned" | "milestone";
  eyebrow: string;
  title: string;
  body: string;
  href?: string;
}

const slides: NoticeSlide[] = [
  // Non-null assertions are safe here: the content parser seeds four fixed
  // milestone stories in the order below.
  {
    id: "emergency",
    kind: "pinned",
    eyebrow: "Open 24 hours",
    title: `Emergency line: ${contactSummary.emergencyLine}`,
    body: `Visiting hours: ${contactSummary.visitingHours
      .map((hours) => `${hours.start}–${hours.end}`)
      .join(", ")} daily.`,
    href: "/contact",
  },
  {
    id: "spinal-surgery",
    kind: "milestone",
    eyebrow: "2023 milestone",
    title: milestoneStories[0]!.title,
    body: milestoneStories[0]!.summary,
    href: "/blog",
  },
  {
    id: "oesophageal-screening",
    kind: "milestone",
    eyebrow: "Ongoing partnership",
    title: milestoneStories[1]!.title,
    body: milestoneStories[1]!.summary,
    href: "/services",
  },
  {
    id: "blood-drive",
    kind: "milestone",
    eyebrow: "Community impact",
    title: milestoneStories[3]!.title,
    body: milestoneStories[3]!.summary,
    href: "/events",
  },
  {
    id: "cancer-centre",
    kind: "milestone",
    eyebrow: "Under development",
    title: milestoneStories[2]!.title,
    body: milestoneStories[2]!.summary,
    href: "/about#growth",
  },
];

const currentIndex = ref(0);
const isPaused = ref(false);
let timer: ReturnType<typeof setInterval> | null = null;
let prefersReducedMotion = false;

function goTo(index: number) {
  currentIndex.value = (index + slides.length) % slides.length;
}
function next() {
  goTo(currentIndex.value + 1);
}
function prev() {
  goTo(currentIndex.value - 1);
}

function startAutoplay() {
  if (prefersReducedMotion) return;
  stopAutoplay();
  timer = setInterval(() => {
    if (!isPaused.value) next();
  }, 6000);
}
function stopAutoplay() {
  if (timer) clearInterval(timer);
  timer = null;
}

onMounted(() => {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  prefersReducedMotion = mq.matches;
  startAutoplay();
});
onUnmounted(stopAutoplay);
</script>

<template>
  <section
    class="relative bg-primary text-white overflow-hidden"
    aria-roledescription="carousel"
    aria-label="Hospital notices and milestones"
    @mouseenter="isPaused = true"
    @mouseleave="isPaused = false"
    @focusin="isPaused = true"
    @focusout="isPaused = false"
  >
    <div
      class="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary-dark opacity-95"
      aria-hidden="true"
    />

    <div class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">
      <div class="min-h-[220px] md:min-h-[200px]">
        <div
          v-for="(slide, index) in slides"
          v-show="index === currentIndex"
          :key="slide.id"
          class="max-w-2xl"
          role="group"
          :aria-roledescription="'slide'"
          :aria-label="`${index + 1} of ${slides.length}`"
        >
          <p
            class="text-small font-semibold uppercase tracking-wide text-accent"
          >
            {{ slide.eyebrow }}
          </p>
          <h1 class="mt-3 font-display font-bold text-hero">
            {{ slide.title }}
          </h1>
          <p class="mt-4 text-body text-white/85 max-w-xl">
            {{ slide.body }}
          </p>
          <NuxtLink
            v-if="slide.href"
            :to="slide.href"
            class="mt-6 inline-flex items-center gap-2 rounded-control bg-white px-5 py-2.5 text-small font-semibold text-primary hover:bg-white/90 transition-colors"
          >
            {{ slide.kind === "pinned" ? "Contact & directions" : "Read more" }}
            <Icon name="lucide:arrow-right" class="size-4" aria-hidden="true" />
          </NuxtLink>
        </div>
      </div>

      <div class="mt-8 flex items-center gap-4">
        <button
          type="button"
          aria-label="Previous notice"
          class="rounded-full border border-white/30 p-2 hover:bg-white/10 transition-colors"
          @click="prev"
        >
          <Icon name="lucide:chevron-left" class="size-4" aria-hidden="true" />
        </button>

        <div class="flex gap-2" role="tablist" aria-label="Notices">
          <button
            v-for="(slide, index) in slides"
            :key="`dot-${slide.id}`"
            type="button"
            role="tab"
            :aria-selected="index === currentIndex"
            :aria-label="`Show notice ${index + 1}`"
            class="h-1.5 rounded-full transition-all"
            :class="
              index === currentIndex
                ? 'w-6 bg-accent'
                : 'w-1.5 bg-white/40 hover:bg-white/60'
            "
            @click="goTo(index)"
          />
        </div>

        <button
          type="button"
          aria-label="Next notice"
          class="rounded-full border border-white/30 p-2 hover:bg-white/10 transition-colors"
          @click="next"
        >
          <Icon name="lucide:chevron-right" class="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  </section>
</template>

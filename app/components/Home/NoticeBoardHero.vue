<script setup lang="ts">
interface HeroSlide {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  image: string;
  alt: string;
  caption: string;
}

const homeImages = useHospitalMedia();

const slides: HeroSlide[] = [
  {
    id: "welcome-care",
    eyebrow: "Welcome to MeTRH",
    title: "Compassionate public care, every day.",
    body:
      "Meru Teaching and Referral Hospital serves Upper Eastern Kenya with emergency care, specialist clinics, surgery, diagnostics, and teaching-led service delivery.",
    ctaLabel: "Explore services",
    ctaHref: "/services",
    image: homeImages.value[0]!.src,
    alt: homeImages.value[0]!.alt,
    caption: homeImages.value[0]!.caption,
  },
  {
    id: "specialist-care",
    eyebrow: "Specialist referral care",
    title: "Advanced treatment closer to home.",
    body:
      "From outpatient review to diagnostics and specialist pathways, MeTRH keeps care accessible for patients who would otherwise travel farther for treatment.",
    ctaLabel: "View clinic schedule",
    ctaHref: "/services#clinic-schedule",
    image: homeImages.value[2]!.src,
    alt: homeImages.value[2]!.alt,
    caption: homeImages.value[2]!.caption,
  },
  {
    id: "growth-teaching",
    eyebrow: "Growth and teaching",
    title: "A hospital that is expanding with purpose.",
    body:
      "New capacity, equipment, and training investments are strengthening the hospital's ability to deliver better outcomes for patients and the wider region.",
    ctaLabel: "Learn about MeTRH",
    ctaHref: "/about",
    image: homeImages.value[3]!.src,
    alt: homeImages.value[3]!.alt,
    caption: homeImages.value[3]!.caption,
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
    class="overflow-x-clip bg-surface"
    aria-roledescription="carousel"
    aria-label="Hospital hero carousel"
    @mouseenter="isPaused = true"
    @mouseleave="isPaused = false"
    @focusin="isPaused = true"
    @focusout="isPaused = false"
  >
    <div class="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
      <div class="overflow-hidden">
        <div
          class="flex transition-transform duration-700 ease-out"
          :style="{ transform: `translateX(-${currentIndex * 100}%)` }"
        >
          <article
            v-for="(slide, index) in slides"
            :key="slide.id"
            class="relative min-w-full"
            role="group"
            :aria-roledescription="'slide'"
            :aria-label="`${index + 1} of ${slides.length}`"
          >
            <div class="relative">
              <img
                :src="slide.image"
                :alt="slide.alt"
                class="h-[18rem] w-screen object-cover sm:h-[24rem] lg:h-[34rem]"
                :loading="index === currentIndex ? 'eager' : 'lazy'"
                decoding="async"
              />
              <div
                class="absolute inset-0 bg-gradient-to-t from-primary-dark/80 via-primary-dark/30 to-transparent"
                aria-hidden="true"
              />

              <div class="absolute inset-0">
                <div
                  class="mx-auto flex h-full max-w-7xl items-end px-4 pb-4 sm:px-6 lg:px-8 lg:pb-8"
                >
                  <div
                    class="w-full max-w-2xl rounded-card border border-white/12 bg-primary-dark/55 p-4 text-white shadow-elevated backdrop-blur-sm sm:p-5 lg:p-6"
                  >
                    <p class="text-caption font-semibold uppercase tracking-wide text-accent">
                      {{ slide.eyebrow }}
                    </p>
                    <h1 class="mt-2 max-w-2xl font-display font-bold text-h1 text-white sm:text-h2">
                      {{ slide.title }}
                    </h1>
                    <p class="mt-3 max-w-xl text-small text-white/85 sm:text-body">
                      {{ slide.body }}
                    </p>

                    <div
                      class="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <p class="max-w-xs text-caption uppercase tracking-[0.18em] text-white/70">
                        {{ slide.caption }}
                      </p>

                      <div class="flex flex-wrap items-center gap-2">
                        <NuxtLink
                          :to="slide.ctaHref"
                          class="inline-flex items-center justify-center gap-2 rounded-control bg-white px-4 py-2.5 text-caption font-semibold text-primary transition-colors hover:bg-white/90 sm:px-5 sm:py-3 sm:text-small"
                        >
                          {{ slide.ctaLabel }}
                          <Icon
                            name="lucide:arrow-right"
                            class="size-3.5 sm:size-4"
                            aria-hidden="true"
                          />
                        </NuxtLink>

                        <div class="flex items-center gap-3">
                          <button
                            type="button"
                            aria-label="Previous slide"
                            class="rounded-full border border-white/20 p-1.5 text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                            @click="prev"
                          >
                            <Icon
                              name="lucide:chevron-left"
                              class="size-3.5"
                              aria-hidden="true"
                            />
                          </button>

                          <div class="flex gap-2" role="tablist" aria-label="Hero slides">
                            <button
                              v-for="(item, dotIndex) in slides"
                              :key="`dot-${item.id}`"
                              type="button"
                              role="tab"
                              :aria-selected="dotIndex === currentIndex"
                              :aria-label="`Show slide ${dotIndex + 1}`"
                              class="h-1.5 rounded-full transition-all"
                              :class="
                                dotIndex === currentIndex
                                  ? 'w-6 bg-white'
                                  : 'w-1.5 bg-white/40 hover:bg-white/60'
                              "
                              @click="goTo(dotIndex)"
                            />
                          </div>

                          <button
                            type="button"
                            aria-label="Next slide"
                            class="rounded-full border border-white/20 p-1.5 text-white/90 transition-colors hover:bg-white/10 hover:text-white"
                            @click="next"
                          >
                            <Icon
                              name="lucide:chevron-right"
                              class="size-3.5"
                              aria-hidden="true"
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

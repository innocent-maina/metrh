<script setup lang="ts">
const { data: siteSettings } = await useSiteSettings();

const emergencyLine = computed(
  () => siteSettings.value?.emergency_line?.trim() || "0711-207623",
);

const visitingHoursSummary = computed(() => {
  const hours = siteSettings.value?.visiting_hours ?? [];
  if (!hours.length) return "";
  return hours
    .map((entry) => `${entry.label}: ${entry.start} – ${entry.end}`)
    .join(" · ");
});

const primaryNav = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Services", to: "/services" },
  { label: "Blog", to: "/blog" },
  { label: "Careers", to: "/careers" },
  { label: "Tenders", to: "/tenders" },
  { label: "Contact", to: "/contact" },
];

const isMenuOpen = ref(false);
const route = useRoute();
watch(
  () => route.fullPath,
  () => {
    isMenuOpen.value = false;
  },
);
</script>

<template>
  <header
    class="sticky top-0 z-50 bg-surface/95 backdrop-blur border-b border-border"
  >
    <!-- Utility bar: emergency line always visible, one interaction from anywhere -->
    <div class="bg-primary-dark text-white">
      <div
        class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 py-1.5 text-small"
      >
        <a
          :href="siteSettings?.emergency_href || `tel:${emergencyLine.replace(/-/g, '')}`"
          class="flex items-center gap-1.5 font-medium hover:text-accent transition-colors"
        >
          <Icon
            name="lucide:phone-call"
            class="size-4 shrink-0 text-accent"
            aria-hidden="true"
          />
          <span>
            {{ siteSettings?.emergency_label || "Emergency" }}:
            {{ emergencyLine }}
          </span>
        </a>
        <span v-if="visitingHoursSummary" class="hidden md:inline text-white/80">
          {{ visitingHoursSummary }}
        </span>
      </div>
    </div>

    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-20 md:h-24">
        <NuxtLink
          to="/"
          class="flex items-center gap-3 shrink-0"
          aria-label="MeTRH home"
        >
          <img
            src="/logo2.png"
            alt="MeTRH logo"
            class="size-20 rounded-control bg-transparent object-contain"
          />
          <span
            class="font-display font-semibold text-h4 text-ink leading-none"
          >
            MeTRH
            <span
              class="block text-caption font-body font-normal text-ink-muted mt-0.5"
            >
              Meru Teaching &amp; Referral Hospital
            </span>
          </span>
        </NuxtLink>

        <nav class="hidden lg:flex items-center gap-1" aria-label="Primary">
          <NuxtLink
            v-for="item in primaryNav"
            :key="item.to"
            :to="item.to"
            class="px-3 py-2 rounded-control text-small font-medium text-ink-muted hover:text-primary hover:bg-surface-alt transition-colors"
            active-class="text-primary bg-surface-alt"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>

        <div class="hidden lg:block">
          <NuxtLink
            to="/contact"
            class="inline-flex items-center gap-2 rounded-control bg-primary px-4 py-2 text-small font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            Get in touch
          </NuxtLink>
        </div>

        <button
          type="button"
          class="lg:hidden inline-flex items-center justify-center rounded-control p-2 text-ink hover:bg-surface-alt"
          :aria-expanded="isMenuOpen"
          aria-controls="mobile-nav"
          aria-label="Toggle navigation menu"
          @click="isMenuOpen = !isMenuOpen"
        >
          <Icon
            :name="isMenuOpen ? 'lucide:x' : 'lucide:menu'"
            class="size-6"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>

    <nav
      v-show="isMenuOpen"
      id="mobile-nav"
      class="lg:hidden border-t border-border bg-surface"
      aria-label="Primary mobile"
    >
      <ul class="px-4 py-2 divide-y divide-border">
        <li v-for="item in primaryNav" :key="item.to">
          <NuxtLink
            :to="item.to"
            class="block py-3 text-body font-medium text-ink hover:text-primary"
            active-class="text-primary"
          >
            {{ item.label }}
          </NuxtLink>
        </li>
      </ul>
    </nav>
  </header>
</template>

<script setup lang="ts">
const { data: siteSettings } = await useSiteSettings();

const quickLinks = [
  { label: "About MeTRH", to: "/about" },
  { label: "Services", to: "/services" },
  { label: "Clinic Schedule", to: "/services#clinic-schedule" },
  { label: "Careers", to: "/careers" },
  { label: "Tenders", to: "/tenders" },
  { label: "Blog", to: "/blog" },
];

const legalLinks = [
  { label: "Privacy Policy", to: "/privacy-policy" },
  { label: "Terms of Use", to: "/terms-of-use" },
  { label: "Cookie Policy", to: "/cookie-policy" },
];

const emergencyLine = computed(
  () => siteSettings.value?.emergency_line?.trim() || "0711-207623",
);

const visitingHours = computed(
  () => siteSettings.value?.visiting_hours ?? [],
);

const socialLinks = computed(
  () =>
    siteSettings.value?.social_links ?? {
      facebook: "https://facebook.com/MeTRH.Hospital",
      x: "https://x.com/MeTRH_Hospital",
    },
);
</script>

<template>
  <footer class="bg-primary-dark text-white">
    <div
      class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 grid gap-10 md:grid-cols-2 xl:grid-cols-5"
    >
      <div class="md:col-span-1">
        <div class="flex items-center gap-3">
          <img
            src="/logo2.png"
            alt="MeTRH logo"
            class="size-11 rounded-control bg-transparent object-contain"
          />
          <p class="font-display font-semibold text-h4">MeTRH</p>
        </div>
        <p class="text-small text-white/70 mt-1">
          Exemplary Health Care for You
        </p>

        <a
          :href="siteSettings?.emergency_href || `tel:${emergencyLine.replace(/-/g, '')}`"
          class="mt-5 inline-flex items-center gap-2 rounded-control bg-accent px-4 py-2.5 text-small font-semibold text-primary-dark hover:opacity-90 transition-opacity"
        >
          <Icon name="lucide:phone-call" class="size-4" aria-hidden="true" />
          {{ siteSettings?.emergency_label || "Emergency" }}: {{ emergencyLine }}
        </a>
      </div>

      <div>
        <h2
          class="text-small font-semibold uppercase tracking-wide text-white/60"
        >
          Quick Links
        </h2>
        <ul class="mt-4 space-y-2.5">
          <li v-for="item in quickLinks" :key="item.to">
            <NuxtLink
              :to="item.to"
              class="text-small text-white/85 hover:text-accent transition-colors"
            >
              {{ item.label }}
            </NuxtLink>
          </li>
        </ul>
      </div>

      <div>
        <h2
          class="text-small font-semibold uppercase tracking-wide text-white/60"
        >
          Visiting Hours
        </h2>
        <ul class="mt-4 space-y-2.5">
          <li
            v-for="vh in visitingHours"
            :key="vh.label"
            class="text-small text-white/85 flex justify-between gap-4 max-w-[14rem]"
          >
            <span class="text-white/60">{{ vh.label }}</span>
            <span class="tabular-nums text-white">{{ vh.start }} – {{ vh.end }}</span>
          </li>
        </ul>
      </div>

      <div>
        <h2
          class="text-small font-semibold uppercase tracking-wide text-white/60"
        >
          Reach Us
        </h2>
        <address class="mt-4 not-italic text-small text-white/85 space-y-2.5">
          <p class="flex gap-2">
            <Icon
              name="lucide:map-pin"
              class="size-4 shrink-0 mt-0.5 text-white/50"
              aria-hidden="true"
            />{{ siteSettings?.physical_address || "" }}
          </p>
          <p class="flex gap-2">
            <Icon
              name="lucide:mail"
              class="size-4 shrink-0 mt-0.5 text-white/50"
              aria-hidden="true"
            />{{ siteSettings?.postal_address || "" }}
          </p>
        </address>
        <div class="mt-4 flex gap-3">
          <a
            :href="socialLinks.facebook"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="MeTRH on Facebook"
            class="text-white/70 hover:text-accent"
          >
            <Icon name="lucide:facebook" class="size-5" />
          </a>
          <a
            :href="socialLinks.x"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="MeTRH on X"
            class="text-white/70 hover:text-accent"
          >
            <Icon name="lucide:twitter" class="size-5" />
          </a>
        </div>
      </div>

      <div>
        <h2
          class="text-small font-semibold uppercase tracking-wide text-white/60"
        >
          Legal Pages
        </h2>
        <ul class="mt-4 space-y-2.5">
          <li v-for="item in legalLinks" :key="item.to">
            <NuxtLink
              :to="item.to"
              class="text-small text-white/85 hover:text-accent transition-colors"
            >
              {{ item.label }}
            </NuxtLink>
          </li>
        </ul>
      </div>
    </div>

    <div class="border-t border-surface/10">
      <div
        class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-caption text-white/60"
      >
        <p class="text-center sm:text-left">
          Website built by
          <a
            href="https://nuvanahq.co.ke"
            target="_blank"
            rel="noopener noreferrer"
            class="font-semibold text-accent hover:underline"
          >
            Nuvana Technology
          </a>
          for Meru Teaching and Referral Hospital.
        </p>
        <p class="text-center sm:text-right text-white/45">
          Official builder site:
          <a
            href="https://nuvanahq.co.ke"
            target="_blank"
            rel="noopener noreferrer"
            class="font-medium text-white/70 hover:text-accent hover:underline"
          >
            nuvanahq.co.ke
          </a>
        </p>
      </div>
    </div>
  </footer>
</template>

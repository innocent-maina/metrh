<script setup lang="ts">
const { contactSummary } = useMetrhContent();

const quickLinks = [
  { label: "About MeTRH", to: "/about" },
  { label: "Services", to: "/services" },
  { label: "Clinic Schedule", to: "/services#clinic-schedule" },
  { label: "Careers", to: "/careers" },
  { label: "Tenders & Downloads", to: "/tenders" },
  { label: "Blog", to: "/blog" },
];

const legalLinks = [
  { label: "Privacy Policy", to: "/privacy-policy" },
  { label: "Terms of Service", to: "/terms-of-service" },
  { label: "Cookie Policy", to: "/cookie-policy" },
];

const currentYear = new Date().getFullYear();
</script>

<template>
  <footer class="bg-primary-dark text-white">
    <div
      class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 grid gap-10 md:grid-cols-4"
    >
      <div class="md:col-span-1">
        <p class="font-display font-semibold text-h4">MeTRH</p>
        <p class="text-small text-white/70 mt-1">
          Exemplary Health Care for You
        </p>

        <a
          :href="`tel:${contactSummary.emergencyLine.replace(/-/g, '')}`"
          class="mt-5 inline-flex items-center gap-2 rounded-control bg-accent px-4 py-2.5 text-small font-semibold text-primary-dark hover:opacity-90 transition-opacity"
        >
          <Icon name="lucide:phone-call" class="size-4" aria-hidden="true" />
          Emergency: {{ contactSummary.emergencyLine }}
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
            v-for="vh in contactSummary.visitingHours"
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
            />{{ contactSummary.physicalAddress }}
          </p>
          <p class="flex gap-2">
            <Icon
              name="lucide:mail"
              class="size-4 shrink-0 mt-0.5 text-white/50"
              aria-hidden="true"
            />{{ contactSummary.postalAddress }}
          </p>
        </address>
        <div class="mt-4 flex gap-3">
          <a
            :href="contactSummary.socialLinks.facebook"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="MeTRH on Facebook"
            class="text-white/70 hover:text-accent"
          >
            <Icon name="lucide:facebook" class="size-5" />
          </a>
          <a
            :href="contactSummary.socialLinks.x"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="MeTRH on X"
            class="text-white/70 hover:text-accent"
          >
            <Icon name="lucide:twitter" class="size-5" />
          </a>
        </div>
      </div>
    </div>

    <div class="border-t border-white/10">
      <div
        class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-caption text-white/60"
      >
        <p>
          &copy; {{ currentYear }} Meru Teaching and Referral Hospital. All
          rights reserved.
        </p>
        <ul class="flex gap-5">
          <li v-for="item in legalLinks" :key="item.to">
            <NuxtLink
              :to="item.to"
              class="hover:text-white transition-colors"
              >{{ item.label }}</NuxtLink
            >
          </li>
        </ul>
      </div>
    </div>
  </footer>
</template>

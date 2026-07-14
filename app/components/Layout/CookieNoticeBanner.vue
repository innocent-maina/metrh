<script setup lang="ts">
const consentCookie = useCookie<string | null>("metrh_cookie_notice", {
  default: () => null,
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax",
});

const isVisible = computed(() => consentCookie.value !== "acknowledged");

function acknowledge() {
  consentCookie.value = "acknowledged";
}
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0 translate-y-3"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-3"
  >
    <section
      v-if="isVisible"
      class="fixed bottom-4 left-4 right-4 z-[58] mx-auto max-w-xl rounded-card border border-border bg-surface/98 p-4 shadow-elevated backdrop-blur md:bottom-6 md:left-6 md:right-auto md:max-w-md"
      aria-label="Cookie notice"
    >
      <div class="flex items-start gap-3">
        <div
          class="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
        >
          <Icon name="lucide:cookie" class="size-5" aria-hidden="true" />
        </div>

        <div class="min-w-0 flex-1">
          <p class="font-display font-semibold text-h4 text-ink">
            Cookie notice
          </p>
          <p class="mt-1 text-small text-ink-muted">
            This site uses essential and usage cookies so the public website can
            work properly and we can understand which pages are visited.
          </p>

          <div class="mt-3 flex flex-wrap items-center gap-3">
            <NuxtLink
              to="/cookie-policy"
              class="text-small font-semibold text-primary hover:underline"
            >
              Read policy
            </NuxtLink>

            <button
              type="button"
              class="rounded-control bg-primary px-4 py-2 text-small font-semibold text-white hover:bg-primary-dark"
              @click="acknowledge"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </section>
  </Transition>
</template>

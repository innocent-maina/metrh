<script setup lang="ts">
const props = defineProps<{
  error: { statusCode: number; statusMessage?: string };
}>();

const isNotFound = computed(() => props.error.statusCode === 404);

function handleGoHome() {
  clearError({ redirect: "/" });
}
</script>

<template>
  <NuxtLayout name="default">
    <div class="mx-auto max-w-xl px-4 sm:px-6 lg:px-8 py-20 text-center">
      <span
        class="inline-flex size-14 items-center justify-center rounded-full bg-surface-alt text-primary"
      >
        <Icon
          :name="isNotFound ? 'lucide:map-pin-off' : 'lucide:alert-triangle'"
          class="size-7"
          aria-hidden="true"
        />
      </span>

      <h1 class="mt-6 font-display font-semibold text-h2 text-ink">
        {{ isNotFound ? "We can't find that page" : "Something went wrong" }}
      </h1>
      <p class="mt-3 text-body text-ink-muted">
        {{
          isNotFound
            ? "The page you're looking for may have moved or no longer exists."
            : "We're working on it. Try again, or use the links below."
        }}
      </p>

      <div
        class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
      >
        <button
          type="button"
          class="w-full sm:w-auto rounded-control bg-primary px-5 py-2.5 text-small font-semibold text-white hover:bg-primary-dark transition-colors"
          @click="handleGoHome"
        >
          Back to home
        </button>
        <a
          href="tel:0711207623"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-control border border-border px-5 py-2.5 text-small font-semibold text-ink hover:bg-surface-alt transition-colors"
        >
          <Icon
            name="lucide:phone-call"
            class="size-4 text-accent"
            aria-hidden="true"
          />
          Emergency: 0711-207623
        </a>
      </div>
    </div>
  </NuxtLayout>
</template>

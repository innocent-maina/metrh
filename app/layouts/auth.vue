<script setup lang="ts">
const authImages = useHospitalMedia();
</script>

<template>
  <div class="min-h-screen bg-surface-alt flex flex-col">
    <div class="flex-1 flex items-center justify-center px-4 py-12">
      <div class="w-full max-w-sm">
        <div class="flex items-center justify-center gap-2 mb-8">
          <img
            src="/logo.jpg"
            alt="MeTRH logo"
            class="size-9 rounded-control border border-border bg-white object-cover"
          />
          <span class="font-display font-semibold text-h4 text-ink"
            >MeTRH Staff</span
          >
        </div>
        <div
          class="bg-white rounded-card shadow-card border border-border p-6 sm:p-8"
        >
          <slot />
        </div>
      </div>
    </div>
    <p class="text-center text-caption text-ink-muted pb-6">
      Meru Teaching and Referral Hospital — internal use only
    </p>
  </div>
</template>

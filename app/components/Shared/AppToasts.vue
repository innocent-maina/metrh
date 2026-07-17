<script setup lang="ts">
const { toasts, dismissToast } = useAppToast();

const toastToneMeta = {
  success: {
    icon: "lucide:circle-check-big",
    wrapperClass: "border-success/20 bg-success/5 text-success",
    iconClass: "bg-success/15 text-success",
  },
  error: {
    icon: "lucide:circle-x",
    wrapperClass: "border-danger/20 bg-danger/5 text-danger",
    iconClass: "bg-danger/15 text-danger",
  },
  info: {
    icon: "lucide:info",
    wrapperClass: "border-info/20 bg-info/5 text-info",
    iconClass: "bg-info/15 text-info",
  },
} as const;
</script>

<template>
  <Teleport to="body">
    <TransitionGroup
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-2 opacity-0"
      tag="div"
      class="pointer-events-none fixed bottom-4 right-4 z-[90] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3"
    >
      <article
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto rounded-card border bg-surface px-4 py-3 shadow-elevated backdrop-blur"
        :class="toastToneMeta[toast.tone].wrapperClass"
      >
        <div class="flex items-start gap-3">
          <div
            class="flex size-10 shrink-0 items-center justify-center rounded-full"
            :class="toastToneMeta[toast.tone].iconClass"
          >
            <Icon
              :name="toastToneMeta[toast.tone].icon"
              class="size-5"
              aria-hidden="true"
            />
          </div>

          <div class="min-w-0 flex-1 pt-0.5">
            <p class="text-small font-semibold text-ink">
              {{ toast.title }}
            </p>
            <p
              v-if="toast.description"
              class="mt-1 text-caption text-ink-muted"
            >
              {{ toast.description }}
            </p>
          </div>

          <button
            type="button"
            class="rounded-control p-1 text-ink-muted hover:bg-surface-alt hover:text-ink"
            aria-label="Dismiss notification"
            @click="dismissToast(toast.id)"
          >
            <Icon name="lucide:x" class="size-4" aria-hidden="true" />
          </button>
        </div>
      </article>
    </TransitionGroup>
  </Teleport>
</template>

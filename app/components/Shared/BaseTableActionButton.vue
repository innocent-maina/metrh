<script setup lang="ts">
type Tone = "open" | "edit" | "warning" | "delete";

interface Props {
  label: string;
  icon: string;
  tone?: Tone;
}

const props = withDefaults(defineProps<Props>(), {
  tone: "open",
});

const emit = defineEmits<{
  (event: "click", payload: MouseEvent): void;
}>();

const toneClasses: Record<Tone, string> = {
  open:
    "border-primary/25 text-primary hover:bg-primary/5 focus-visible:ring-primary/40",
  edit:
    "border-success/25 text-success hover:bg-success/5 focus-visible:ring-success/40",
  warning:
    "border-warning/25 text-warning hover:bg-warning/5 focus-visible:ring-warning/40",
  delete:
    "border-danger/25 text-danger hover:bg-danger/5 focus-visible:ring-danger/40",
};
</script>

<template>
  <button
    type="button"
    class="inline-flex size-9 items-center justify-center rounded-control border bg-surface transition-colors hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
    :class="toneClasses[props.tone]"
    :aria-label="label"
    :title="label"
    @click="emit('click', $event)"
  >
    <Icon :name="icon" class="size-4" aria-hidden="true" />
    <span class="sr-only">{{ label }}</span>
  </button>
</template>

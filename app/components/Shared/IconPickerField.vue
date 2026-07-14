<script setup lang="ts">
import {
  createIconOption,
  defaultIconOptions,
  filterIconOptions,
  normalizeIconQuery,
  uniqueIconOptions,
  type IconOption,
  type IconifySearchResponse,
} from "~~/shared/icon-picker";

interface Props {
  modelValue: string;
  disabled?: boolean;
  placeholder?: string;
  collectionPrefix?: string;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  placeholder: "Choose an icon",
  collectionPrefix: "lucide",
});

const emit = defineEmits<{
  (event: "update:modelValue", value: string): void;
}>();

const isOpen = ref(false);
const searchTerm = ref("");
const customIconName = ref("");
const remoteResults = ref<IconOption[]>([]);
const isSearching = ref(false);
const searchInputRef = ref<HTMLInputElement | null>(null);

let searchTimer: ReturnType<typeof setTimeout> | null = null;
let searchRequestId = 0;

const selectedIcon = computed(() => String(props.modelValue ?? "").trim());
const selectedIconOption = computed(() =>
  selectedIcon.value ? createIconOption(selectedIcon.value) : null,
);

function openPicker() {
  if (props.disabled) return;
  isOpen.value = true;
}

function closePicker() {
  if (searchTimer) {
    clearTimeout(searchTimer);
    searchTimer = null;
  }
  searchRequestId += 1;
  isSearching.value = false;
  isOpen.value = false;
}

function clearIcon() {
  emit("update:modelValue", "");
  closePicker();
}

function selectIcon(name: string) {
  const next = normalizeIconName(name);
  if (!next) return;
  emit("update:modelValue", next);
  closePicker();
}

function applyCustomIcon() {
  selectIcon(customIconName.value);
}

function normalizeSearchInput(value: string) {
  const normalized = normalizeIconQuery(value);
  const prefix = `${props.collectionPrefix}:`;

  return normalized.startsWith(prefix) ? normalized.slice(prefix.length) : normalized;
}

function normalizeIconName(name: string) {
  const next = name.trim();
  if (!next) return "";
  return next.includes(":") ? next : `${props.collectionPrefix}:${next}`;
}

async function loadRemoteResults(query: string) {
  const requestId = ++searchRequestId;
  isSearching.value = true;

  try {
    const response = await $fetch<IconifySearchResponse>(
      "https://api.iconify.design/search",
      {
        query: {
          query,
          prefix: props.collectionPrefix,
          limit: 48,
        },
      },
    );

    if (requestId !== searchRequestId) return;

    remoteResults.value = uniqueIconOptions(
      (response.icons ?? []).map((name) => createIconOption(name)),
    );
  } catch {
    if (requestId !== searchRequestId) return;
    remoteResults.value = filterIconOptions(defaultIconOptions, query);
  } finally {
    if (requestId === searchRequestId) {
      isSearching.value = false;
    }
  }
}

watch(isOpen, async (open) => {
  if (searchTimer) {
    clearTimeout(searchTimer);
    searchTimer = null;
  }

  if (!open) return;

  searchTerm.value = "";
  remoteResults.value = [];
  isSearching.value = false;
  customIconName.value = selectedIcon.value;

  await nextTick();
  searchInputRef.value?.focus();
});

onBeforeUnmount(() => {
  if (searchTimer) {
    clearTimeout(searchTimer);
    searchTimer = null;
  }
  searchRequestId += 1;
});

watch(searchTerm, (value, _oldValue, onCleanup) => {
  const query = normalizeSearchInput(value);

  if (searchTimer) {
    clearTimeout(searchTimer);
    searchTimer = null;
  }

  if (!query) {
    remoteResults.value = [];
    isSearching.value = false;
    return;
  }

  if (query.length < 2) {
    remoteResults.value = filterIconOptions(defaultIconOptions, query);
    isSearching.value = false;
    return;
  }

  searchTimer = setTimeout(() => {
    void loadRemoteResults(query);
  }, 220);

  onCleanup(() => {
    if (searchTimer) {
      clearTimeout(searchTimer);
      searchTimer = null;
    }
  });
});

const visibleOptions = computed(() => {
  const query = normalizeSearchInput(searchTerm.value);
  const source = query ? (remoteResults.value.length > 0 ? remoteResults.value : filterIconOptions(defaultIconOptions, query)) : defaultIconOptions;
  const current = selectedIconOption.value ? [selectedIconOption.value] : [];

  return uniqueIconOptions([...current, ...source]).slice(0, 64);
});
</script>

<template>
  <div class="space-y-3">
    <div class="flex flex-wrap items-stretch gap-3">
      <button
        type="button"
        class="flex min-w-0 flex-1 items-center gap-3 rounded-card border border-border bg-surface px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="disabled"
        @click.stop="openPicker"
      >
        <span
          class="flex size-11 shrink-0 items-center justify-center rounded-control border border-border bg-surface-alt text-primary"
        >
          <Icon
            :name="selectedIcon || 'lucide:sparkles'"
            class="size-5"
            aria-hidden="true"
          />
        </span>

        <span class="min-w-0">
          <span class="block text-small font-semibold text-ink">
            {{ selectedIconOption?.label || placeholder }}
          </span>
          <span class="block truncate text-caption text-ink-muted">
            {{ selectedIcon || `Open the picker to choose a ${collectionPrefix} icon.` }}
          </span>
        </span>
      </button>

      <button
        v-if="selectedIcon && !disabled"
        type="button"
        class="rounded-control border border-border px-3 py-2.5 text-small font-semibold text-ink hover:bg-surface-alt"
        @click.stop="clearIcon"
      >
        Clear
      </button>
    </div>

    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="isOpen"
          class="fixed inset-0 z-[60] flex items-center justify-center bg-ink/60 px-4 py-6"
          tabindex="-1"
          @click="closePicker"
          @keydown.esc.prevent="closePicker"
        >
          <div
            class="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-border bg-surface shadow-elevated"
            @click.stop
          >
            <header class="border-b border-border px-5 py-4 sm:px-6">
              <div class="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p class="text-caption font-semibold uppercase tracking-wide text-info">
                    Icon picker
                  </p>
                  <h3 class="mt-1 font-display text-h3 text-ink">
                    Choose an icon
                  </h3>
                  <p class="mt-2 max-w-2xl text-small text-ink-muted">
                    Search Lucide icons, then fall back to a custom Iconify name if you need something else.
                  </p>
                </div>

                <div class="flex flex-wrap items-center gap-2">
                  <button
                    v-if="selectedIcon"
                    type="button"
                    class="rounded-control border border-border px-3 py-2 text-small font-semibold text-ink hover:bg-surface-alt"
                    @click="clearIcon"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    class="rounded-control border border-border px-3 py-2 text-small font-semibold text-ink hover:bg-surface-alt"
                    @click="closePicker"
                  >
                    Close
                  </button>
                </div>
              </div>
            </header>

            <div class="border-b border-border px-5 py-4 sm:px-6">
              <label class="block">
                <span class="mb-2 block text-small font-semibold text-ink">
                  Search icons
                </span>
                <input
                  ref="searchInputRef"
                  v-model="searchTerm"
                  type="search"
                  class="w-full rounded-card border border-border bg-surface px-3 py-2.5 text-body text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-primary"
                  placeholder="Search users, heart, stethoscope, calendar..."
                />
              </label>
            </div>

            <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
              <div v-if="isSearching" class="rounded-card border border-border bg-surface-alt px-4 py-3 text-small text-ink-muted">
                Searching icons...
              </div>

              <div
                v-else-if="visibleOptions.length === 0"
                class="rounded-card border border-dashed border-border bg-surface-alt px-4 py-8 text-center"
              >
                <p class="font-display text-h4 text-ink">
                  No icons matched
                </p>
                <p class="mt-2 text-small text-ink-muted">
                  Try a shorter search term or use the custom name field below.
                </p>
              </div>

              <div v-else class="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                <button
                  v-for="option in visibleOptions"
                  :key="option.name"
                  type="button"
                  class="flex flex-col items-center gap-2 rounded-card border px-3 py-4 text-center transition-colors"
                  :class="
                    option.name === selectedIcon
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-surface hover:border-primary/40 hover:bg-surface-alt'
                  "
                  @click="selectIcon(option.name)"
                >
                  <span
                    class="flex size-11 items-center justify-center rounded-control border border-border bg-surface-alt text-current"
                    :class="option.name === selectedIcon ? 'text-primary' : 'text-ink'"
                  >
                    <Icon :name="option.name" class="size-5" aria-hidden="true" />
                  </span>
                  <span class="w-full truncate text-small font-semibold">
                    {{ option.label }}
                  </span>
                  <span class="w-full truncate text-caption text-ink-muted">
                    {{ option.name }}
                  </span>
                </button>
              </div>
            </div>

            <div class="border-t border-border px-5 py-4 sm:px-6">
              <div class="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                <label class="block">
                  <span class="mb-2 block text-small font-semibold text-ink">
                    Custom icon name
                  </span>
                  <input
                    v-model="customIconName"
                    type="text"
                    class="w-full rounded-card border border-border bg-surface px-3 py-2.5 text-body text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-primary"
                    :placeholder="`${collectionPrefix}:users`"
                    @keydown.enter.prevent="applyCustomIcon"
                  />
                </label>

                <button
                  type="button"
                  class="rounded-control bg-primary px-4 py-2.5 text-small font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
                  :disabled="!customIconName.trim()"
                  @click="applyCustomIcon"
                >
                  Use icon
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

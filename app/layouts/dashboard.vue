<script setup lang="ts">
const { me, load, hasRole, isSuperAdmin, reset } = useDashboardRoles();
const dashboardImages = useHospitalMedia();

await load();

const sections = useDashboardSections();
const visibleSections = computed(() =>
  sections.filter((section) => section.roles.some((role) => hasRole(role))),
);

const primarySection = computed(() => visibleSections.value[0]);
const route = useRoute();
const router = useRouter();
const supabase = useSupabaseClient();

const isSidebarOpen = ref(false);
const isUserMenuOpen = ref(false);
const userMenuRef = ref<HTMLElement | null>(null);

const userDisplayName = computed(
  () => me.value?.profile?.full_name?.trim() || "Staff member",
);

const userInitials = computed(() => {
  const name = me.value?.profile?.full_name?.trim();

  if (!name) return "SM";

  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
});

function closeSidebar() {
  isSidebarOpen.value = false;
}

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value;
  isUserMenuOpen.value = false;
}

function closeUserMenu() {
  isUserMenuOpen.value = false;
}

function toggleUserMenu() {
  isUserMenuOpen.value = !isUserMenuOpen.value;
  isSidebarOpen.value = false;
}

watch(
  () => route.fullPath,
  () => {
    isSidebarOpen.value = false;
    isUserMenuOpen.value = false;
  },
);

onClickOutside(userMenuRef, closeUserMenu);

async function handleSignOut() {
  closeUserMenu();
  isSidebarOpen.value = false;
  await supabase.auth.signOut();
  reset();
  await router.push("/dashboard/login");
}
</script>

<template>
  <div
    class="relative h-dvh overflow-hidden bg-surface-alt text-ink lg:grid lg:grid-cols-[18rem_minmax(0,1fr)]"
  >
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isSidebarOpen"
        class="fixed inset-0 z-40 bg-ink/50 lg:hidden"
        aria-hidden="true"
        @click="closeSidebar"
      />
    </Transition>

    <aside
      id="dashboard-sidebar"
      class="fixed inset-y-0 left-0 z-50 flex w-80 max-w-[85vw] transform flex-col border-r border-border bg-primary-dark text-white shadow-2xl transition-transform duration-200 lg:static lg:z-auto lg:w-full lg:max-w-none lg:translate-x-0 lg:shadow-none"
      :class="
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      "
      aria-label="Dashboard navigation"
    >
      <div class="flex items-start justify-between gap-3 px-4 py-5 sm:px-6">
        <NuxtLink
          to="/dashboard"
          class="flex items-center gap-3"
          @click="closeSidebar"
        >
          <img
            src="/logo.jpg"
            alt="MeTRH logo"
            class="size-10 rounded-control bg-white object-cover"
          />
          <div>
            <p class="font-display font-semibold text-h4 leading-none">
              MeTRH Dashboard
            </p>
            <p class="mt-1 text-caption text-white/70">
              Staff tools and content management
            </p>
          </div>
        </NuxtLink>

        <button
          type="button"
          class="rounded-control border border-white/15 p-2 text-white hover:bg-white/10 lg:hidden"
          aria-label="Close navigation"
          @click="closeSidebar"
        >
          <Icon name="lucide:x" class="size-5" aria-hidden="true" />
        </button>
      </div>

      <nav class="flex-1 overflow-y-auto px-3 py-4 sm:px-4">
        <NuxtLink
          to="/dashboard"
          class="mb-2 flex items-center gap-3 rounded-control px-3 py-2.5 text-small font-medium text-white/90 hover:bg-white/10"
          active-class="bg-white/10 text-white"
          exact-active-class="bg-white/10 text-white"
          @click="closeSidebar"
        >
          <Icon name="lucide:layout-dashboard" class="size-4" />
          Overview
        </NuxtLink>

        <div
          class="mb-2 mt-4 px-3 text-caption uppercase tracking-wide text-white/50"
        >
          Sections
        </div>
        <ul class="space-y-1">
          <li v-for="section in visibleSections" :key="section.id">
            <NuxtLink
              :to="section.to"
              class="flex items-center gap-3 rounded-control px-3 py-2.5 text-small font-medium text-white/90 hover:bg-white/10"
              active-class="bg-white/10 text-white"
              @click="closeSidebar"
            >
              <Icon :name="section.icon" class="size-4" />
              {{ section.label }}
            </NuxtLink>
          </li>
        </ul>
      </nav>
    </aside>

    <div class="flex min-w-0 min-h-0 flex-1 flex-col lg:col-start-2">
      <header
        class="shrink-0 border-b border-border bg-surface/95 backdrop-blur"
      >
        <div
          class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8"
        >
          <div class="flex min-w-0 items-center gap-3">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-control border border-border bg-white p-2 text-ink hover:bg-surface-alt lg:hidden"
              :aria-expanded="isSidebarOpen"
              aria-controls="dashboard-sidebar"
              aria-label="Open navigation menu"
              @click="toggleSidebar"
            >
              <Icon name="lucide:menu" class="size-5" aria-hidden="true" />
            </button>

            <div class="min-w-0">
              <p class="text-caption uppercase tracking-wide text-ink-muted">
                Staff area
              </p>
              <h1 class="truncate font-display font-semibold text-h3 text-ink">
                {{ primarySection ? primarySection.label : "Overview" }}
              </h1>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div ref="userMenuRef" class="relative">
              <button
                type="button"
                class="inline-flex items-center gap-3 rounded-control border border-border bg-white px-3 py-2 text-small font-semibold text-ink hover:bg-surface-alt"
                :aria-expanded="isUserMenuOpen"
                aria-haspopup="menu"
                @click="toggleUserMenu"
              >
                <span
                  class="flex size-8 items-center justify-center rounded-full bg-primary/10 text-caption font-bold uppercase text-primary"
                >
                  {{ userInitials }}
                </span>
                <span class="max-w-40 truncate">
                  {{ userDisplayName }}
                </span>
                <Icon
                  name="lucide:chevron-down"
                  class="size-4 text-ink-muted"
                  aria-hidden="true"
                />
              </button>

              <Transition
                enter-active-class="transition duration-150 ease-out"
                enter-from-class="opacity-0 translate-y-1 scale-95"
                enter-to-class="opacity-100 translate-y-0 scale-100"
                leave-active-class="transition duration-100 ease-in"
                leave-from-class="opacity-100 translate-y-0 scale-100"
                leave-to-class="opacity-0 translate-y-1 scale-95"
              >
                <div
                  v-if="isUserMenuOpen"
                  class="absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-card border border-border bg-white shadow-elevated"
                  role="menu"
                >
                  <div class="border-b border-border px-4 py-3">
                    <p class="truncate font-medium text-ink">
                      {{ userDisplayName }}
                    </p>
                    <p
                      v-if="me?.profile?.job_title"
                      class="mt-1 truncate text-caption text-ink-muted"
                    >
                      {{ me.profile.job_title }}
                    </p>
                    <div class="mt-3 flex flex-wrap gap-2">
                      <span
                        v-for="role in me?.roles || []"
                        :key="role"
                        class="rounded-full bg-surface-alt px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-ink-muted"
                      >
                        {{ role }}
                      </span>
                    </div>
                  </div>

                  <div class="py-2">
                    <NuxtLink
                      to="/dashboard/profile"
                      class="flex items-center gap-3 px-4 py-2.5 text-small text-ink hover:bg-surface-alt"
                      role="menuitem"
                      @click="closeUserMenu"
                    >
                      <Icon name="lucide:user" class="size-4 text-ink-muted" />
                      Profile
                    </NuxtLink>

                    <NuxtLink
                      v-if="isSuperAdmin"
                      to="/dashboard/settings"
                      class="flex items-center gap-3 px-4 py-2.5 text-small text-ink hover:bg-surface-alt"
                      role="menuitem"
                      @click="closeUserMenu"
                    >
                      <Icon
                        name="lucide:settings-2"
                        class="size-4 text-ink-muted"
                      />
                      Settings
                    </NuxtLink>

                    <button
                      type="button"
                      class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-small text-ink hover:bg-surface-alt"
                      role="menuitem"
                      @click="handleSignOut"
                    >
                      <Icon
                        name="lucide:log-out"
                        class="size-4 text-ink-muted"
                      />
                      Sign out
                    </button>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </header>

      <main class="min-h-0 flex-1 overflow-y-auto">
        <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

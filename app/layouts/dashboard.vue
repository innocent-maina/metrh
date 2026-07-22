<script setup lang="ts">
const { me, load, hasRole, isSuperAdmin, reset } = useDashboardRoles();
const dashboardImages = useHospitalMedia();

await load();

const sections = useDashboardSections();
const visibleSections = computed(() =>
  sections.filter((section) => section.roles.some((role) => hasRole(role))),
);

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

const currentSection = computed(() => {
  const path = route.path;
  return (
    visibleSections.value.find(
      (section) => path === section.to || path.startsWith(`${section.to}/`),
    ) ?? null
  );
});

const analyticsNav = {
  label: "Analytics",
  to: "/dashboard/analytics",
  icon: "lucide:chart-column",
};

const isAnalyticsActive = computed(() => {
  const path = route.path;
  return path === analyticsNav.to || path.startsWith(`${analyticsNav.to}/`);
});

const currentDashboardLabel = computed(
  () =>
    currentChildSection.value?.label ||
    currentSection.value?.label ||
    (isAnalyticsActive.value ? analyticsNav.label : null) ||
    "Overview",
);

const currentChildSection = computed(() => {
  const section = currentSection.value;
  if (!section?.children?.length) return null;

  const path = route.path;
  return (
    section.children.find(
      (child) => path === child.to || path.startsWith(`${child.to}/`),
    ) ?? null
  );
});

function isSectionActive(section: { to: string }) {
  const path = route.path;
  return path === section.to || path.startsWith(`${section.to}/`);
}

function isChildActive(child: { to: string }) {
  const path = route.path;
  return path === child.to || path.startsWith(`${child.to}/`);
}

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
    class="relative min-h-dvh overflow-x-hidden bg-surface-alt text-ink lg:grid lg:h-dvh lg:grid-cols-[18rem_minmax(0,1fr)] lg:overflow-hidden"
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
      class="fixed inset-y-0 left-0 z-50 flex h-dvh min-h-0 w-full max-w-none transform flex-col overflow-hidden border-r border-border bg-primary-dark text-white shadow-2xl transition-transform duration-200 sm:w-80 sm:max-w-[85vw] lg:static lg:z-auto lg:h-auto lg:w-full lg:max-w-none lg:translate-x-0 lg:shadow-none"
      :class="
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      "
      aria-label="Dashboard navigation"
    >
      <div
        class="sticky top-0 z-10 border-b border-white/10 bg-primary-dark/95 px-4 py-4 backdrop-blur sm:px-6 lg:static lg:border-b-0 lg:bg-transparent lg:px-4 lg:py-5 lg:backdrop-blur-0"
      >
        <div class="flex items-start justify-between gap-3">
          <NuxtLink
            to="/dashboard"
            class="flex min-w-0 items-center gap-3"
            @click="closeSidebar"
          >
            <img
              src="/logo2.png"
              alt="MeTRH logo"
              class="size-9 rounded-control bg-transparent object-contain sm:size-10"
            />
            <div class="min-w-0">
              <p
                class="truncate font-display font-semibold text-h4 leading-none"
              >
                MeTRH Dashboard
              </p>
              <p class="mt-1 hidden text-caption text-white/70 sm:block">
                Staff tools and content management
              </p>
            </div>
          </NuxtLink>

          <button
            type="button"
            class="shrink-0 rounded-control border border-surface/15 p-2 text-white hover:bg-surface/10 lg:hidden"
            aria-label="Close navigation"
            @click="closeSidebar"
          >
            <Icon name="lucide:x" class="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <nav
        class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-4 lg:py-5"
      >
        <NuxtLink
          to="/dashboard"
          class="mb-2 flex items-center gap-3 rounded-control px-3 py-3 text-small font-medium text-white/90 hover:bg-surface/10"
          active-class="bg-surface/10 text-white"
          exact-active-class="bg-surface/10 text-white"
          @click="closeSidebar"
        >
          <Icon name="lucide:layout-dashboard" class="size-4" />
          Overview
        </NuxtLink>

        <NuxtLink
          :to="analyticsNav.to"
          class="mb-4 flex items-center gap-3 rounded-control px-3 py-3 text-small font-medium"
          :class="
            isAnalyticsActive
              ? 'bg-surface/10 text-white'
              : 'text-white/90 hover:bg-surface/10'
          "
          @click="closeSidebar"
        >
          <Icon :name="analyticsNav.icon" class="size-4" />
          {{ analyticsNav.label }}
        </NuxtLink>

        <ul class="space-y-1">
          <li v-for="section in visibleSections" :key="section.id">
            <NuxtLink
              :to="section.to"
              class="flex items-center gap-3 rounded-control px-3 py-3 text-small font-medium"
              :class="
                isSectionActive(section)
                  ? 'bg-surface/10 text-white'
                  : 'text-white/90 hover:bg-surface/10'
              "
              @click="closeSidebar"
            >
              <Icon :name="section.icon" class="size-4" />
              <span class="min-w-0 flex-1">{{ section.label }}</span>
              <Icon
                v-if="section.children?.length"
                name="lucide:chevron-down"
                class="size-4 shrink-0 transition-transform duration-200"
                :class="isSectionActive(section) ? 'rotate-180' : ''"
                aria-hidden="true"
              />
            </NuxtLink>

            <ul
              v-if="section.children?.length && isSectionActive(section)"
              class="mt-2 space-y-1 pl-5"
            >
              <li v-for="child in section.children" :key="child.id">
                <NuxtLink
                  :to="child.to"
                  class="block rounded-control px-3 py-2.5 text-caption font-medium"
                  :class="
                    isChildActive(child)
                      ? 'bg-surface/10 text-white'
                      : 'text-white/70 hover:bg-surface/10 hover:text-white'
                  "
                  @click="closeSidebar"
                >
                  {{ child.label }}
                </NuxtLink>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
    </aside>

    <div class="flex min-w-0 min-h-0 flex-1 flex-col lg:col-start-2">
      <header
        class="shrink-0 border-b border-border bg-surface/95 backdrop-blur"
      >
        <div
          class="mx-auto flex max-w-7xl flex-row items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-6 lg:px-8"
        >
          <div class="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <button
              type="button"
              class="inline-flex shrink-0 items-center justify-center rounded-control border border-border bg-surface p-2 text-ink hover:bg-surface-alt lg:hidden"
              :aria-expanded="isSidebarOpen"
              aria-controls="dashboard-sidebar"
              aria-label="Open navigation menu"
              @click="toggleSidebar"
            >
              <Icon name="lucide:menu" class="size-5" aria-hidden="true" />
            </button>

            <div class="min-w-0 flex-1">
              <p
                class="hidden text-caption uppercase tracking-wide text-ink-muted sm:block"
              >
                Staff area
              </p>
              <h1
                class="truncate font-display font-semibold text-[1.05rem] leading-tight text-ink sm:text-h3"
              >
                {{ currentDashboardLabel }}
              </h1>
            </div>
          </div>

          <div class="flex items-center gap-3 self-end sm:self-auto">
            <div ref="userMenuRef" class="relative">
              <button
                type="button"
                class="inline-flex items-center gap-3 rounded-control border border-border bg-surface px-2 py-2 text-small font-semibold text-ink hover:bg-surface-alt sm:px-3"
                :aria-expanded="isUserMenuOpen"
                aria-haspopup="menu"
                @click="toggleUserMenu"
              >
                <span
                  class="flex size-8 items-center justify-center rounded-full bg-primary/10 text-caption font-bold uppercase text-primary"
                >
                  {{ userInitials }}
                </span>
                <span class="hidden max-w-40 truncate sm:block">
                  {{ userDisplayName }}
                </span>
                <Icon
                  name="lucide:chevron-down"
                  class="hidden size-4 text-ink-muted sm:block"
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
                  class="absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-card border border-border bg-surface shadow-elevated"
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

      <main class="min-h-0 flex-1 overflow-visible lg:overflow-y-auto">
        <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

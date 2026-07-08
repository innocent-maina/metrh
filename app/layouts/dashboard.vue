<script setup lang="ts">
const { me, load, hasRole, isSuperAdmin, reset } = useDashboardRoles();

await load();

const sections = useDashboardSections();
const visibleSections = computed(() =>
  sections.filter((section) => section.roles.some((role) => hasRole(role))),
);

const primarySection = computed(() => visibleSections.value[0]);
const router = useRouter();
const supabase = useSupabaseClient();

async function handleSignOut() {
  await supabase.auth.signOut();
  reset();
  await router.push("/dashboard/login");
}
</script>

<template>
  <div class="min-h-screen bg-surface-alt text-ink lg:grid lg:grid-cols-[18rem_minmax(0,1fr)]">
    <aside class="border-b border-border bg-primary-dark text-white lg:border-b-0 lg:border-r lg:border-white/10">
      <div class="px-4 py-5 sm:px-6">
        <NuxtLink to="/dashboard" class="flex items-center gap-3">
          <span class="flex size-10 items-center justify-center rounded-control bg-white text-primary-dark font-display font-bold">
            M
          </span>
          <div>
            <p class="font-display font-semibold text-h4 leading-none">
              MeTRH Dashboard
            </p>
            <p class="mt-1 text-caption text-white/70">
              Staff tools and content management
            </p>
          </div>
        </NuxtLink>
      </div>

      <div class="border-t border-white/10 px-4 py-4 sm:px-6">
        <p class="text-caption uppercase tracking-wide text-white/50">
          Signed in as
        </p>
        <p class="mt-1 font-semibold text-white">
          {{ me?.profile?.full_name || "Hospital staff" }}
        </p>
        <p class="text-small text-white/70">
          {{ me?.profile?.job_title || "Dashboard access" }}
        </p>
      </div>

      <nav class="px-3 py-4 sm:px-4">
        <NuxtLink
          to="/dashboard"
          class="mb-2 flex items-center gap-3 rounded-control px-3 py-2.5 text-small font-medium text-white/90 hover:bg-white/10"
          active-class="bg-white/10 text-white"
          exact-active-class="bg-white/10 text-white"
        >
          <Icon name="lucide:layout-dashboard" class="size-4" />
          Overview
        </NuxtLink>

        <div class="mb-2 mt-4 px-3 text-caption uppercase tracking-wide text-white/50">
          Sections
        </div>
        <ul class="space-y-1">
          <li v-for="section in visibleSections" :key="section.id">
            <NuxtLink
              :to="section.to"
              class="flex items-center gap-3 rounded-control px-3 py-2.5 text-small font-medium text-white/90 hover:bg-white/10"
              active-class="bg-white/10 text-white"
            >
              <Icon :name="section.icon" class="size-4" />
              {{ section.label }}
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <div class="border-t border-white/10 px-4 py-4 sm:px-6">
        <button
          type="button"
          class="w-full rounded-control border border-white/15 px-3 py-2.5 text-small font-semibold text-white hover:bg-white/10"
          @click="handleSignOut"
        >
          Sign out
        </button>
      </div>
    </aside>

    <div class="min-w-0">
      <header class="border-b border-border bg-surface/95 backdrop-blur">
        <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p class="text-caption uppercase tracking-wide text-ink-muted">
              Staff area
            </p>
            <h1 class="font-display font-semibold text-h3 text-ink">
              {{ primarySection ? primarySection.label : "Overview" }}
            </h1>
          </div>
          <div class="flex items-center gap-2">
            <span
              v-for="role in me?.roles || []"
              :key="role"
              class="rounded-full bg-surface-alt px-3 py-1.5 text-caption font-semibold uppercase tracking-wide text-ink-muted"
            >
              {{ role }}
            </span>
            <span
              v-if="isSuperAdmin"
              class="rounded-full bg-accent/10 px-3 py-1.5 text-caption font-semibold uppercase tracking-wide text-accent"
            >
              super_admin
            </span>
          </div>
        </div>
      </header>

      <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <slot />
      </main>
    </div>
  </div>
</template>

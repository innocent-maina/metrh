<script setup lang="ts">
definePageMeta({ layout: "dashboard" });

const route = useRoute();
const sections = useDashboardSections();
const currentSection = computed(() =>
  sections.find((section) => section.id === route.params.section),
);

if (!currentSection.value) {
  throw createError({ statusCode: 404, statusMessage: "Dashboard section not found." });
}

const { hasRole, isSuperAdmin } = useDashboardRoles();
const canAccess = computed(() =>
  currentSection.value
    ? currentSection.value.roles.some((role) => hasRole(role)) || isSuperAdmin.value
    : false,
);

if (!canAccess.value) {
  await navigateTo("/dashboard/unauthorized");
}

useSeoMeta({
  title: () => `${currentSection.value?.label} — MeTRH Dashboard`,
  description: () => currentSection.value?.description,
});
</script>

<template>
  <div v-if="currentSection" class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
    <section class="rounded-card border border-border bg-white p-6 md:p-8 shadow-card">
      <p class="text-small font-semibold uppercase tracking-wide text-info">
        {{ currentSection.label }}
      </p>
      <h2 class="mt-2 font-display font-bold text-h1 text-ink">
        {{ currentSection.description }}
      </h2>
      <p class="mt-4 text-body text-ink-muted">
        The role-aware shell is in place for this section. The next pass will
        replace this placeholder with the full list, filter, pagination, and
        edit form workflow.
      </p>

      <div class="mt-6 rounded-card border border-dashed border-border bg-surface-alt p-5">
        <p class="text-small font-semibold uppercase tracking-wide text-info">
          Managed by
        </p>
        <ul class="mt-3 flex flex-wrap gap-2">
          <li
            v-for="role in currentSection.roles"
            :key="role"
            class="rounded-full bg-white px-3 py-1.5 text-caption font-semibold uppercase tracking-wide text-ink-muted"
          >
            {{ role }}
          </li>
        </ul>
      </div>
    </section>

    <aside class="space-y-4">
      <div class="rounded-card border border-border bg-white p-5">
        <p class="text-small font-semibold uppercase tracking-wide text-info">
          Expected tools
        </p>
        <ul class="mt-4 space-y-2 text-small text-ink-muted">
          <li>Search, filter, sort, and pagination.</li>
          <li>Clear save/cancel actions.</li>
          <li>Honest toasts and validation.</li>
          <li>Server-side writes only.</li>
        </ul>
      </div>

      <div class="rounded-card border border-border bg-primary-dark p-5 text-white">
        <p class="text-small font-semibold uppercase tracking-wide text-accent">
          Role check
        </p>
        <p class="mt-3 text-small text-white/80">
          This section is visible because the current account has one of the
          required roles.
        </p>
      </div>
    </aside>
  </div>
</template>

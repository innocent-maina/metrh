<script setup lang="ts">
definePageMeta({ layout: "dashboard" });

const { me, hasRole, isSuperAdmin } = useDashboardRoles();
const supabase = useSupabaseClient();

const canReadContacts = computed(
  () =>
    hasRole("front_desk") || hasRole("content_editor") || isSuperAdmin.value,
);
const canReadCareers = computed(
  () => hasRole("hr_manager") || isSuperAdmin.value,
);
const canReadProcurement = computed(
  () => hasRole("procurement_manager") || isSuperAdmin.value,
);
const canEditContent = computed(
  () => hasRole("content_editor") || isSuperAdmin.value,
);

const { data: contactCount } = await useAsyncData(
  "dashboard-contact-count",
  async () => {
    if (!canReadContacts.value) return null;
    try {
      const { count, error } = await supabase
        .from("contact_submissions")
        .select("id", { count: "exact", head: true });

      if (error) {
        console.warn("Unable to load contact submission count:", error.message);
        return null;
      }

      return count ?? 0;
    } catch (error) {
      console.warn("Unable to load contact submission count:", error);
      return null;
    }
  },
  { default: () => null },
);

const { data: openJobsCount } = await useAsyncData(
  "dashboard-open-jobs-count",
  async () => {
    if (!canReadCareers.value) return null;
    try {
      const { count, error } = await supabase
        .from("job_postings")
        .select("id", { count: "exact", head: true })
        .eq("status", "open");

      if (error) {
        console.warn("Unable to load open jobs count:", error.message);
        return null;
      }

      return count ?? 0;
    } catch (error) {
      console.warn("Unable to load open jobs count:", error);
      return null;
    }
  },
  { default: () => null },
);

const { data: openTendersCount } = await useAsyncData(
  "dashboard-open-tenders-count",
  async () => {
    if (!canReadProcurement.value) return null;
    try {
      const { count, error } = await supabase
        .from("tenders")
        .select("id", { count: "exact", head: true })
        .neq("status", "draft");

      if (error) {
        console.warn("Unable to load open tenders count:", error.message);
        return null;
      }

      return count ?? 0;
    } catch (error) {
      console.warn("Unable to load open tenders count:", error);
      return null;
    }
  },
  { default: () => null },
);

const quickLinks = computed(() => {
  const sections = useDashboardSections();
  return sections.filter((section) =>
    section.roles.some((role) => hasRole(role)),
  );
});

const dashboardImages = useHospitalMedia();
</script>

<template>
  <div class="space-y-8">
    <section
      class="rounded-card border border-border bg-white p-6 md:p-8 shadow-card"
    >
      <div class="max-w-3xl">
        <p class="text-small font-semibold uppercase tracking-wide text-info">
          Dashboard overview
        </p>
        <h2 class="mt-2 font-display font-bold text-h1 text-ink">
          Welcome back, {{ me?.profile?.full_name || "staff member" }}
        </h2>
        <p class="mt-4 text-body text-ink-muted">
          Use the role-aware links below to edit the areas this account is
          allowed to manage. All writes remain server-side.
        </p>
      </div>
    </section>

    <section class="grid gap-4 md:grid-cols-3">
      <div
        v-if="contactCount !== null"
        class="rounded-card border border-border bg-white p-5"
      >
        <p
          class="text-caption font-semibold uppercase tracking-wide text-ink-muted"
        >
          Contact submissions
        </p>
        <p class="mt-2 tabular-nums text-h2 text-primary">
          {{ contactCount }}
        </p>
      </div>
      <div
        v-if="openJobsCount !== null"
        class="rounded-card border border-border bg-white p-5"
      >
        <p
          class="text-caption font-semibold uppercase tracking-wide text-ink-muted"
        >
          Open jobs
        </p>
        <p class="mt-2 tabular-nums text-h2 text-primary">
          {{ openJobsCount }}
        </p>
      </div>
      <div
        v-if="openTendersCount !== null"
        class="rounded-card border border-border bg-white p-5"
      >
        <p
          class="text-caption font-semibold uppercase tracking-wide text-ink-muted"
        >
          Active tenders
        </p>
        <p class="mt-2 tabular-nums text-h2 text-primary">
          {{ openTendersCount }}
        </p>
      </div>
    </section>

    <section class="rounded-card border border-border bg-white p-6 shadow-card">
      <h3 class="font-display font-semibold text-h3 text-ink">Quick links</h3>
      <div class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <NuxtLink
          v-for="section in quickLinks"
          :key="section.id"
          :to="section.to"
          class="rounded-card border border-border bg-surface-alt p-5 hover:border-primary/30 hover:bg-surface transition-colors"
        >
          <div class="flex items-start gap-3">
            <span
              class="flex size-10 shrink-0 items-center justify-center rounded-control bg-primary/10 text-primary"
            >
              <Icon :name="section.icon" class="size-5" />
            </span>
            <div>
              <p class="font-display font-semibold text-h4 text-ink">
                {{ section.label }}
              </p>
              <p class="mt-1 text-small text-ink-muted">
                {{ section.description }}
              </p>
            </div>
          </div>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

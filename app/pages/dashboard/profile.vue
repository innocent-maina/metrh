<script setup lang="ts">
definePageMeta({ layout: "dashboard" });

const { me } = useDashboardRoles();
const supabase = useSupabaseClient();

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

function resolveMediaUrl(value: string | null) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return value;

  return supabase.storage.from("media").getPublicUrl(value).data.publicUrl;
}
</script>

<template>
  <div class="space-y-8">
    <section class="rounded-card border border-border bg-white p-6 shadow-card">
      <div class="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div
          class="flex size-16 items-center justify-center rounded-full bg-primary/10 text-h3 font-bold uppercase text-primary"
        >
          {{ userInitials }}
        </div>

        <div class="min-w-0">
          <p class="text-small font-semibold uppercase tracking-wide text-info">
            Profile
          </p>
          <h2 class="mt-2 font-display font-bold text-h1 text-ink">
            {{ userDisplayName }}
          </h2>
          <p class="mt-3 text-body text-ink-muted">
            Review the account details attached to this dashboard session.
          </p>
        </div>
      </div>
    </section>

    <section class="grid gap-4 md:grid-cols-4">
      <div class="rounded-card border border-border bg-white p-5">
        <p class="text-caption font-semibold uppercase tracking-wide text-ink-muted">
          Full name
        </p>
        <p class="mt-2 text-body font-medium text-ink">
          {{ me?.profile?.full_name || "Not set" }}
        </p>
      </div>

      <div class="rounded-card border border-border bg-white p-5">
        <p class="text-caption font-semibold uppercase tracking-wide text-ink-muted">
          Email
        </p>
        <p class="mt-2 text-body font-medium text-ink break-words">
          {{ me?.profile?.email || "Not set" }}
        </p>
      </div>

      <div class="rounded-card border border-border bg-white p-5">
        <p class="text-caption font-semibold uppercase tracking-wide text-ink-muted">
          Job title
        </p>
        <p class="mt-2 text-body font-medium text-ink">
          {{ me?.profile?.job_title || "Not set" }}
        </p>
      </div>

      <div class="rounded-card border border-border bg-white p-5">
        <p class="text-caption font-semibold uppercase tracking-wide text-ink-muted">
          Account status
        </p>
        <p class="mt-2 text-body font-medium text-ink">
          {{ me?.profile?.is_active ? "Active" : "Inactive" }}
        </p>
      </div>
    </section>

    <section class="rounded-card border border-border bg-white p-6 shadow-card">
      <h3 class="font-display font-semibold text-h3 text-ink">Access</h3>
      <div class="mt-5 flex flex-wrap gap-2">
        <span
          v-for="role in me?.roles || []"
          :key="role"
          class="rounded-full bg-surface-alt px-3 py-1.5 text-caption font-semibold uppercase tracking-wide text-ink-muted"
        >
          {{ role }}
        </span>
      </div>
      <p class="mt-4 text-body text-ink-muted">
        Dashboard access is still governed by server-side role checks.
      </p>
    </section>

    <section class="rounded-card border border-border bg-white p-6 shadow-card">
      <h3 class="font-display font-semibold text-h3 text-ink">Profile details</h3>
      <dl class="mt-5 grid gap-4 md:grid-cols-2">
        <div class="rounded-card border border-border bg-surface-alt p-4">
          <dt class="text-caption font-semibold uppercase tracking-wide text-ink-muted">
            Profile ID
          </dt>
          <dd class="mt-2 break-all text-body font-medium text-ink">
            {{ me?.profile?.id || "Not set" }}
          </dd>
        </div>

        <div class="rounded-card border border-border bg-surface-alt p-4">
          <dt class="text-caption font-semibold uppercase tracking-wide text-ink-muted">
            Avatar
          </dt>
          <dd class="mt-2">
            <img
              v-if="me?.profile?.avatar_url"
              :src="resolveMediaUrl(me.profile.avatar_url)"
              :alt="`${userDisplayName} avatar`"
              class="size-16 rounded-full border border-border object-cover"
            />
            <p v-else class="text-body font-medium text-ink">
              Not set
            </p>
          </dd>
        </div>
      </dl>
    </section>
  </div>
</template>

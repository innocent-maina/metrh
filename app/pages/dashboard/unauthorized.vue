<script setup lang="ts">
definePageMeta({ layout: "auth" });
useHead({ title: "No access yet — MeTRH Staff" });

const supabase = useSupabaseClient();
const router = useRouter();

async function handleSignOut() {
  await supabase.auth.signOut();
  router.push("/dashboard/login");
}
</script>

<template>
  <div class="text-center">
    <div
      class="mx-auto flex size-12 items-center justify-center rounded-full bg-warning/10 text-warning"
    >
      <Icon name="lucide:shield-alert" class="size-6" />
    </div>
    <h1 class="font-display font-semibold text-h3 text-ink mt-4">
      No access yet
    </h1>
    <p class="text-small text-ink-muted mt-2">
      Your account is signed in but doesn't have a dashboard role assigned. Ask
      a super admin to grant access from the staff profile.
    </p>
    <button
      type="button"
      class="mt-6 w-full rounded-control border border-border px-4 py-2.5 text-small font-semibold text-ink hover:bg-surface-alt transition-colors"
      @click="handleSignOut"
    >
      Sign out
    </button>
  </div>
</template>

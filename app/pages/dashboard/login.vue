<script setup lang="ts">
definePageMeta({ layout: "auth" });
useHead({ title: "Staff sign in — MeTRH" });

const supabase = useSupabaseClient();
const router = useRouter();
const route = useRoute();

const email = ref("");
const password = ref("");
const isSubmitting = ref(false);
const errorMessage = ref("");

async function handleSubmit() {
  errorMessage.value = "";
  isSubmitting.value = true;

  const { error } = await supabase.auth.signInWithPassword({
    email: email.value.trim(),
    password: password.value,
  });

  isSubmitting.value = false;

  if (error) {
    errorMessage.value =
      error.message === "Invalid login credentials"
        ? "Incorrect email or password."
        : error.message;
    return;
  }

  const redirectTo =
    typeof route.query.redirect === "string"
      ? route.query.redirect
      : "/dashboard";
  router.push(redirectTo);
}
</script>

<template>
  <div>
    <h1 class="font-display font-semibold text-h3 text-ink">Sign in</h1>
    <p class="text-small text-ink-muted mt-1">
      Use your staff account to access the dashboard.
    </p>

    <form class="mt-6 space-y-4" @submit.prevent="handleSubmit">
      <div>
        <label for="email" class="block text-small font-medium text-ink mb-1.5"
          >Email</label
        >
        <input
          id="email"
          v-model="email"
          type="email"
          autocomplete="email"
          required
          class="w-full rounded-control border border-border px-3 py-2 text-body text-ink focus:border-primary"
        />
      </div>

      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label for="password" class="block text-small font-medium text-ink"
            >Password</label
          >
          <NuxtLink
            to="/dashboard/forgot-password"
            class="text-caption text-primary hover:underline"
          >
            Forgot password?
          </NuxtLink>
        </div>
        <input
          id="password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
          class="w-full rounded-control border border-border px-3 py-2 text-body text-ink focus:border-primary"
        />
      </div>

      <p v-if="errorMessage" role="alert" class="text-small text-danger">
        {{ errorMessage }}
      </p>

      <button
        type="submit"
        :disabled="isSubmitting"
        class="w-full rounded-control bg-primary px-4 py-2.5 text-small font-semibold text-white hover:bg-primary-dark transition-colors disabled:opacity-60"
      >
        {{ isSubmitting ? "Signing in…" : "Sign in" }}
      </button>
    </form>

    <p class="mt-6 text-caption text-ink-muted text-center">
      Don't have an account? Accounts are set up by a hospital administrator —
      contact your super admin for an invite.
    </p>
  </div>
</template>

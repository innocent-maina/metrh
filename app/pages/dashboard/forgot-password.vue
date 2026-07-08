<script setup lang="ts">
definePageMeta({ layout: "auth" });
useHead({ title: "Reset password — MeTRH Staff" });

const supabase = useSupabaseClient();
const config = useRuntimeConfig();

const email = ref("");
const isSubmitting = ref(false);
const errorMessage = ref("");
const isSent = ref(false);

async function handleSubmit() {
  errorMessage.value = "";
  isSubmitting.value = true;

  const { error } = await supabase.auth.resetPasswordForEmail(
    email.value.trim(),
    {
      redirectTo: `${config.public.siteUrl}/dashboard/confirm`,
    },
  );

  isSubmitting.value = false;

  if (error) {
    errorMessage.value = error.message;
    return;
  }

  isSent.value = true;
}
</script>

<template>
  <div>
    <template v-if="!isSent">
      <h1 class="font-display font-semibold text-h3 text-ink">
        Reset your password
      </h1>
      <p class="text-small text-ink-muted mt-1">
        Enter your staff email and we'll send a link to set a new password.
      </p>

      <form class="mt-6 space-y-4" @submit.prevent="handleSubmit">
        <div>
          <label
            for="email"
            class="block text-small font-medium text-ink mb-1.5"
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

        <p v-if="errorMessage" role="alert" class="text-small text-danger">
          {{ errorMessage }}
        </p>

        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full rounded-control bg-primary px-4 py-2.5 text-small font-semibold text-white hover:bg-primary-dark transition-colors disabled:opacity-60"
        >
          {{ isSubmitting ? "Sending…" : "Send reset link" }}
        </button>
      </form>
    </template>

    <template v-else>
      <h1 class="font-display font-semibold text-h3 text-ink">
        Check your email
      </h1>
      <p class="text-small text-ink-muted mt-2">
        If an account exists for {{ email }}, a reset link is on its way.
      </p>
    </template>

    <p class="mt-6 text-caption text-center">
      <NuxtLink to="/dashboard/login" class="text-primary hover:underline"
        >Back to sign in</NuxtLink
      >
    </p>
  </div>
</template>

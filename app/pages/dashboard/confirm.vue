<script setup lang="ts">
definePageMeta({ layout: "auth" });
useHead({ title: "Set your password — MeTRH Staff" });

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const router = useRouter();

const password = ref("");
const confirmPassword = ref("");
const isSubmitting = ref(false);
const isCheckingSession = ref(true);
const errorMessage = ref("");

// The @nuxtjs/supabase module exchanges the invite/recovery token in the URL
// for a session automatically before this page's setup runs; `user` becomes
// reactive once that completes. If it never arrives, the link was invalid
// or expired.
onMounted(async () => {
  await supabase.auth.getSession();
  isCheckingSession.value = false;
});

const isSessionReady = computed(
  () => !isCheckingSession.value && !!user.value,
);

async function handleSubmit() {
  errorMessage.value = "";

  if (password.value.length < 8) {
    errorMessage.value = "Password must be at least 8 characters.";
    return;
  }
  if (password.value !== confirmPassword.value) {
    errorMessage.value = "Passwords do not match.";
    return;
  }

  isSubmitting.value = true;
  const { error } = await supabase.auth.updateUser({
    password: password.value,
  });
  isSubmitting.value = false;

  if (error) {
    errorMessage.value = error.message;
    return;
  }

  router.push("/dashboard");
}
</script>

<template>
  <div>
    <template v-if="isSessionReady">
      <h1 class="font-display font-semibold text-h3 text-ink">
        Set your password
      </h1>
      <p class="text-small text-ink-muted mt-1">
        Choose a password for your MeTRH staff account.
      </p>

      <form class="mt-6 space-y-4" @submit.prevent="handleSubmit">
        <div>
          <label
            for="password"
            class="block text-small font-medium text-ink mb-1.5"
            >New password</label
          >
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="new-password"
            required
            class="w-full rounded-control border border-border px-3 py-2 text-body text-ink focus:border-primary"
          />
        </div>

        <div>
          <label
            for="confirm-password"
            class="block text-small font-medium text-ink mb-1.5"
            >Confirm password</label
          >
          <input
            id="confirm-password"
            v-model="confirmPassword"
            type="password"
            autocomplete="new-password"
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
          {{ isSubmitting ? "Saving…" : "Save password" }}
        </button>
      </form>
    </template>

    <template v-else-if="!isCheckingSession">
      <h1 class="font-display font-semibold text-h3 text-ink">Link expired</h1>
      <p class="text-small text-ink-muted mt-2">
        This invite or reset link is no longer valid. Request a new one below.
      </p>
      <NuxtLink
        to="/dashboard/forgot-password"
        class="mt-4 inline-block text-small font-medium text-primary hover:underline"
      >
        Request a new link
      </NuxtLink>
    </template>

    <template v-else>
      <h1 class="font-display font-semibold text-h3 text-ink">
        Checking link...
      </h1>
      <p class="text-small text-ink-muted mt-2">
        Verifying your reset link.
      </p>
    </template>
  </div>
</template>

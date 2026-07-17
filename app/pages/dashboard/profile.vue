<script setup lang="ts">
definePageMeta({ layout: "dashboard" });
useHead({ title: "Profile — MeTRH Dashboard" });

const { me, load, pending, error: dashboardError } = useDashboardRoles();
const resolveStorageUrl = usePublicStorageUrl();
const supabase = useSupabaseClient();

const activeTab = ref<"profile" | "security">("profile");
const isSavingProfile = ref(false);
const profileNotice = ref<string | null>(null);
const profileError = ref<string | null>(null);
const avatarUploadError = ref<string | null>(null);
const isUploadingAvatar = ref(false);
const avatarInput = ref<HTMLInputElement | null>(null);

const isUpdatingPassword = ref(false);
const passwordNotice = ref<string | null>(null);
const passwordError = ref<string | null>(null);
const passwordForm = reactive({
  password: "",
  confirmPassword: "",
});

const profileForm = reactive({
  full_name: "",
  email: "",
  phone: "",
  job_title: "",
  avatar_url: "",
});

const profile = computed(() => me.value?.profile ?? null);
const roles = computed(() => me.value?.roles ?? []);

await load();

function syncProfileForm(row: typeof profile.value) {
  profileForm.full_name = row?.full_name ?? "";
  profileForm.email = row?.email ?? "";
  profileForm.phone = row?.phone ?? "";
  profileForm.job_title = row?.job_title ?? "";
  profileForm.avatar_url = row?.avatar_url ?? "";
}

watch(
  profile,
  (row) => {
    if (!row) return;
    syncProfileForm(row);
  },
  { immediate: true },
);

const userDisplayName = computed(
  () => profile.value?.full_name?.trim() || "Staff member",
);

const userInitials = computed(() => {
  const name = profile.value?.full_name?.trim();

  if (!name) return "SM";

  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
});

const avatarPreviewUrl = computed(() =>
  resolveMediaUrl(profileForm.avatar_url || profile.value?.avatar_url || ""),
);

const memberSince = computed(() => {
  const createdAt = profile.value?.created_at;
  if (!createdAt) return "";

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
});

function resolveMediaUrl(value: string | null) {
  return resolveStorageUrl(value, "media");
}

function focusAvatarInput() {
  avatarInput.value?.click();
}

function clearAvatar() {
  profileForm.avatar_url = "";
  if (avatarInput.value) {
    avatarInput.value.value = "";
  }
}

async function handleAvatarChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0] ?? null;

  avatarUploadError.value = null;

  if (!file) return;

  isUploadingAvatar.value = true;

  try {
    const formData = new FormData();
    formData.append("bucket", "media");
    formData.append("folder", "profiles/avatars");
    formData.append("fileName", file.name);
    formData.append("file", file);

    const upload = await $fetch<{
      path: string;
      publicUrl: string | null;
    }>("/api/storage/dashboard/sign-upload", {
      method: "POST",
      body: formData,
    });

    profileForm.avatar_url = upload.publicUrl ?? upload.path;
    profileNotice.value =
      "Avatar uploaded. Save the profile to keep the change.";
  } catch (error) {
    avatarUploadError.value =
      error instanceof Error ? error.message : "Could not upload the avatar.";
    input.value = "";
  } finally {
    isUploadingAvatar.value = false;
  }
}

async function saveProfile() {
  profileError.value = null;
  profileNotice.value = null;

  const current = profile.value;
  if (!current) return;

  isSavingProfile.value = true;

  try {
    await $fetch("/api/dashboard/me", {
      method: "PATCH",
      body: {
        full_name: profileForm.full_name.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim(),
        job_title: profileForm.job_title.trim(),
        avatar_url: profileForm.avatar_url.trim(),
      },
    });

    await load(true);
    syncProfileForm(me.value?.profile ?? null);
    profileNotice.value = "Profile saved successfully.";
  } catch (error) {
    profileError.value =
      error instanceof Error ? error.message : "Could not save the profile.";
  } finally {
    isSavingProfile.value = false;
  }
}

async function updatePassword() {
  passwordError.value = null;
  passwordNotice.value = null;

  if (passwordForm.password.length < 8) {
    passwordError.value = "Password must be at least 8 characters.";
    return;
  }

  if (passwordForm.password !== passwordForm.confirmPassword) {
    passwordError.value = "Passwords do not match.";
    return;
  }

  isUpdatingPassword.value = true;

  const { error } = await supabase.auth.updateUser({
    password: passwordForm.password,
  });

  isUpdatingPassword.value = false;

  if (error) {
    passwordError.value = error.message;
    return;
  }

  passwordForm.password = "";
  passwordForm.confirmPassword = "";
  passwordNotice.value = "Password updated successfully.";
}

const tabButtonClasses = (tab: "profile" | "security") =>
  activeTab.value === tab
    ? "bg-primary text-white shadow-sm"
    : "text-ink-muted hover:bg-surface hover:text-ink";
</script>

<template>
  <div class="space-y-6">
    <section class="rounded-card border border-border bg-surface p-6 shadow-card">
      <div class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex items-center gap-4">
          <div
            class="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-h3 font-bold uppercase text-primary"
          >
            <img
              v-if="avatarPreviewUrl"
              :src="avatarPreviewUrl"
              :alt="`${userDisplayName} avatar`"
              class="size-full object-cover"
            />
            <span v-else>{{ userInitials }}</span>
          </div>

          <div class="min-w-0">
            <p class="text-small font-semibold uppercase tracking-wide text-info">
              Profile
            </p>
            <h2 class="mt-2 font-display font-bold text-h1 text-ink">
              {{ userDisplayName }}
            </h2>
            <p class="mt-3 max-w-2xl text-body text-ink-muted">
              Update your staff details and security settings from one place.
            </p>
          </div>
        </div>

        <div
          class="inline-flex rounded-control border border-border bg-surface-alt p-1"
          role="tablist"
          aria-label="Profile settings tabs"
        >
          <button
            type="button"
            role="tab"
            :aria-selected="activeTab === 'profile'"
            :class="tabButtonClasses('profile')"
            class="rounded-control px-4 py-2 text-small font-semibold transition-colors"
            @click="activeTab = 'profile'"
          >
            Profile
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="activeTab === 'security'"
            :class="tabButtonClasses('security')"
            class="rounded-control px-4 py-2 text-small font-semibold transition-colors"
            @click="activeTab = 'security'"
          >
            Security
          </button>
        </div>
      </div>
    </section>

    <div v-if="dashboardError" class="rounded-card border border-danger/30 bg-danger/5 px-4 py-3 text-small text-danger">
      {{ dashboardError }}
    </div>

    <section v-if="pending && !profile" class="rounded-card border border-border bg-surface p-6 text-small text-ink-muted shadow-card">
      Loading your profile...
    </section>

    <section v-else-if="profile" class="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.7fr)]">
      <div v-if="activeTab === 'profile'" class="space-y-6">
        <form class="rounded-card border border-border bg-surface p-6 shadow-card" @submit.prevent="saveProfile">
          <div class="flex flex-col gap-2">
            <h3 class="font-display text-h3 text-ink">Profile details</h3>
            <p class="text-small text-ink-muted">
              Keep your name, email, contact details, and avatar current.
            </p>
          </div>

          <div class="mt-6 grid gap-5 md:grid-cols-2">
            <div class="space-y-2">
              <label for="profile-full-name" class="block text-small font-semibold text-ink">
                Full name
              </label>
              <input
                id="profile-full-name"
                v-model="profileForm.full_name"
                type="text"
                autocomplete="name"
                required
                class="w-full rounded-card border border-border bg-surface px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary"
              />
            </div>

            <div class="space-y-2">
              <label for="profile-email" class="block text-small font-semibold text-ink">
                Email
              </label>
              <input
                id="profile-email"
                v-model="profileForm.email"
                type="email"
                autocomplete="email"
                required
                class="w-full rounded-card border border-border bg-surface px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary"
              />
            </div>

            <div class="space-y-2">
              <label for="profile-phone" class="block text-small font-semibold text-ink">
                Phone
              </label>
              <input
                id="profile-phone"
                v-model="profileForm.phone"
                type="tel"
                autocomplete="tel"
                class="w-full rounded-card border border-border bg-surface px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary"
              />
            </div>

            <div class="space-y-2">
              <label for="profile-job-title" class="block text-small font-semibold text-ink">
                Job title
              </label>
              <input
                id="profile-job-title"
                v-model="profileForm.job_title"
                type="text"
                autocomplete="organization-title"
                class="w-full rounded-card border border-border bg-surface px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary"
              />
            </div>

            <div class="space-y-3 md:col-span-2">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <label class="block text-small font-semibold text-ink">
                    Avatar
                  </label>
                  <p class="mt-1 text-caption text-ink-muted">
                    Upload an image from your device or clear the current avatar.
                  </p>
                </div>

                <div class="flex flex-wrap gap-2">
                  <button
                    type="button"
                    class="rounded-control border border-border px-3 py-2 text-small font-semibold text-ink hover:bg-surface-alt"
                    :disabled="isUploadingAvatar"
                    @click="focusAvatarInput"
                  >
                    {{ isUploadingAvatar ? "Uploading..." : "Choose file" }}
                  </button>
                  <button
                    type="button"
                    class="rounded-control border border-danger/30 px-3 py-2 text-small font-semibold text-danger hover:bg-danger/5 disabled:cursor-not-allowed disabled:opacity-60"
                    :disabled="isUploadingAvatar || !profileForm.avatar_url"
                    @click="clearAvatar"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <input
                ref="avatarInput"
                type="file"
                accept="image/*"
                class="sr-only"
                @change="handleAvatarChange"
              />

              <div class="flex flex-col gap-4 rounded-card border border-border bg-surface-alt p-4 sm:flex-row sm:items-center">
                <div class="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-h2 font-bold uppercase text-primary">
                  <img
                    v-if="avatarPreviewUrl"
                    :src="avatarPreviewUrl"
                    :alt="`${userDisplayName} avatar preview`"
                    class="size-full object-cover"
                  />
                  <span v-else>{{ userInitials }}</span>
                </div>

                <div class="min-w-0">
                  <p class="font-semibold text-ink">Current avatar preview</p>
                  <p class="mt-1 text-small text-ink-muted">
                    {{ profileForm.avatar_url ? "The selected avatar will be saved with your profile." : "No avatar selected. Your initials will be shown instead." }}
                  </p>
                  <p v-if="avatarUploadError" class="mt-2 text-small text-danger">
                    {{ avatarUploadError }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div v-if="profileError" class="mt-5 rounded-card border border-danger/30 bg-danger/5 px-4 py-3 text-small text-danger">
            {{ profileError }}
          </div>

          <div v-if="profileNotice" class="mt-5 rounded-card border border-border bg-surface-alt px-4 py-3 text-small text-ink">
            {{ profileNotice }}
          </div>

          <div class="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              :disabled="isSavingProfile || isUploadingAvatar"
              class="rounded-control bg-primary px-5 py-2.5 text-small font-semibold text-white hover:bg-primary-dark transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              {{ isSavingProfile ? "Saving..." : "Save profile" }}
            </button>
            <p class="text-caption text-ink-muted">
              Changes update your dashboard identity and staff contact details.
            </p>
          </div>
        </form>
      </div>

      <div v-else class="space-y-6">
        <form class="rounded-card border border-border bg-surface p-6 shadow-card" @submit.prevent="updatePassword">
          <div class="flex flex-col gap-2">
            <h3 class="font-display text-h3 text-ink">Security</h3>
            <p class="text-small text-ink-muted">
              Set a new password for this account. You can also request a reset email if that is easier.
            </p>
          </div>

          <div class="mt-6 grid gap-5">
            <div class="space-y-2">
              <label for="new-password" class="block text-small font-semibold text-ink">
                New password
              </label>
              <input
                id="new-password"
                v-model="passwordForm.password"
                type="password"
                autocomplete="new-password"
                minlength="8"
                required
                class="w-full rounded-card border border-border bg-surface px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary"
              />
            </div>

            <div class="space-y-2">
              <label for="confirm-password" class="block text-small font-semibold text-ink">
                Confirm password
              </label>
              <input
                id="confirm-password"
                v-model="passwordForm.confirmPassword"
                type="password"
                autocomplete="new-password"
                minlength="8"
                required
                class="w-full rounded-card border border-border bg-surface px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary"
              />
            </div>
          </div>

          <p class="mt-4 text-caption text-ink-muted">
            After updating, keep the new password somewhere safe and sign in again if needed.
          </p>

          <div v-if="passwordError" class="mt-5 rounded-card border border-danger/30 bg-danger/5 px-4 py-3 text-small text-danger">
            {{ passwordError }}
          </div>

          <div v-if="passwordNotice" class="mt-5 rounded-card border border-border bg-surface-alt px-4 py-3 text-small text-ink">
            {{ passwordNotice }}
          </div>

          <div class="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              :disabled="isUpdatingPassword"
              class="rounded-control bg-primary px-5 py-2.5 text-small font-semibold text-white hover:bg-primary-dark transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              {{ isUpdatingPassword ? "Updating..." : "Update password" }}
            </button>

            <NuxtLink
              to="/dashboard/forgot-password"
              class="text-small font-semibold text-primary hover:underline"
            >
              Send a reset email instead
            </NuxtLink>
          </div>
        </form>
      </div>

      <aside class="space-y-4">
        <section class="rounded-card border border-border bg-surface p-5 shadow-card">
          <p class="text-caption font-semibold uppercase tracking-wide text-info">
            Account summary
          </p>
          <dl class="mt-4 space-y-4">
            <div>
              <dt class="text-caption font-semibold uppercase tracking-wide text-ink-muted">
                Account status
              </dt>
              <dd class="mt-1 text-body font-medium text-ink">
                {{ profile.is_active ? "Active" : "Inactive" }}
              </dd>
            </div>

            <div>
              <dt class="text-caption font-semibold uppercase tracking-wide text-ink-muted">
                Profile ID
              </dt>
              <dd class="mt-1 break-all text-small text-ink">
                {{ profile.id }}
              </dd>
            </div>

            <div>
              <dt class="text-caption font-semibold uppercase tracking-wide text-ink-muted">
                Member since
              </dt>
              <dd class="mt-1 text-small text-ink">
                {{ memberSince || "Not available" }}
              </dd>
            </div>
          </dl>
        </section>

        <section class="rounded-card border border-border bg-surface p-5 shadow-card">
          <p class="text-caption font-semibold uppercase tracking-wide text-info">
            Access
          </p>
          <div class="mt-4 flex flex-wrap gap-2">
            <span
              v-for="role in roles"
              :key="role"
              class="rounded-full bg-surface-alt px-3 py-1.5 text-caption font-semibold uppercase tracking-wide text-ink-muted"
            >
              {{ role }}
            </span>
          </div>
          <p class="mt-4 text-small text-ink-muted">
            Your dashboard access is still governed by server-side role checks.
          </p>
        </section>
      </aside>
    </section>
  </div>
</template>

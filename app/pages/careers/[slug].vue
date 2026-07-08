<script setup lang="ts">
definePageMeta({ layout: "default" });

const route = useRoute();
const { recruitmentRounds } = useMetrhContent();
const supabase = useSupabaseClient();

const posting = computed(() =>
  recruitmentRounds.find((round) => round.slug === route.params.slug),
);

if (!posting.value) {
  throw createError({ statusCode: 404, statusMessage: "Posting not found." });
}

useSeoMeta({
  title: () => `${posting.value?.title} — MeTRH Careers`,
  description: () => posting.value?.summary,
});

const isOpen = computed(() => posting.value?.status === "open");

const application = reactive({
  name: "",
  email: "",
  phone: "",
  coverLetter: "",
});

const resumeFile = ref<File | null>(null);
const isSubmitting = ref(false);
const formError = ref("");
const formSuccess = ref("");

function resetApplication() {
  application.name = "";
  application.email = "";
  application.phone = "";
  application.coverLetter = "";
  resumeFile.value = null;
}

function handleResumeChange(event: Event) {
  const input = event.target as HTMLInputElement;
  resumeFile.value = input.files?.[0] ?? null;
}

async function submitApplication() {
  formError.value = "";
  formSuccess.value = "";

  if (!posting.value || posting.value.status !== "open") {
    formError.value = "This posting is no longer open.";
    return;
  }

  if (!application.name.trim()) {
    formError.value = "Enter your full name.";
    return;
  }
  if (!application.email.trim()) {
    formError.value = "Enter a valid email address.";
    return;
  }
  if (!resumeFile.value) {
    formError.value = "Attach your resume before submitting.";
    return;
  }
  if (resumeFile.value.size > 5 * 1024 * 1024) {
    formError.value = "Resume files must be 5 MB or smaller.";
    return;
  }
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  const hasAllowedExtension = /\.(pdf|docx?|DOCX?|DOC?)$/i.test(
    resumeFile.value.name,
  );
  if (
    !allowedTypes.includes(resumeFile.value.type) &&
    !hasAllowedExtension
  ) {
    formError.value = "Upload a PDF or Word document.";
    return;
  }

  isSubmitting.value = true;

  try {
    const upload = await $fetch<{
      path: string;
      token: string;
      signedUrl: string;
    }>("/api/storage/documents/sign-upload", {
      method: "POST",
      body: {
        jobSlug: posting.value.slug,
        fileName: resumeFile.value.name,
      },
    });

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .uploadToSignedUrl(upload.path, upload.token, resumeFile.value, {
        contentType: resumeFile.value.type || "application/octet-stream",
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    await $fetch("/api/job-applications", {
      method: "POST",
      body: {
        jobSlug: posting.value.slug,
        applicantName: application.name.trim(),
        email: application.email.trim(),
        phone: application.phone.trim() || null,
        coverLetter: application.coverLetter.trim() || null,
        resumeUrl: upload.path,
      },
    });

    formSuccess.value = "Application submitted.";
    resetApplication();
  } catch (error) {
    formError.value =
      error instanceof Error
        ? error.message
        : "Could not submit your application. Please try again.";
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">
    <div class="mb-8">
      <NuxtLink
        to="/careers"
        class="inline-flex items-center gap-1 text-small font-semibold text-primary hover:underline"
      >
        <Icon name="lucide:arrow-left" class="size-4" />
        Back to careers
      </NuxtLink>
    </div>

    <div v-if="posting" class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <article class="rounded-card border border-border bg-white p-6 md:p-8 shadow-card">
        <div class="flex flex-wrap items-center gap-3">
          <span class="rounded-full bg-surface-alt px-3 py-1.5 text-caption font-semibold uppercase tracking-wide text-ink-muted">
            {{ posting.referenceNo }}
          </span>
          <span
            class="rounded-full px-3 py-1.5 text-caption font-semibold uppercase tracking-wide"
            :class="
              isOpen
            ? 'bg-success/10 text-success'
            : 'bg-surface-alt text-ink-muted'
            "
          >
            {{ posting.status }}
          </span>
        </div>
        <h1 class="mt-4 font-display font-bold text-h1 text-ink">
          {{ posting.title }}
        </h1>
        <p class="mt-2 text-small text-ink-muted">
          Deadline: {{ posting.deadlineLabel }}
        </p>
        <p class="mt-5 text-body text-ink-muted">
          {{ posting.description }}
        </p>

        <div class="mt-8 overflow-x-auto">
          <table class="min-w-full border-separate border-spacing-0">
            <thead>
              <tr class="text-left">
                <th class="border-b border-border px-4 py-3 text-caption font-semibold uppercase tracking-wide text-ink-muted">
                  Position
                </th>
                <th class="border-b border-border px-4 py-3 text-caption font-semibold uppercase tracking-wide text-ink-muted">
                  Posts
                </th>
                <th class="border-b border-border px-4 py-3 text-caption font-semibold uppercase tracking-wide text-ink-muted">
                  Terms
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="position in posting.positions" :key="position.title">
                <td class="border-b border-border px-4 py-4 text-small font-medium text-ink">
                  {{ position.title }}
                </td>
                <td class="border-b border-border px-4 py-4 text-small text-ink-muted">
                  {{ position.posts }}
                </td>
                <td class="border-b border-border px-4 py-4 text-small text-ink-muted">
                  {{ position.terms }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          v-if="isOpen"
          class="mt-8 rounded-card border border-border bg-surface-alt p-5"
        >
          <h2 class="font-display font-semibold text-h3 text-ink">
            Apply now
          </h2>
          <p class="mt-2 text-small text-ink-muted">
            The application form will request your name, contact details,
            cover note, and resume upload through a signed documents bucket URL.
          </p>
          <form class="mt-5 space-y-4" @submit.prevent="submitApplication">
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="block text-small font-medium text-ink mb-1.5" for="applicant-name">
                  Full name
                </label>
                <input
                  id="applicant-name"
                  v-model="application.name"
                  type="text"
                  autocomplete="name"
                  class="w-full rounded-control border border-border px-3 py-2.5 text-body text-ink outline-none focus:border-primary"
                />
              </div>
              <div>
                <label class="block text-small font-medium text-ink mb-1.5" for="applicant-email">
                  Email address
                </label>
                <input
                  id="applicant-email"
                  v-model="application.email"
                  type="email"
                  autocomplete="email"
                  class="w-full rounded-control border border-border px-3 py-2.5 text-body text-ink outline-none focus:border-primary"
                />
              </div>
            </div>
            <div>
              <label class="block text-small font-medium text-ink mb-1.5" for="applicant-phone">
                Phone number
              </label>
              <input
                id="applicant-phone"
                v-model="application.phone"
                type="tel"
                autocomplete="tel"
                class="w-full rounded-control border border-border px-3 py-2.5 text-body text-ink outline-none focus:border-primary"
              />
            </div>
            <div>
              <label class="block text-small font-medium text-ink mb-1.5" for="resume">
                Resume
              </label>
              <input
                id="resume"
                type="file"
                accept=".pdf,.doc,.docx"
                @change="handleResumeChange"
                class="w-full text-small text-ink-muted"
              />
              <p class="mt-2 text-caption text-ink-muted">
                PDF or Word document, up to 5 MB.
              </p>
            </div>
            <div>
              <label class="block text-small font-medium text-ink mb-1.5" for="cover-letter">
                Cover letter
              </label>
              <textarea
                id="cover-letter"
                v-model="application.coverLetter"
                rows="6"
                class="w-full rounded-card border border-border px-3 py-2.5 text-body text-ink outline-none focus:border-primary"
              ></textarea>
            </div>
            <p v-if="formError" role="alert" class="text-small text-danger">
              {{ formError }}
            </p>
            <p v-if="formSuccess" role="status" class="text-small text-success">
              {{ formSuccess }}
            </p>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="rounded-control bg-primary px-5 py-2.5 text-small font-semibold text-white hover:bg-primary-dark transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              {{ isSubmitting ? "Submitting…" : "Submit application" }}
            </button>
          </form>
        </div>

        <div
          v-else
          class="mt-8 rounded-card border border-dashed border-border bg-surface-alt p-6"
        >
          <p class="text-small font-semibold uppercase tracking-wide text-info">
            This round is closed
          </p>
          <p class="mt-2 text-small text-ink-muted">
            The application deadline has passed. Future openings will use the
            same form structure when they are published.
          </p>
        </div>
      </article>

      <aside class="space-y-4">
        <div class="rounded-card border border-border bg-white p-5">
          <p class="text-small font-semibold uppercase tracking-wide text-info">
            Application status
          </p>
          <p class="mt-3 text-small text-ink-muted">
            {{ isOpen ? "Accepting applications now." : "Archived recruitment round." }}
          </p>
        </div>

        <div class="rounded-card border border-border bg-white p-5">
          <p class="text-small font-semibold uppercase tracking-wide text-info">
            Positions
          </p>
          <ul class="mt-4 space-y-3">
            <li
              v-for="position in posting.positions"
              :key="position.title"
              class="rounded-control border border-border px-3 py-2.5"
            >
              <p class="text-small font-medium text-ink">{{ position.title }}</p>
              <p class="text-caption text-ink-muted">
                {{ position.posts }} post(s) · {{ position.terms }}
              </p>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  </div>
</template>

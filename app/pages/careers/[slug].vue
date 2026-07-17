<script setup lang="ts">
import { fetchSignedDocumentUrls } from "~~/app/composables/fetchSignedDocumentUrls";

definePageMeta({ layout: "default" });

const route = useRoute();
const slug = computed(() => String(route.params.slug ?? ""));
const { recruitmentRounds } = useMetrhContent();
const supabase = useSupabaseClient();

type JobPostingRow = {
  id: string;
  reference_no: string | null;
  title: string;
  slug: string;
  department: string | null;
  employment_type: string;
  positions_count: number;
  description: string;
  requirements: string | null;
  responsibilities: string | null;
  how_to_apply: string | null;
  attachment_url: string | null;
  status: "draft" | "open" | "closed";
  application_deadline: string | null;
  created_at: string;
  updated_at: string;
};

function formatDateLabel(value: string | null | undefined) {
  if (!value) return "No deadline listed";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatEmploymentType(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const { data: postingData } = await useAsyncData(
  () => `public-career-${slug.value}`,
  async () => {
  try {
    const response = await $fetch<{
      posting: JobPostingRow | null;
      relatedPostings: JobPostingRow[];
    }>(`/api/public/careers/${slug.value}`);

    const data = response.posting;

    if (data) {
      let attachmentUrl: string | null = null;

      if (data.attachment_url) {
        try {
          const attachmentUrls = await fetchSignedDocumentUrls([
            { resource: "job_postings", id: data.id },
          ]);
          attachmentUrl = attachmentUrls.get(data.id) ?? null;
        } catch (error) {
          console.warn("[careers] Could not sign job posting attachment.", error);
        }
      }

      return {
        posting: {
          id: data.id,
          slug: data.slug,
          referenceNo: data.reference_no ?? data.slug,
          title: data.title,
          department: data.department,
          employmentType: formatEmploymentType(data.employment_type),
          positionsCount: data.positions_count,
          description: data.description,
          requirements: data.requirements,
          responsibilities: data.responsibilities,
          howToApply: data.how_to_apply,
          attachmentUrl,
          status: data.status,
          deadlineLabel: formatDateLabel(data.application_deadline),
        },
        relatedPostings: [],
      };
    }
  } catch (error) {
    console.warn("[careers] Falling back to seeded posting.", error);
  }

  const fallback = recruitmentRounds.find((entry) => entry.slug === slug.value);
  if (!fallback) return null;

  return {
    posting: {
      id: fallback.slug,
      slug: fallback.slug,
      referenceNo: fallback.referenceNo,
      title: fallback.title,
      department: null,
      employmentType: "Archived",
      positionsCount: fallback.positions.reduce((count, position) => count + position.posts, 0),
      description: fallback.description,
      requirements: null,
      responsibilities: null,
      howToApply: null,
      attachmentUrl: null,
      status: fallback.status,
      deadlineLabel: fallback.deadlineLabel,
    },
    relatedPostings: recruitmentRounds
      .filter((entry) => entry.slug !== slug.value)
      .slice(0, 3)
      .map((entry) => ({
        slug: entry.slug,
        title: entry.title,
        referenceNo: entry.referenceNo,
        status: entry.status,
      })),
  };
  },
  { watch: [slug] },
);

const posting = computed(() => postingData.value?.posting ?? null);
const relatedPostings = computed(() => postingData.value?.relatedPostings ?? []);

if (!posting.value) {
  throw createError({ statusCode: 404, statusMessage: "Posting not found." });
}

useSeoMeta({
  title: () => `${posting.value?.title} — MeTRH Careers`,
  description: () => posting.value?.description,
});

const isOpen = computed(() => posting.value?.status === "open");

const application = reactive({
  name: "",
  email: "",
  phone: "",
  coverLetter: "",
});

const resumeFile = ref<File | null>(null);
const resumeInput = ref<HTMLInputElement | null>(null);
const supportingFile = ref<File | null>(null);
const supportingInput = ref<HTMLInputElement | null>(null);
const isSubmitting = ref(false);
const formError = ref("");
const formSuccess = ref("");

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function describeDocumentType(file: File) {
  if (file.type === "application/pdf") return "PDF";
  if (
    file.type === "application/msword" ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "Word document";
  }

  return "Document";
}

const resumeSummary = computed(() => {
  if (!resumeFile.value) return "";

  return `${describeDocumentType(resumeFile.value)} · ${formatFileSize(resumeFile.value.size)}`;
});

const supportingSummary = computed(() => {
  if (!supportingFile.value) return "";

  return `${describeDocumentType(supportingFile.value)} · ${formatFileSize(supportingFile.value.size)}`;
});

function clearResumeSelection() {
  resumeFile.value = null;
  if (resumeInput.value) {
    resumeInput.value.value = "";
  }
}

function setResumeFile(file: File | null) {
  resumeFile.value = file;
  if (resumeInput.value) {
    resumeInput.value.value = "";
  }
}

function clearSupportingSelection() {
  supportingFile.value = null;
  if (supportingInput.value) {
    supportingInput.value.value = "";
  }
}

function setSupportingFile(file: File | null) {
  supportingFile.value = file;
  if (supportingInput.value) {
    supportingInput.value.value = "";
  }
}

function resetApplication() {
  application.name = "";
  application.email = "";
  application.phone = "";
  application.coverLetter = "";
  clearResumeSelection();
  clearSupportingSelection();
}

function handleResumeChange(event: Event) {
  const input = event.target as HTMLInputElement;
  setResumeFile(input.files?.[0] ?? null);
}

function handleResumeDrop(event: DragEvent) {
  setResumeFile(event.dataTransfer?.files?.[0] ?? null);
}

function handleSupportingChange(event: Event) {
  const input = event.target as HTMLInputElement;
  setSupportingFile(input.files?.[0] ?? null);
}

function handleSupportingDrop(event: DragEvent) {
  setSupportingFile(event.dataTransfer?.files?.[0] ?? null);
}

function validateDocumentFile(file: File, label: string) {
  if (file.size > 5 * 1024 * 1024) {
    return `${label} files must be 5 MB or smaller.`;
  }

  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  const hasAllowedExtension = /\.(pdf|docx?)$/i.test(file.name);
  if (!allowedTypes.includes(file.type) && !hasAllowedExtension) {
    return `Upload a PDF or Word document for ${label.toLowerCase()}.`;
  }

  return "";
}

function getFormErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object") {
    const fetchError = error as {
      data?: { statusMessage?: string; message?: string };
      statusMessage?: string;
      message?: string;
    };
    const serverMessage =
      fetchError.data?.statusMessage ??
      fetchError.data?.message ??
      fetchError.statusMessage ??
      fetchError.message;

    if (typeof serverMessage === "string" && serverMessage.trim()) {
      return serverMessage;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
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

  const resumeValidationError = validateDocumentFile(resumeFile.value, "Resume");
  if (resumeValidationError) {
    formError.value = resumeValidationError;
    return;
  }

  if (supportingFile.value) {
    const supportingValidationError = validateDocumentFile(
      supportingFile.value,
      "Supporting document",
    );
    if (supportingValidationError) {
      formError.value = supportingValidationError;
      return;
    }
  }

  if (!posting.value) {
    formError.value = "This posting is no longer open.";
    return;
  }

  isSubmitting.value = true;

  try {
    const resumeUpload = await $fetch<{
      signedUrl: string;
      token: string;
      path: string;
    }>("/api/storage/documents/sign-upload", {
      method: "POST",
      body: {
        jobSlug: posting.value.slug,
        fileName: resumeFile.value.name,
      },
    });

    const { error: resumeError } = await supabase.storage
      .from("documents")
      .uploadToSignedUrl(resumeUpload.path, resumeUpload.token, resumeFile.value, {
        contentType: resumeFile.value.type || "application/octet-stream",
      });

    if (resumeError) {
      throw resumeError;
    }

    let supportingUploadPath: string | null = null;

    if (supportingFile.value) {
      const supportingUpload = await $fetch<{
        signedUrl: string;
        token: string;
        path: string;
      }>("/api/storage/documents/sign-upload", {
        method: "POST",
        body: {
          jobSlug: posting.value.slug,
          fileName: supportingFile.value.name,
        },
      });

      const { error: supportingError } = await supabase.storage
        .from("documents")
        .uploadToSignedUrl(
          supportingUpload.path,
          supportingUpload.token,
          supportingFile.value,
          {
            contentType: supportingFile.value.type || "application/octet-stream",
          },
        );

      if (supportingError) {
        throw supportingError;
      }

      supportingUploadPath = supportingUpload.path;
    }

    await $fetch("/api/job-applications", {
      method: "POST",
      body: {
        jobSlug: posting.value.slug,
        applicantName: application.name.trim(),
        email: application.email.trim(),
        phone: application.phone.trim() || null,
        coverLetter: application.coverLetter.trim() || null,
        resumeUrl: resumeUpload.path,
        supportingDocumentUrl: supportingUploadPath,
      },
    });

    formSuccess.value = "Application submitted.";
    resetApplication();
  } catch (error) {
    formError.value = getFormErrorMessage(
      error,
      "Could not submit your application. Please try again.",
    );
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
      <article class="rounded-card border border-border bg-surface p-6 md:p-8 shadow-card">
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

        <div class="mt-6 grid gap-3 sm:grid-cols-2">
          <div class="rounded-card bg-surface-alt p-4">
            <p class="text-caption font-semibold uppercase tracking-wide text-ink-muted">
              Department
            </p>
            <p class="mt-1 text-small text-ink">
              {{ posting.department || "Not specified" }}
            </p>
          </div>
          <div class="rounded-card bg-surface-alt p-4">
            <p class="text-caption font-semibold uppercase tracking-wide text-ink-muted">
              Employment type
            </p>
            <p class="mt-1 text-small text-ink">
              {{ posting.employmentType }}
            </p>
          </div>
          <div class="rounded-card bg-surface-alt p-4">
            <p class="text-caption font-semibold uppercase tracking-wide text-ink-muted">
              Positions
            </p>
            <p class="mt-1 text-small text-ink">
              {{ posting.positionsCount }}
            </p>
          </div>
        </div>

        <section v-if="posting.attachmentUrl" class="mt-6 rounded-card border border-border bg-surface-alt p-5">
          <p class="text-caption font-semibold uppercase tracking-wide text-info">
            Posting attachment
          </p>
          <p class="mt-2 text-small text-ink-muted">
            Download the document attached to this vacancy.
          </p>
          <a
            :href="posting.attachmentUrl"
            target="_blank"
            rel="noopener"
            class="mt-4 inline-flex items-center gap-2 rounded-control bg-primary px-4 py-2.5 text-small font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            <Icon name="lucide:file-down" class="size-4" />
            Download attachment
          </a>
        </section>

        <p class="mt-6 text-body text-ink-muted whitespace-pre-line">
          {{ posting.description }}
        </p>

        <section v-if="posting.requirements" class="mt-8">
          <h2 class="font-display font-semibold text-h3 text-ink">
            Requirements
          </h2>
          <div class="mt-3 rounded-card bg-surface-alt p-5 text-small text-ink whitespace-pre-line">
            {{ posting.requirements }}
          </div>
        </section>

        <section v-if="posting.responsibilities" class="mt-8">
          <h2 class="font-display font-semibold text-h3 text-ink">
            Responsibilities
          </h2>
          <div class="mt-3 rounded-card bg-surface-alt p-5 text-small text-ink whitespace-pre-line">
            {{ posting.responsibilities }}
          </div>
        </section>

        <section v-if="posting.howToApply" class="mt-8">
          <h2 class="font-display font-semibold text-h3 text-ink">
            How to apply
          </h2>
          <div class="mt-3 rounded-card bg-surface-alt p-5 text-small text-ink whitespace-pre-line">
            {{ posting.howToApply }}
          </div>
        </section>

        <div
          v-if="isOpen"
          class="mt-8 rounded-card border border-border bg-surface-alt p-5"
        >
          <h2 class="font-display font-semibold text-h3 text-ink">
            Apply now
          </h2>
          <p class="mt-2 text-small text-ink-muted">
            The application form will request your name, contact details,
            cover note, resume upload, and an optional supporting document through signed documents bucket URLs.
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
                ref="resumeInput"
                type="file"
                accept=".pdf,.doc,.docx"
                class="sr-only"
                @change="handleResumeChange"
              />
              <div
                class="rounded-card border border-border bg-surface p-4 shadow-card"
                @drop.prevent="handleResumeDrop"
                @dragover.prevent
              >
                <button
                  v-if="!resumeFile"
                  type="button"
                  class="flex w-full flex-col items-start gap-4 rounded-card border border-dashed border-border bg-surface-alt/70 p-5 text-left transition hover:border-primary/50 hover:bg-surface-alt"
                  @click="resumeInput?.click()"
                >
                  <div class="flex w-full items-start gap-4">
                    <div class="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon name="lucide:file-up" class="size-5" />
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="font-semibold text-ink">Upload your resume</p>
                      <p class="mt-1 text-small text-ink-muted">
                        Drag and drop a file here, or browse to select one.
                      </p>
                    </div>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <span class="rounded-full bg-surface px-2.5 py-1 text-caption font-semibold uppercase tracking-wide text-ink-muted">
                      PDF preferred
                    </span>
                    <span class="rounded-full bg-surface px-2.5 py-1 text-caption font-semibold uppercase tracking-wide text-ink-muted">
                      Word accepted
                    </span>
                    <span class="rounded-full bg-surface px-2.5 py-1 text-caption font-semibold uppercase tracking-wide text-ink-muted">
                      Max 5 MB
                    </span>
                  </div>
                </button>

                <div v-else class="space-y-4">
                  <div class="flex items-start justify-between gap-4 rounded-card bg-surface-alt p-4">
                    <div class="min-w-0">
                      <p class="text-caption font-semibold uppercase tracking-wide text-info">
                        Selected file
                      </p>
                      <p class="mt-1 truncate font-medium text-ink">
                        {{ resumeFile.name }}
                      </p>
                      <p class="mt-1 text-small text-ink-muted">
                        {{ resumeSummary }}
                      </p>
                    </div>
                    <span class="rounded-full bg-success/10 px-3 py-1 text-caption font-semibold uppercase tracking-wide text-success">
                      Ready
                    </span>
                  </div>

                  <div class="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      class="rounded-control border border-border px-4 py-2 text-small font-semibold text-ink hover:bg-surface-alt"
                      @click="resumeInput?.click()"
                    >
                      Replace file
                    </button>
                    <button
                      type="button"
                      class="rounded-control border border-border px-4 py-2 text-small font-semibold text-ink hover:bg-surface-alt"
                      @click="clearResumeSelection"
                    >
                      Remove
                    </button>
                    <p class="text-caption text-ink-muted">
                      PDF or Word document, up to 5 MB.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <label class="block text-small font-medium text-ink mb-1.5" for="supporting-document">
                Supporting document
              </label>
              <input
                id="supporting-document"
                ref="supportingInput"
                type="file"
                accept=".pdf,.doc,.docx"
                class="sr-only"
                @change="handleSupportingChange"
              />
              <div
                class="rounded-card border border-border bg-surface p-4 shadow-card"
                @drop.prevent="handleSupportingDrop"
                @dragover.prevent
              >
                <button
                  v-if="!supportingFile"
                  type="button"
                  class="flex w-full flex-col items-start gap-4 rounded-card border border-dashed border-border bg-surface-alt/70 p-5 text-left transition hover:border-primary/50 hover:bg-surface-alt"
                  @click="supportingInput?.click()"
                >
                  <div class="flex w-full items-start gap-4">
                    <div class="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon name="lucide:paperclip" class="size-5" />
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="font-semibold text-ink">Upload a supporting document</p>
                      <p class="mt-1 text-small text-ink-muted">
                        Optional certificates, portfolio items, or additional documents.
                      </p>
                    </div>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <span class="rounded-full bg-surface px-2.5 py-1 text-caption font-semibold uppercase tracking-wide text-ink-muted">
                      Optional
                    </span>
                    <span class="rounded-full bg-surface px-2.5 py-1 text-caption font-semibold uppercase tracking-wide text-ink-muted">
                      PDF preferred
                    </span>
                    <span class="rounded-full bg-surface px-2.5 py-1 text-caption font-semibold uppercase tracking-wide text-ink-muted">
                      Word accepted
                    </span>
                  </div>
                </button>

                <div v-else class="space-y-4">
                  <div class="flex items-start justify-between gap-4 rounded-card bg-surface-alt p-4">
                    <div class="min-w-0">
                      <p class="text-caption font-semibold uppercase tracking-wide text-info">
                        Selected file
                      </p>
                      <p class="mt-1 truncate font-medium text-ink">
                        {{ supportingFile.name }}
                      </p>
                      <p class="mt-1 text-small text-ink-muted">
                        {{ supportingSummary }}
                      </p>
                    </div>
                    <span class="rounded-full bg-success/10 px-3 py-1 text-caption font-semibold uppercase tracking-wide text-success">
                      Ready
                    </span>
                  </div>

                  <div class="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      class="rounded-control border border-border px-4 py-2 text-small font-semibold text-ink hover:bg-surface-alt"
                      @click="supportingInput?.click()"
                    >
                      Replace file
                    </button>
                    <button
                      type="button"
                      class="rounded-control border border-border px-4 py-2 text-small font-semibold text-ink hover:bg-surface-alt"
                      @click="clearSupportingSelection"
                    >
                      Remove
                    </button>
                    <p class="text-caption text-ink-muted">
                      Optional document, up to 5 MB.
                    </p>
                  </div>
                </div>
              </div>
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
        <div class="rounded-card border border-border bg-surface p-5">
          <p class="text-small font-semibold uppercase tracking-wide text-info">
            Application status
          </p>
          <p class="mt-3 text-small text-ink-muted">
            {{ isOpen ? "Accepting applications now." : "Archived recruitment round." }}
          </p>
        </div>

        <div v-if="relatedPostings.length" class="rounded-card border border-border bg-surface p-5">
          <p class="text-small font-semibold uppercase tracking-wide text-info">
            Related postings
          </p>
          <ul class="mt-4 space-y-3">
            <li
              v-for="item in relatedPostings"
              :key="item.slug"
              class="rounded-control border border-border px-3 py-2.5"
            >
              <NuxtLink :to="`/careers/${item.slug}`" class="block">
                <p class="text-small font-medium text-ink">{{ item.title }}</p>
                <p class="text-caption text-ink-muted">
                  {{ item.referenceNo }} · {{ item.status }}
                </p>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  </div>
</template>

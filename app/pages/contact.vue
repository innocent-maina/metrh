<script setup lang="ts">
definePageMeta({ layout: "default" });

const { data: siteSettings } = await useSiteSettings();
const { data: contactContent } = await usePageContent("contact");

const contactSection = computed(
  () => contactContent.value?.sectionsByKey["contact-intro"] ?? null,
);

useSeoMeta({
  title: "Contact MeTRH",
  description:
    "Emergency line, visiting hours, address, map, and general enquiries for Meru Teaching and Referral Hospital.",
});

const form = reactive({
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
});

const isSubmitting = ref(false);
const errorMessage = ref("");
const { successToast } = useAppToast();

const contactImages = useHospitalMedia();

const emergencyLine = computed(
  () => siteSettings.value?.emergency_line?.trim() || "0711-207623",
);

const physicalAddress = computed(
  () =>
    siteSettings.value?.physical_address ||
    "Meru–Nanyuki Road, Telkom Ltd junction, Meru Town",
);

const postalAddress = computed(
  () => siteSettings.value?.postal_address || "P.O. Box 8 – 60200, Meru",
);

const visitingHours = computed(() => siteSettings.value?.visiting_hours ?? []);

const mapsHref = computed(
  () =>
    "https://www.google.com/maps/search/?api=1&query=Meru+Teaching+and+Referral+Hospital+Meru+Kenya",
);

function resetForm() {
  form.name = "";
  form.email = "";
  form.phone = "";
  form.subject = "";
  form.message = "";
}

async function submitForm() {
  errorMessage.value = "";

  if (!form.name.trim()) {
    errorMessage.value = "Enter your name.";
    return;
  }
  if (!form.email.trim()) {
    errorMessage.value = "Enter a valid email address.";
    return;
  }
  if (!form.message.trim()) {
    errorMessage.value = "Enter your message.";
    return;
  }

  isSubmitting.value = true;

  try {
    await $fetch("/api/contact-submissions", {
      method: "POST",
      body: {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        subject: form.subject.trim() || null,
        message: form.message.trim(),
      },
    });

    resetForm();
    successToast(
      "Message sent successfully.",
      "A member of the team will review your enquiry.",
    );
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : "We could not submit your message. Please try again.";
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div>
    <section class="bg-surface">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div class="max-w-3xl">
          <p class="text-small font-semibold uppercase tracking-wide text-info">
            {{ contactSection?.eyebrow || "Contact" }}
          </p>
          <h1 class="mt-2 font-display font-bold text-h1 text-ink">
            {{ contactSection?.title || "Reach MeTRH quickly and clearly" }}
          </h1>
          <p class="mt-4 text-body text-ink-muted">
            {{
              contactSection?.summary ||
              "Use the emergency line for urgent care. Use the form for general enquiries, directions, appointments, and institutional requests."
            }}
          </p>
        </div>
      </div>
    </section>

    <section class="border-y border-border bg-surface-alt">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <div class="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div class="space-y-6">
            <div
              class="rounded-card border border-border bg-surface p-6 shadow-card"
            >
              <p
                class="text-small font-semibold uppercase tracking-wide text-danger"
              >
                Emergency line
              </p>
              <a
                :href="
                  siteSettings?.emergency_href ||
                  `tel:${emergencyLine.replace(/-/g, '')}`
                "
                class="mt-3 inline-flex items-center gap-2 font-display font-semibold text-h2 text-primary hover:underline"
              >
                <Icon
                  name="lucide:phone-call"
                  class="size-5 text-accent"
                  aria-hidden="true"
                />
                {{ siteSettings?.emergency_label || "Emergency line" }}:
                {{ emergencyLine }}
              </a>
              <p class="mt-3 text-small text-ink-muted">
                For urgent care, call directly instead of sending a form.
              </p>
            </div>

            <div class="rounded-card border border-border bg-surface p-6">
              <p
                class="text-small font-semibold uppercase tracking-wide text-info"
              >
                Visiting hours
              </p>
              <ul class="mt-4 space-y-3">
                <li
                  v-for="hours in visitingHours"
                  :key="hours.label"
                  class="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-b-0 last:pb-0"
                >
                  <span class="text-small font-medium text-ink">{{
                    hours.label
                  }}</span>
                  <span class="tabular-nums text-small text-ink-muted">
                    {{ hours.start }} – {{ hours.end }}
                  </span>
                </li>
              </ul>
            </div>

            <div class="rounded-card border border-border bg-surface p-6">
              <p
                class="text-small font-semibold uppercase tracking-wide text-info"
              >
                Address
              </p>
              <p class="mt-3 text-body text-ink">
                {{ physicalAddress }}
              </p>
              <p class="mt-2 text-small text-ink-muted">
                {{ postalAddress }}
              </p>
              <a
                :href="mapsHref"
                target="_blank"
                rel="noopener noreferrer"
                class="mt-4 inline-flex items-center gap-1 text-small font-semibold text-primary hover:underline"
              >
                Open map directions
                <Icon name="lucide:map" class="size-4" />
              </a>
            </div>

            <div
              class="rounded-card border border-border bg-primary-dark p-6 text-white"
            >
              <p
                class="text-small font-semibold uppercase tracking-wide text-accent"
              >
                General enquiries
              </p>
              <p class="mt-3 text-small text-white/80">
                This form is for appointments, directions, feedback, and general
                hospital questions. It is not monitored for emergencies.
              </p>
            </div>
          </div>

          <div
            class="rounded-card border border-border bg-surface p-6 md:p-8 shadow-card"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <p
                  class="text-small font-semibold uppercase tracking-wide text-info"
                >
                  Enquiry form
                </p>
                <h2 class="mt-1 font-display font-semibold text-h3 text-ink">
                  Send a message
                </h2>
              </div>
            </div>

            <form class="mt-6 space-y-4" @submit.prevent="submitForm">
              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    for="name"
                    class="block text-small font-medium text-ink mb-1.5"
                  >
                    Full name
                  </label>
                  <input
                    id="name"
                    v-model="form.name"
                    type="text"
                    autocomplete="name"
                    required
                    class="w-full rounded-control border border-border px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary"
                  />
                </div>
                <div>
                  <label
                    for="email"
                    class="block text-small font-medium text-ink mb-1.5"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    v-model="form.email"
                    type="email"
                    autocomplete="email"
                    required
                    class="w-full rounded-control border border-border px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary"
                  />
                </div>
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    for="phone"
                    class="block text-small font-medium text-ink mb-1.5"
                  >
                    Phone number
                  </label>
                  <input
                    id="phone"
                    v-model="form.phone"
                    type="tel"
                    autocomplete="tel"
                    class="w-full rounded-control border border-border px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary"
                  />
                </div>
                <div>
                  <label
                    for="subject"
                    class="block text-small font-medium text-ink mb-1.5"
                  >
                    Subject
                  </label>
                  <input
                    id="subject"
                    v-model="form.subject"
                    type="text"
                    autocomplete="off"
                    class="w-full rounded-control border border-border px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label
                  for="message"
                  class="block text-small font-medium text-ink mb-1.5"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  v-model="form.message"
                  rows="6"
                  required
                  class="w-full rounded-card border border-border px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary"
                ></textarea>
              </div>

              <p
                v-if="errorMessage"
                role="alert"
                class="text-small text-danger"
              >
                {{ errorMessage }}
              </p>
              <div class="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  :disabled="isSubmitting"
                  class="inline-flex items-center justify-center rounded-control bg-primary px-5 py-2.5 text-small font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {{ isSubmitting ? "Sending…" : "Send enquiry" }}
                </button>
                <a
                  :href="
                    siteSettings?.emergency_href ||
                    `tel:${emergencyLine.replace(/-/g, '')}`
                  "
                  class="inline-flex items-center justify-center rounded-control border border-border px-5 py-2.5 text-small font-semibold text-ink transition-colors hover:bg-surface-alt"
                >
                  Call emergency line
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

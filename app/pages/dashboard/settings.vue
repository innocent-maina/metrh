<script setup lang="ts">
definePageMeta({ layout: "dashboard" });

useSeoMeta({
  title: "Site settings — MeTRH Dashboard",
  description:
    "Edit the hospital site settings using normal form fields instead of raw JSON.",
});

type VisitingHourDraft = {
  label: string;
  start: string;
  end: string;
};

type SiteSettingsDraft = {
  id: string;
  emergency_line: string;
  main_phone: string;
  main_email: string;
  physical_address: string;
  postal_address: string;
  visiting_hours: VisitingHourDraft[];
  social_links: {
    facebook: string;
    x: string;
  };
  homepage_hero: {
    headline: string;
    subhead: string;
    cta_label: string;
    cta_href: string;
    image_url: string;
  };
  whatsapp_label: string;
  whatsapp_href: string;
  emergency_label: string;
  emergency_href: string;
  updated_at: string;
};

const visitingHourDefaults: VisitingHourDraft[] = [
  { label: "Morning", start: "6:00 AM", end: "7:00 AM" },
  { label: "Lunch", start: "12:30 PM", end: "2:00 PM" },
  { label: "Evening", start: "4:30 PM", end: "5:30 PM" },
];

function createDefaultDraft(): SiteSettingsDraft {
  return {
    id: "true",
    emergency_line: "0711-207623",
    main_phone: "",
    main_email: "",
    physical_address: "Meru–Nanyuki Road, Telkom Ltd junction, Meru Town",
    postal_address: "P.O. Box 8 – 60200, Meru",
    visiting_hours: visitingHourDefaults.map((entry) => ({ ...entry })),
    social_links: {
      facebook: "https://facebook.com/MeTRH.Hospital",
      x: "https://x.com/MeTRH_Hospital",
    },
    homepage_hero: {
      headline: "Compassionate public care, every day.",
      subhead:
        "Meru Teaching and Referral Hospital serves Upper Eastern Kenya with emergency care, specialist clinics, surgery, diagnostics, and teaching-led service delivery.",
      cta_label: "Explore services",
      cta_href: "/services",
      image_url: "/welcome.jpg",
    },
    whatsapp_label: "Chat on WhatsApp",
    whatsapp_href:
      "https://wa.me/254711207623?text=Hello%20MeTRH%2C%20I%20would%20like%20to%20ask%20about%20the%20hospital%20services.",
    emergency_label: "Emergency line",
    emergency_href: "tel:0711207623",
    updated_at: "",
  };
}

function toText(value: unknown) {
  return String(value ?? "").trim();
}

function toOptionalText(value: unknown) {
  const text = toText(value);
  return text || "";
}

function normalizeVisitingHours(value: unknown) {
  const rows = Array.isArray(value) ? value : [];
  return visitingHourDefaults.map((fallback, index) => {
    const entry = rows[index] as Record<string, unknown> | undefined;

    return {
      label: toOptionalText(entry?.label) || fallback.label,
      start: toOptionalText(entry?.start) || fallback.start,
      end: toOptionalText(entry?.end) || fallback.end,
    };
  });
}

function rowToDraft(row: Record<string, unknown> | null) {
  const draft = createDefaultDraft();

  if (!row) {
    return draft;
  }

  draft.id = toText(row.id) || "true";
  draft.emergency_line = toOptionalText(row.emergency_line) || draft.emergency_line;
  draft.main_phone = toOptionalText(row.main_phone);
  draft.main_email = toOptionalText(row.main_email);
  draft.physical_address =
    toOptionalText(row.physical_address) || draft.physical_address;
  draft.postal_address = toOptionalText(row.postal_address) || draft.postal_address;
  draft.visiting_hours = normalizeVisitingHours(row.visiting_hours);
  draft.social_links = {
    facebook:
      toOptionalText((row.social_links as Record<string, unknown> | null)?.facebook) ||
      draft.social_links.facebook,
    x:
      toOptionalText((row.social_links as Record<string, unknown> | null)?.x) ||
      draft.social_links.x,
  };
  draft.homepage_hero = {
    headline:
      toOptionalText((row.homepage_hero as Record<string, unknown> | null)?.headline) ||
      draft.homepage_hero.headline,
    subhead:
      toOptionalText((row.homepage_hero as Record<string, unknown> | null)?.subhead) ||
      draft.homepage_hero.subhead,
    cta_label:
      toOptionalText((row.homepage_hero as Record<string, unknown> | null)?.cta_label) ||
      draft.homepage_hero.cta_label,
    cta_href:
      toOptionalText((row.homepage_hero as Record<string, unknown> | null)?.cta_href) ||
      draft.homepage_hero.cta_href,
    image_url:
      toOptionalText((row.homepage_hero as Record<string, unknown> | null)?.image_url) ||
      draft.homepage_hero.image_url,
  };
  draft.whatsapp_label = toOptionalText(row.whatsapp_label) || draft.whatsapp_label;
  draft.whatsapp_href = toOptionalText(row.whatsapp_href) || draft.whatsapp_href;
  draft.emergency_label = toOptionalText(row.emergency_label) || draft.emergency_label;
  draft.emergency_href = toOptionalText(row.emergency_href) || draft.emergency_href;
  draft.updated_at = toOptionalText(row.updated_at);

  return draft;
}

function compactVisitingHours(value: VisitingHourDraft[]) {
  return value
    .map((entry) => ({
      label: toOptionalText(entry.label),
      start: toOptionalText(entry.start),
      end: toOptionalText(entry.end),
    }))
    .filter((entry) => entry.label || entry.start || entry.end);
}

function buildPayload(draft: SiteSettingsDraft) {
  const socialLinks = {
    facebook: toOptionalText(draft.social_links.facebook),
    x: toOptionalText(draft.social_links.x),
  };

  const homepageHero = {
    headline: toOptionalText(draft.homepage_hero.headline),
    subhead: toOptionalText(draft.homepage_hero.subhead),
    cta_label: toOptionalText(draft.homepage_hero.cta_label),
    cta_href: toOptionalText(draft.homepage_hero.cta_href),
    image_url: toOptionalText(draft.homepage_hero.image_url),
  };

  return {
    emergency_line: toOptionalText(draft.emergency_line) || null,
    main_phone: toOptionalText(draft.main_phone) || null,
    main_email: toOptionalText(draft.main_email) || null,
    physical_address: toOptionalText(draft.physical_address) || null,
    postal_address: toOptionalText(draft.postal_address) || null,
    visiting_hours: compactVisitingHours(draft.visiting_hours),
    social_links:
      socialLinks.facebook || socialLinks.x ? socialLinks : null,
    homepage_hero:
      homepageHero.headline ||
      homepageHero.subhead ||
      homepageHero.cta_label ||
      homepageHero.cta_href ||
      homepageHero.image_url
        ? homepageHero
        : null,
    whatsapp_label: toOptionalText(draft.whatsapp_label) || null,
    whatsapp_href: toOptionalText(draft.whatsapp_href) || null,
    emergency_label: toOptionalText(draft.emergency_label) || null,
    emergency_href: toOptionalText(draft.emergency_href) || null,
  };
}

const settingsRow = ref<Record<string, unknown> | null>(null);
const draft = reactive(createDefaultDraft());
const isLoading = ref(true);
const isSaving = ref(false);
const loadError = ref<string | null>(null);
const notice = ref<string | null>(null);

const lastUpdated = computed(() => {
  const value = settingsRow.value?.updated_at ?? draft.updated_at;
  if (!value) return "";

  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return String(value);

  return parsed.toLocaleString();
});

async function loadSettings() {
  isLoading.value = true;
  loadError.value = null;

  try {
    const rows = await fetchDashboardResourceRows("site_settings");
    const row = rows[0] ?? null;

    settingsRow.value = row;
    Object.assign(draft, rowToDraft(row));

    if (!row) {
      loadError.value = "Site settings row not found.";
    }
  } catch (error) {
    settingsRow.value = null;
    Object.assign(draft, createDefaultDraft());
    loadError.value =
      error instanceof Error ? error.message : "Could not load site settings.";
  } finally {
    isLoading.value = false;
  }
}

await loadSettings();

async function saveSettings() {
  if (!settingsRow.value) return;

  isSaving.value = true;
  notice.value = null;

  try {
    const response = await $fetch<{ row: Record<string, unknown> }>(
      "/api/dashboard/site_settings",
      {
        method: "PATCH",
        body: {
          id: draft.id,
          data: buildPayload(draft),
        },
      },
    );

    if (response.row) {
      settingsRow.value = response.row;
      Object.assign(draft, rowToDraft(response.row));
    } else {
      await loadSettings();
    }

    notice.value = "Site settings saved successfully.";
  } catch (error) {
    notice.value =
      error instanceof Error ? error.message : "Could not save the site settings.";
  } finally {
    isSaving.value = false;
  }
}
</script>

<template>
  <div class="space-y-6">
    <section class="rounded-card border border-border bg-surface p-6 md:p-8 shadow-card">
      <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div class="max-w-3xl">
          <p class="text-small font-semibold uppercase tracking-wide text-info">
            Settings
          </p>
          <h1 class="mt-2 font-display font-bold text-h1 text-ink">
            Site settings
          </h1>
          <p class="mt-4 text-body text-ink-muted">
            Edit the hospital's contact details, social links, homepage hero,
            and visiting hours using normal text fields. No JSON editing is
            required here.
          </p>
          <p v-if="lastUpdated" class="mt-3 text-caption text-ink-muted">
            Last updated: {{ lastUpdated }}
          </p>
        </div>

        <button
          type="button"
          class="rounded-control bg-primary px-4 py-2.5 text-small font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
          :disabled="isLoading || isSaving || !settingsRow"
          @click="saveSettings"
        >
          {{ isSaving ? "Saving..." : "Save settings" }}
        </button>
      </div>
    </section>

    <div
      v-if="notice"
      class="rounded-card border border-border bg-surface-alt px-4 py-3 text-small text-ink"
    >
      {{ notice }}
    </div>

    <div
      v-if="loadError"
      class="rounded-card border border-warning/30 bg-warning/5 px-4 py-3 text-small text-warning"
    >
      {{ loadError }}
    </div>

    <form class="space-y-6" @submit.prevent="saveSettings">
      <section class="rounded-card border border-border bg-surface p-6 shadow-card">
        <div class="max-w-3xl">
          <p class="text-small font-semibold uppercase tracking-wide text-info">
            Contact details
          </p>
          <h2 class="mt-2 font-display font-semibold text-h3 text-ink">
            Core contact information
          </h2>
        </div>

        <div class="mt-6 grid gap-4 md:grid-cols-2">
          <label class="space-y-2">
            <span class="block text-small font-semibold text-ink">Emergency line</span>
            <input
              v-model="draft.emergency_line"
              type="text"
              class="w-full rounded-card border border-border bg-surface-alt px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary"
            />
          </label>

          <label class="space-y-2">
            <span class="block text-small font-semibold text-ink">Main phone</span>
            <input
              v-model="draft.main_phone"
              type="text"
              class="w-full rounded-card border border-border bg-surface-alt px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary"
            />
          </label>

          <label class="space-y-2">
            <span class="block text-small font-semibold text-ink">Main email</span>
            <input
              v-model="draft.main_email"
              type="email"
              class="w-full rounded-card border border-border bg-surface-alt px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary"
            />
          </label>

          <label class="space-y-2">
            <span class="block text-small font-semibold text-ink">WhatsApp label</span>
            <input
              v-model="draft.whatsapp_label"
              type="text"
              class="w-full rounded-card border border-border bg-surface-alt px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary"
            />
          </label>

          <label class="space-y-2 md:col-span-2">
            <span class="block text-small font-semibold text-ink">
              Physical address
            </span>
            <textarea
              v-model="draft.physical_address"
              rows="3"
              class="w-full rounded-card border border-border bg-surface-alt px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary"
            />
          </label>

          <label class="space-y-2 md:col-span-2">
            <span class="block text-small font-semibold text-ink">
              Postal address
            </span>
            <textarea
              v-model="draft.postal_address"
              rows="3"
              class="w-full rounded-card border border-border bg-surface-alt px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary"
            />
          </label>

          <label class="space-y-2 md:col-span-2">
            <span class="block text-small font-semibold text-ink">
              WhatsApp link
            </span>
            <input
              v-model="draft.whatsapp_href"
              type="text"
              class="w-full rounded-card border border-border bg-surface-alt px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary"
            />
          </label>

          <label class="space-y-2">
            <span class="block text-small font-semibold text-ink">
              Emergency button label
            </span>
            <input
              v-model="draft.emergency_label"
              type="text"
              class="w-full rounded-card border border-border bg-surface-alt px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary"
            />
          </label>

          <label class="space-y-2">
            <span class="block text-small font-semibold text-ink">
              Emergency button link
            </span>
            <input
              v-model="draft.emergency_href"
              type="text"
              class="w-full rounded-card border border-border bg-surface-alt px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary"
            />
          </label>
        </div>
      </section>

      <section class="rounded-card border border-border bg-surface p-6 shadow-card">
        <div class="max-w-3xl">
          <p class="text-small font-semibold uppercase tracking-wide text-info">
            Visiting hours
          </p>
          <h2 class="mt-2 font-display font-semibold text-h3 text-ink">
            Plain text time slots
          </h2>
        </div>

        <div class="mt-6 space-y-4">
          <div
            v-for="(hours, index) in draft.visiting_hours"
            :key="hours.label"
            class="rounded-card border border-border bg-surface-alt p-4"
          >
            <div class="mb-3 flex items-center justify-between gap-4">
              <p class="font-semibold text-ink">Slot {{ index + 1 }}</p>
              <span class="text-caption text-ink-muted">Leave blank to omit</span>
            </div>

            <div class="grid gap-4 md:grid-cols-3">
              <label class="space-y-2">
                <span class="block text-small font-semibold text-ink">Label</span>
                <input
                  v-model="hours.label"
                  type="text"
                  class="w-full rounded-card border border-border bg-surface px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary"
                />
              </label>

              <label class="space-y-2">
                <span class="block text-small font-semibold text-ink">Start time</span>
                <input
                  v-model="hours.start"
                  type="text"
                  class="w-full rounded-card border border-border bg-surface px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary"
                />
              </label>

              <label class="space-y-2">
                <span class="block text-small font-semibold text-ink">End time</span>
                <input
                  v-model="hours.end"
                  type="text"
                  class="w-full rounded-card border border-border bg-surface px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary"
                />
              </label>
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-card border border-border bg-surface p-6 shadow-card">
        <div class="max-w-3xl">
          <p class="text-small font-semibold uppercase tracking-wide text-info">
            Social links
          </p>
          <h2 class="mt-2 font-display font-semibold text-h3 text-ink">
            Public social profiles
          </h2>
        </div>

        <div class="mt-6 grid gap-4 md:grid-cols-2">
          <label class="space-y-2">
            <span class="block text-small font-semibold text-ink">Facebook URL</span>
            <input
              v-model="draft.social_links.facebook"
              type="text"
              class="w-full rounded-card border border-border bg-surface-alt px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary"
            />
          </label>

          <label class="space-y-2">
            <span class="block text-small font-semibold text-ink">X URL</span>
            <input
              v-model="draft.social_links.x"
              type="text"
              class="w-full rounded-card border border-border bg-surface-alt px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary"
            />
          </label>
        </div>
      </section>

      <section class="rounded-card border border-border bg-surface p-6 shadow-card">
        <div class="max-w-3xl">
          <p class="text-small font-semibold uppercase tracking-wide text-info">
            Homepage hero
          </p>
          <h2 class="mt-2 font-display font-semibold text-h3 text-ink">
            Fallback homepage content
          </h2>
        </div>

        <div class="mt-6 grid gap-4 md:grid-cols-2">
          <label class="space-y-2 md:col-span-2">
            <span class="block text-small font-semibold text-ink">Headline</span>
            <input
              v-model="draft.homepage_hero.headline"
              type="text"
              class="w-full rounded-card border border-border bg-surface-alt px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary"
            />
          </label>

          <label class="space-y-2 md:col-span-2">
            <span class="block text-small font-semibold text-ink">Subhead</span>
            <textarea
              v-model="draft.homepage_hero.subhead"
              rows="4"
              class="w-full rounded-card border border-border bg-surface-alt px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary"
            />
          </label>

          <label class="space-y-2">
            <span class="block text-small font-semibold text-ink">CTA label</span>
            <input
              v-model="draft.homepage_hero.cta_label"
              type="text"
              class="w-full rounded-card border border-border bg-surface-alt px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary"
            />
          </label>

          <label class="space-y-2">
            <span class="block text-small font-semibold text-ink">CTA link</span>
            <input
              v-model="draft.homepage_hero.cta_href"
              type="text"
              class="w-full rounded-card border border-border bg-surface-alt px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary"
            />
          </label>

          <label class="space-y-2 md:col-span-2">
            <span class="block text-small font-semibold text-ink">
              Hero image URL
            </span>
            <input
              v-model="draft.homepage_hero.image_url"
              type="text"
              class="w-full rounded-card border border-border bg-surface-alt px-3 py-2.5 text-body text-ink outline-none transition-colors focus:border-primary"
            />
          </label>
        </div>
      </section>

      <div class="flex justify-end">
        <button
          type="submit"
          class="rounded-control bg-primary px-5 py-3 text-small font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
          :disabled="isLoading || isSaving || !settingsRow"
        >
          {{ isSaving ? "Saving..." : "Save settings" }}
        </button>
      </div>
    </form>
  </div>
</template>

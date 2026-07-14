<script setup lang="ts">
import type { Database } from "~~/types/database.types";
import { fetchSignedDocumentUrls } from "~~/app/composables/fetchSignedDocumentUrls";

definePageMeta({ layout: "default" });

const supabase = useSupabaseClient<Database>();
const { recruitmentRounds } = useMetrhContent();
const { data: careersContent } = await usePageContent("careers");

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

useSeoMeta({
  title: "Careers & Opportunities — MeTRH",
  description:
    "Current job openings and archived recruitment rounds for Meru Teaching and Referral Hospital.",
});

const search = ref("");
const activeFilter = ref<"all" | "open" | "closed">("all");
const statusOptions = [
  { label: "All rounds", value: "all" },
  { label: "Open", value: "open" },
  { label: "Closed", value: "closed" },
] as const;

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

const { data: careerIndex } = await useAsyncData("public-careers-index", async () => {
  try {
    const { data: rows, error } = await supabase
      .from("job_postings")
      .select("id,reference_no,title,slug,department,employment_type,positions_count,description,requirements,responsibilities,how_to_apply,attachment_url,status,application_deadline,created_at,updated_at")
      .eq("status", "open")
      .order("application_deadline", { ascending: true });

    if (error) throw error;

    const data = rows as JobPostingRow[];
    const attachmentRows = data.filter((posting) => posting.attachment_url);
    const attachmentUrlMap = attachmentRows.length
      ? await fetchSignedDocumentUrls(
          attachmentRows.map((posting) => ({
            resource: "job_postings",
            id: posting.id,
          })),
        )
      : new Map<string, string | null>();

    return {
      source: "database",
      rounds: (data ?? []).map((posting) => ({
        id: posting.id,
        slug: posting.slug,
        referenceNo: posting.reference_no ?? posting.slug,
        title: posting.title,
        status: posting.status,
        deadlineLabel: formatDateLabel(posting.application_deadline),
        summary: posting.description,
        description: posting.description,
        positionsCount: posting.positions_count,
        department: posting.department,
        employmentType: formatEmploymentType(posting.employment_type),
        requirements: posting.requirements,
        responsibilities: posting.responsibilities,
        howToApply: posting.how_to_apply,
        attachmentUrl: posting.attachment_url
          ? attachmentUrlMap.get(posting.id) ?? null
          : null,
      })),
    };
  } catch (error) {
    console.warn("[careers] Falling back to seeded rounds.", error);
    return {
      source: "fallback",
      rounds: recruitmentRounds.map((round) => ({
        id: round.slug,
        slug: round.slug,
        referenceNo: round.referenceNo,
        title: round.title,
        status: round.status,
        deadlineLabel: round.deadlineLabel,
        summary: round.summary,
        description: round.description,
        positionsCount: round.positions.reduce((count, position) => count + position.posts, 0),
        department: null,
        employmentType: "Archived",
        requirements: null,
        responsibilities: null,
        howToApply: null,
        attachmentUrl: null,
      })),
    };
  }
});

const rounds = computed(() => careerIndex.value?.rounds ?? []);

const filteredRounds = computed(() => {
  const term = search.value.trim().toLowerCase();

  return rounds.value.filter((round) => {
    if (activeFilter.value !== "all" && round.status !== activeFilter.value) {
      return false;
    }

    if (!term) return true;

    return (
      round.title.toLowerCase().includes(term) ||
      round.referenceNo.toLowerCase().includes(term) ||
      round.summary.toLowerCase().includes(term) ||
      (round.department?.toLowerCase().includes(term) ?? false)
    );
  });
});

const openCount = computed(
  () => rounds.value.filter((round) => round.status === "open").length,
);

const careerImages = useHospitalMedia();

const careersIntro = computed(
  () => careersContent.value?.sectionsByKey["careers-intro"] ?? null,
);

const documents = computed(() =>
  rounds.value
    .filter((round) => round.attachmentUrl)
    .map((round) => ({
      slug: round.slug,
      title: round.title,
      referenceNo: round.referenceNo,
      attachmentUrl: round.attachmentUrl as string,
    })),
);
</script>

<template>
  <div>
    <section class="bg-surface">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div class="max-w-3xl">
          <p class="text-small font-semibold uppercase tracking-wide text-info">
            {{ careersIntro?.eyebrow || "Careers &amp; opportunities" }}
          </p>
          <h1 class="mt-2 font-display font-bold text-h1 text-ink">
            {{
              careersIntro?.title ||
              "Current openings and recruitment rounds"
            }}
          </h1>
          <p class="mt-4 text-body text-ink-muted">
            {{
              careersIntro?.summary ||
              "MeTRH recruits on a rolling basis. When there are live openings, they appear here with application instructions and upload support."
            }}
          </p>
        </div>
      </div>
    </section>

    <PageMediaStrip
      :items="careerImages"
      title="Careers at MeTRH"
      subtitle="Recruitment and capacity-building images placed between the intro and listings."
      compact
    />

    <section v-if="documents.length" class="border-b border-border bg-surface">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div class="rounded-card border border-border bg-surface-alt p-5 md:p-6">
          <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div class="max-w-2xl">
              <p class="text-small font-semibold uppercase tracking-wide text-info">
                Documents
              </p>
              <h2 class="mt-2 font-display font-semibold text-h3 text-ink">
                Vacancy attachments and supporting files
              </h2>
              <p class="mt-2 text-small text-ink-muted">
                When a recruitment round includes a brief, notice, or attachment,
                you can open it here before visiting the full posting page.
              </p>
            </div>
            <p class="text-small font-medium text-ink-muted">
              {{ documents.length }} attachment{{ documents.length === 1 ? "" : "s" }} available
            </p>
          </div>

          <div class="mt-5 grid gap-4 md:grid-cols-2">
            <article
              v-for="document in documents"
              :key="document.slug"
              class="rounded-card border border-border bg-surface p-4 shadow-card"
            >
              <p class="text-caption font-semibold uppercase tracking-wide text-accent">
                {{ document.referenceNo }}
              </p>
              <h3 class="mt-2 font-display font-semibold text-h4 text-ink">
                {{ document.title }}
              </h3>
              <p class="mt-2 text-small text-ink-muted">
                Vacancy attachment linked to this recruitment round.
              </p>
              <div class="mt-4 flex flex-wrap gap-3">
                <NuxtLink
                  :to="`/careers/${document.slug}`"
                  class="inline-flex items-center gap-1 rounded-control border border-border px-4 py-2 text-small font-semibold text-ink hover:bg-surface-alt"
                >
                  View posting
                </NuxtLink>
                <a
                  :href="document.attachmentUrl"
                  target="_blank"
                  rel="noopener"
                  class="inline-flex items-center gap-1 rounded-control bg-primary px-4 py-2 text-small font-semibold text-white hover:bg-primary-dark transition-colors"
                >
                  <Icon name="lucide:file-down" class="size-4" />
                  Open document
                </a>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>

    <section class="border-y border-border bg-surface-alt">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside class="rounded-card border border-border bg-surface p-5 lg:sticky lg:top-24 lg:self-start">
            <label for="career-search" class="block text-small font-medium text-ink">
              Search rounds
            </label>
            <div class="mt-2 flex items-center gap-2 rounded-control border border-border bg-surface px-3 py-2.5">
              <Icon name="lucide:search" class="size-4 text-ink-muted" aria-hidden="true" />
              <input
                id="career-search"
                v-model="search"
                type="search"
                placeholder="Reference or title"
                class="w-full bg-transparent text-small text-ink outline-none placeholder:text-ink-muted"
              />
            </div>

            <div class="mt-6">
              <p class="text-small font-semibold text-ink">Filter by status</p>
              <div class="mt-3 space-y-2">
                <button
                  v-for="option in statusOptions"
                  :key="option.value"
                  type="button"
                  class="w-full rounded-control border px-3 py-2 text-left text-small transition-colors"
                  :class="
                    activeFilter === option.value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-surface text-ink hover:border-primary/30 hover:bg-surface-alt'
                  "
                  @click="activeFilter = option.value"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>
          </aside>

          <div class="space-y-6">
            <div class="rounded-card border border-border bg-surface p-5 md:p-6">
              <p class="text-small font-semibold uppercase tracking-wide text-info">
                {{ openCount }} open roles
              </p>
              <p class="mt-1 text-small text-ink-muted">
                Public listings show open vacancies. Archived examples remain
                available in the fallback dataset when no live jobs are present.
              </p>
            </div>

            <div v-if="filteredRounds.length === 0" class="rounded-card border border-dashed border-border bg-surface p-10 text-center">
              <Icon name="lucide:briefcase" class="mx-auto size-6 text-ink-muted" aria-hidden="true" />
              <p class="mt-3 text-small text-ink-muted">
                No recruitment rounds match that filter.
              </p>
            </div>

            <ul v-else class="grid gap-5">
              <li
                v-for="round in filteredRounds"
                :key="round.slug"
                class="rounded-card border border-border bg-surface p-5 shadow-card"
              >
                <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p class="text-caption font-semibold uppercase tracking-wide text-accent">
                      {{ round.referenceNo }}
                    </p>
                    <h2 class="mt-2 font-display font-semibold text-h3 text-ink">
                      {{ round.title }}
                    </h2>
                    <p class="mt-2 text-small text-ink-muted">
                      {{ round.summary }}
                    </p>
                  </div>
                  <div class="flex items-center gap-2">
                    <span
                      class="rounded-full px-3 py-1.5 text-caption font-semibold uppercase tracking-wide"
                      :class="
                        round.status === 'open'
                          ? 'bg-success/10 text-success'
                          : 'bg-surface-alt text-ink-muted'
                      "
                    >
                      {{ round.status }}
                    </span>
                    <NuxtLink
                      :to="`/careers/${round.slug}`"
                      class="inline-flex items-center gap-1 text-small font-semibold text-primary hover:underline"
                    >
                      View details
                      <Icon name="lucide:arrow-right" class="size-4" />
                    </NuxtLink>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

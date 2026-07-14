<script setup lang="ts">
definePageMeta({ layout: "default" });

const { data: servicesData } = await usePublicServices();
const { data: servicesContent } = await usePageContent("services");

useSeoMeta({
  title: "Services — MeTRH",
  description:
    "Browse Meru Teaching and Referral Hospital services, grouped by department with the weekly clinic schedule for specialist outpatient care.",
});

const search = ref("");
const activeCategory = ref<string>("all");

const serviceGroups = computed(() => servicesData.value?.serviceGroups ?? []);
const clinicSchedule = computed(() => servicesData.value?.clinicSchedule ?? []);
const totalServices = computed(() => servicesData.value?.totalServices ?? 0);

const categoryOptions = computed(() => [
  {
    slug: "all",
    name: "All services",
    count: totalServices.value,
  },
  ...serviceGroups.value.map((group) => ({
    slug: group.slug,
    name: group.name,
    count: group.services.length,
  })),
]);

const filteredGroups = computed(() => {
  const term = search.value.trim().toLowerCase();

  return serviceGroups.value
    .filter(
      (group) =>
        activeCategory.value === "all" || group.slug === activeCategory.value,
    )
    .map((group) => ({
      ...group,
      services: group.services.filter((service) => {
        if (!term) return true;
        return (
          service.name.toLowerCase().includes(term) ||
          (service.summary?.toLowerCase().includes(term) ?? false) ||
          group.name.toLowerCase().includes(term)
        );
      }),
    }))
    .filter((group) => group.services.length > 0);
});

const filteredServiceCount = computed(() =>
  filteredGroups.value.reduce((count, group) => count + group.services.length, 0),
);

const activeLabel = computed(() =>
  activeCategory.value === "all"
    ? "all service areas"
    : categoryOptions.value.find((option) => option.slug === activeCategory.value)?.name ?? "selected area",
);

const serviceImages = useHospitalMedia();

const servicesIntro = computed(
  () => servicesContent.value?.sectionsByKey["services-intro"] ?? null,
);
</script>

<template>
  <div>
    <section class="bg-surface">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div class="max-w-3xl">
          <p class="text-small font-semibold uppercase tracking-wide text-info">
            {{ servicesIntro?.eyebrow || "Services" }}
          </p>
          <h1 class="mt-2 font-display font-bold text-h1 text-ink">
            {{ servicesIntro?.title || "Clinical services organized for fast access" }}
          </h1>
          <p class="mt-4 text-body text-ink-muted">
            {{
              servicesIntro?.summary ||
              "MeTRH's services are grouped by department so patients, families, and referrers can find what they need without scanning a wall of text. Search by service name or filter by category."
            }}
          </p>
        </div>

        <div class="mt-8 grid gap-4 sm:grid-cols-3">
          <div class="rounded-card border border-border bg-surface p-5">
            <p class="text-caption font-semibold uppercase tracking-wide text-ink-muted">
              Service lines
            </p>
            <p class="mt-2 tabular-nums text-h2 text-primary">
              {{ totalServices }}
            </p>
          </div>
          <div class="rounded-card border border-border bg-surface p-5">
            <p class="text-caption font-semibold uppercase tracking-wide text-ink-muted">
              Categories
            </p>
            <p class="mt-2 tabular-nums text-h2 text-primary">
              {{ serviceGroups.length }}
            </p>
          </div>
          <div class="rounded-card border border-border bg-surface p-5">
            <p class="text-caption font-semibold uppercase tracking-wide text-ink-muted">
              Clinic days
            </p>
            <p class="mt-2 tabular-nums text-h2 text-primary">
              {{ clinicSchedule.length }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <PageMediaStrip
      :items="serviceImages"
      title="Services in practice"
      subtitle="Relevant images placed between the overview and the service list."
      compact
    />

    <section class="border-y border-border bg-surface-alt">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside class="rounded-card border border-border bg-surface p-5 lg:sticky lg:top-24 lg:self-start">
            <label class="block text-small font-medium text-ink" for="service-search">
              Search services
            </label>
            <div class="mt-2 flex items-center gap-2 rounded-control border border-border bg-surface px-3 py-2.5">
              <Icon name="lucide:search" class="size-4 text-ink-muted" aria-hidden="true" />
              <input
                id="service-search"
                v-model="search"
                type="search"
                placeholder="Enter a service name"
                class="w-full bg-transparent text-small text-ink outline-none placeholder:text-ink-muted"
              />
            </div>

            <div class="mt-6">
              <p class="text-small font-semibold text-ink">Filter by category</p>
              <div class="mt-3 space-y-2">
                <button
                  v-for="option in categoryOptions"
                  :key="option.slug"
                  type="button"
                  class="flex w-full items-center justify-between gap-3 rounded-control border px-3 py-2 text-left text-small transition-colors"
                  :class="
                    activeCategory === option.slug
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-surface text-ink hover:border-primary/30 hover:bg-surface-alt'
                  "
                  @click="activeCategory = option.slug"
                >
                  <span class="leading-snug">{{ option.name }}</span>
                  <span class="tabular-nums text-caption text-ink-muted">
                    {{ option.count }}
                  </span>
                </button>
              </div>
            </div>

            <div class="mt-6 rounded-card bg-surface-alt p-4">
              <p class="text-small font-semibold text-ink">Need help fast?</p>
              <p class="mt-2 text-small text-ink-muted">
                Emergency care, visiting hours, and directions are always one
                tap away from the header and footer.
              </p>
              <NuxtLink
                to="/contact"
                class="mt-4 inline-flex items-center gap-1 text-small font-semibold text-primary hover:underline"
              >
                Contact MeTRH
                <Icon name="lucide:arrow-right" class="size-4" />
              </NuxtLink>
            </div>
          </aside>

          <div class="space-y-8">
            <div class="rounded-card border border-border bg-surface p-5 md:p-6">
              <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p class="text-small font-semibold uppercase tracking-wide text-info">
                    {{ activeLabel }}
                  </p>
                  <p class="mt-1 text-small text-ink-muted">
                    Showing {{ filteredServiceCount }} services
                  </p>
                </div>
                <NuxtLink
                  to="#clinic-schedule"
                  class="inline-flex items-center gap-1 text-small font-semibold text-primary hover:underline"
                >
                  Jump to clinic schedule
                  <Icon name="lucide:arrow-down" class="size-4" />
                </NuxtLink>
              </div>
            </div>

            <div v-if="filteredGroups.length === 0" class="rounded-card border border-dashed border-border bg-surface p-10 text-center">
              <Icon name="lucide:search-x" class="mx-auto size-6 text-ink-muted" aria-hidden="true" />
              <p class="mt-3 text-small text-ink-muted">
                No services match that search. Try another term or clear the
                category filter.
              </p>
            </div>

            <section
              v-for="group in filteredGroups"
              :key="group.slug"
              :id="group.slug"
              class="scroll-mt-28"
            >
              <div class="flex items-center justify-between gap-4">
                <div>
                  <p class="text-small font-semibold uppercase tracking-wide text-info">
                    {{ group.name }}
                  </p>
                  <p class="mt-1 text-small text-ink-muted">
                    {{ group.services.length }} services
                  </p>
                </div>
              </div>

              <ul class="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <li
                  v-for="service in group.services"
                  :key="service.slug"
                  class="rounded-card border border-border bg-surface p-4 shadow-card"
                >
                  <div class="flex items-start gap-3">
                    <span class="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-control bg-surface-alt text-primary">
                      <Icon name="lucide:stethoscope" class="size-4" aria-hidden="true" />
                    </span>
                    <div>
                      <h2 class="font-display font-semibold text-h4 text-ink">
                        {{ service.name }}
                      </h2>
                      <p class="mt-1 text-caption text-ink-muted">
                        Available through MeTRH's {{ group.name.toLowerCase() }} team.
                      </p>
                    </div>
                  </div>
                </li>
              </ul>
            </section>

            <section id="clinic-schedule" class="scroll-mt-28 rounded-card border border-border bg-surface p-5 md:p-6">
              <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p class="text-small font-semibold uppercase tracking-wide text-info">
                    Clinic schedule
                  </p>
                  <h2 class="mt-1 font-display font-semibold text-h3 text-ink">
                    Weekly specialist clinics
                  </h2>
                </div>
                <p class="text-caption text-ink-muted">
                  Most clinics start between 7 and 8 AM.
                </p>
              </div>

              <div class="mt-6 overflow-x-auto">
                <table class="min-w-full border-separate border-spacing-0">
                  <thead>
                    <tr class="text-left">
                      <th class="border-b border-border px-4 py-3 text-caption font-semibold uppercase tracking-wide text-ink-muted">
                        Day
                      </th>
                      <th class="border-b border-border px-4 py-3 text-caption font-semibold uppercase tracking-wide text-ink-muted">
                        Clinics
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in clinicSchedule" :key="row.day" class="align-top">
                      <td class="border-b border-border px-4 py-4 font-semibold text-ink">
                        {{ row.dayLabel }}
                      </td>
                      <td class="border-b border-border px-4 py-4 text-small text-ink-muted">
                        <ul class="flex flex-wrap gap-2">
                          <li
                            v-for="clinic in row.clinics"
                            :key="clinic"
                            class="rounded-full bg-surface-alt px-3 py-1.5"
                          >
                            {{ clinic }}
                          </li>
                        </ul>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

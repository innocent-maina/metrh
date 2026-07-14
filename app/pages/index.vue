<script setup lang="ts">
const { data: homeContent } = await usePageContent("home");

useSeoMeta({
  title: "MeTRH — Meru Teaching and Referral Hospital",
  description:
    "Meru Teaching and Referral Hospital (MeTRH): the principal referral hospital for Upper Eastern Kenya — public, affordable, specialized, and a teaching and research institution.",
  ogTitle: "MeTRH — Meru Teaching and Referral Hospital",
  ogDescription:
    "Exemplary Health Care for You. Public referral hospital and teaching institution serving Meru, Tharaka-Nithi, Marsabit, and Isiolo counties.",
});

const atAGlanceSection = computed(
  () => homeContent.value?.sectionsByKey["home-at-a-glance"] ?? null,
);

const stats = computed(() => {
  const fallback = [
    { value: "1.4M+", label: "Catchment population" },
    { value: "500+", label: "Full-time staff" },
    { value: "~1,000", label: "Outpatients per day" },
    { value: "7.6", label: "Hectares of land" },
  ];

  const items =
    homeContent.value?.itemsBySectionId[atAGlanceSection.value?.id ?? ""] ?? [];

  if (!items.length) return fallback;

  return items.map((item) => ({
    value: item.title,
    label: item.description || "",
  }));
});
</script>

<template>
  <div>
    <NoticeBoardHero />
    <!-- <QuickAccessTiles /> -->
    <ServicesOverviewTeaser />
    <StatsStrip
      :title="atAGlanceSection?.title || 'MeTRH at a glance'"
      :note="atAGlanceSection?.summary || undefined"
      :stats="stats"
    />
    <CommunityImpact />
    <TeachingAffiliations page-slug="home" />
    <CareersTendersCta />
  </div>
</template>

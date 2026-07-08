<script setup lang="ts">
useSeoMeta({
  title: "MeTRH — Meru Teaching and Referral Hospital",
  description:
    "Meru Teaching and Referral Hospital (MeTRH): the principal referral hospital for Upper Eastern Kenya — public, affordable, specialized, and a teaching and research institution.",
  ogTitle: "MeTRH — Meru Teaching and Referral Hospital",
  ogDescription:
    "Exemplary Health Care for You. Public referral hospital and teaching institution serving Meru, Tharaka-Nithi, Marsabit, and Isiolo counties.",
});

// Real, confirmed figures from content.md §4 (KMHFR-sourced where noted).
const stats = [
  { value: "1.4M+", label: "Catchment population" },
  { value: "500+", label: "Full-time staff" },
  { value: "~1,000", label: "Outpatients per day" },
  { value: "7.6", label: "Hectares of land" },
];
</script>

<template>
  <div>
    <NoticeBoardHero />
    <!-- <QuickAccessTiles /> -->
    <ServicesOverviewTeaser />
    <StatsStrip title="MeTRH at a glance" :stats="stats" />
    <CommunityImpact />
    <TeachingAffiliations />
    <CareersTendersCta />
  </div>
</template>

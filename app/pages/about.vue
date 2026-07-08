<script setup lang="ts">
useSeoMeta({
  title: "About MeTRH — Meru Teaching and Referral Hospital",
  description:
    "MeTRH's vision, mission, core values, scale, growth projects, and leadership — the principal referral hospital for Upper Eastern Kenya.",
});

// Scale & capacity — content.md §4. Bed count uses the KMHFR (official
// registry) figure per the build note: "use KMHFR figures as the verified
// numbers, but flag to client to confirm current bed count given the new
// 250-bed ward block under construction." Shown with an inline note rather
// than silently picking a number — this is a live discrepancy, not settled.
const scaleStats = [
  { value: "306", label: "Inpatient beds (KMHFR)" },
  { value: "5", label: "ICU beds" },
  { value: "2", label: "General surgical theatres" },
  { value: "~150%", label: "Average bed occupancy" },
];
</script>

<template>
  <div>
    <section class="bg-primary text-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <p class="text-small font-semibold uppercase tracking-wide text-accent">
          About MeTRH
        </p>
        <h1 class="mt-2 font-display font-bold text-h1 max-w-3xl">
          The principal referral hospital for Upper Eastern Kenya
        </h1>
        <p class="mt-4 text-body text-white/85 max-w-2xl">
          A Level 6 specialized and tertiary referral hospital serving Meru,
          Tharaka-Nithi, Marsabit, and Isiolo counties — public, affordable, and
          specialized, with training and research built into how it operates.
        </p>
      </div>
    </section>

    <MissionValues />

    <StatsStrip
      title="Scale & capacity"
      :stats="scaleStats"
      note="Bed count under confirmation as the new ward block comes online — legacy figures list 360, the KMHFR registry lists 306."
    />

    <GrowthProjects />
    <TeachingAffiliations />
    <LeadershipSection />
  </div>
</template>

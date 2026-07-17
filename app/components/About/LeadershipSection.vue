<script setup lang="ts">
interface TeamMember {
  id: string;
  full_name: string;
  title: string;
  bio: string | null;
  photo_url: string | null;
  department: string | null;
}

// DATA GAP (content.md §8, §14): CEO name/title conflicts across sources
// (Dr. Bernard Murithi vs. Dr. Gacheri Kathiiri, "CEO" vs "Ag. CEO"), and
// board/leadership photos aren't confirmed. Per the build brief, none of
// that gets hardcoded here — leadership is entirely dashboard-managed via
// `team_members`, populated once the client confirms current names/titles/
// photos. This component only renders what's actually in the table.
const resolveMediaUrl = usePublicStorageUrl();

const { data: teamMembers, pending } = await useAsyncData<TeamMember[]>(
  "team-members-active",
  async () => {
    try {
      const response = await $fetch<{ teamMembers: TeamMember[] }>(
        "/api/public/leadership",
      );
      return response.teamMembers ?? [];
    } catch (error) {
      console.warn("Unable to load leadership profiles:", error);
      return [];
    }
  },
  { default: () => [] },
);
</script>

<template>
  <section class="bg-surface" aria-labelledby="leadership-heading">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">
      <p class="text-small font-semibold uppercase tracking-wide text-info">
        Leadership
      </p>
      <h2
        id="leadership-heading"
        class="mt-2 font-display font-semibold text-h2 text-ink"
      >
        Board &amp; leadership team
      </h2>

      <div
        v-if="pending"
        class="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
        aria-busy="true"
      >
        <div
          v-for="n in 3"
          :key="n"
          class="rounded-card border border-border p-6 animate-pulse"
        >
          <div class="size-16 rounded-full bg-surface-alt" />
          <div class="mt-4 h-4 w-2/3 rounded bg-surface-alt" />
          <div class="mt-2 h-3 w-1/2 rounded bg-surface-alt" />
        </div>
      </div>

      <ul
        v-else-if="teamMembers && teamMembers.length > 0"
        class="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <li
          v-for="member in teamMembers"
          :key="member.id"
          class="rounded-card border border-border p-6"
        >
          <img
            v-if="member.photo_url"
            :src="resolveMediaUrl(member.photo_url)"
            :alt="member.full_name"
            class="size-16 rounded-full object-cover"
          />
          <div
            v-else
            class="flex size-16 items-center justify-center rounded-full bg-surface-alt text-ink-muted"
          >
            <Icon name="lucide:user" class="size-6" aria-hidden="true" />
          </div>
          <h3 class="mt-4 font-display font-semibold text-h4 text-ink">
            {{ member.full_name }}
          </h3>
          <p class="text-small text-primary font-medium">{{ member.title }}</p>
          <p v-if="member.bio" class="mt-2 text-small text-ink-muted">
            {{ member.bio }}
          </p>
        </li>
      </ul>

      <div
        v-else
        class="mt-10 rounded-card border border-dashed border-border bg-surface-alt p-10 text-center"
      >
        <Icon
          name="lucide:users"
          class="size-6 mx-auto text-ink-muted"
          aria-hidden="true"
        />
        <p class="mt-3 text-small text-ink-muted max-w-md mx-auto">
          Leadership profiles are added and confirmed by the hospital's
          communications team and will appear here once published.
        </p>
      </div>
    </div>
  </section>
</template>

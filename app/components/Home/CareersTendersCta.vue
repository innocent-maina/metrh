<template>
  <section class="bg-surface" aria-label="Careers and tenders">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-16">
      <div class="grid md:grid-cols-2 gap-6">
        <div class="rounded-card border border-border bg-white p-8">
          <span
            class="flex size-10 items-center justify-center rounded-control bg-accent/15 text-accent"
          >
            <Icon name="lucide:briefcase" class="size-5" aria-hidden="true" />
          </span>
          <h2 class="mt-4 font-display font-semibold text-h3 text-ink">
            Careers &amp; opportunities
          </h2>
          <p class="mt-2 text-small text-ink-muted">
            MeTRH recruits on a rolling basis — see current openings and how to
            apply.
          </p>
          <NuxtLink
            to="/careers"
            class="mt-5 inline-flex items-center gap-1 text-small font-semibold text-primary hover:underline"
          >
            View open positions
            <Icon name="lucide:arrow-right" class="size-4" />
          </NuxtLink>
        </div>

        <div class="rounded-card border border-border bg-white p-8">
          <span
            class="flex size-10 items-center justify-center rounded-control bg-primary/10 text-primary"
          >
            <Icon name="lucide:file-text" class="size-5" aria-hidden="true" />
          </span>
          <h2 class="mt-4 font-display font-semibold text-h3 text-ink">
            Tenders &amp; downloads
          </h2>
          <p class="mt-2 text-small text-ink-muted">
            Open tenders, registered supplier lists, and policy documents for
            procurement partners.
          </p>
          <NuxtLink
            to="/tenders"
            class="mt-5 inline-flex items-center gap-1 text-small font-semibold text-primary hover:underline"
          >
            View tenders
            <Icon name="lucide:arrow-right" class="size-4" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

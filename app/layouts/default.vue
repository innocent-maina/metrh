<template>
  <div class="flex min-h-screen flex-col bg-surface">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-control focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
    >
      Skip to main content
    </a>

    <AppHeader />

    <main id="main-content" class="flex-1">
      <slot />
    </main>

    <AppFooter />
  </div>
</template>

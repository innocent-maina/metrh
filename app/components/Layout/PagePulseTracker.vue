<script setup lang="ts">
const route = useRoute();
const sessionId = useState<string>("metrh-page-pulse-session", () => "");

function getSessionId() {
  if (!import.meta.client) return "";

  if (!sessionId.value) {
    sessionId.value = crypto.randomUUID();
  }

  return sessionId.value;
}

async function recordPulse() {
  if (!import.meta.client) return;

  const session = getSessionId();
  if (!session) return;

  try {
    await $fetch("/api/page-pulses", {
      method: "POST",
      body: {
        sessionId: session,
        path: route.fullPath,
        title: document.title,
        referrer: document.referrer || null,
        language: navigator.language || null,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      },
    });
  } catch {
    // Visitor analytics must never interfere with page navigation.
  }
}

onMounted(() => {
  void recordPulse();
});

watch(
  () => route.fullPath,
  () => {
    void recordPulse();
  },
);
</script>

<template>
  <span aria-hidden="true" class="hidden" />
</template>

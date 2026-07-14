<script setup lang="ts">
const { data: siteSettings } = await useSiteSettings();

function normalizeKenyanNumber(input: string) {
  const digits = input.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  if (digits.startsWith("254")) return digits;
  return digits;
}

const whatsappHref = computed(() => {
  if (siteSettings.value?.whatsapp_href) {
    return siteSettings.value.whatsapp_href;
  }

  const number = normalizeKenyanNumber(
    siteSettings.value?.emergency_line ?? "",
  );
  const message = encodeURIComponent(
    "Hello MeTRH, I would like to ask about the hospital services.",
  );
  return number ? `https://wa.me/${number}?text=${message}` : "#";
});
</script>

<template>
  <a
    :href="whatsappHref"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Chat with MeTRH on WhatsApp"
    class="fixed bottom-24 right-4 z-[60] inline-flex items-center gap-3 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-elevated transition-transform hover:-translate-y-0.5 hover:shadow-lg md:bottom-6 md:right-6"
  >
    <span class="flex size-10 items-center justify-center rounded-full bg-surface/15">
      <Icon name="mdi:whatsapp" class="size-6" aria-hidden="true" />
    </span>
    <span class="hidden text-small font-semibold sm:inline">
      {{ siteSettings?.whatsapp_label || "WhatsApp us" }}
    </span>
  </a>
</template>

export default defineEventHandler(() => {
  const config = useRuntimeConfig();
  const baseUrl = config.public.siteUrl.replace(/\/$/, "");

  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /dashboard",
    "Disallow: /dashboard/",
    `Sitemap: ${baseUrl}/sitemap.xml`,
  ].join("\n");
});

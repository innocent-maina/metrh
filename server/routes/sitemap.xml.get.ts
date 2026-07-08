export default defineEventHandler(() => {
  const config = useRuntimeConfig();
  const baseUrl = config.public.siteUrl.replace(/\/$/, "");

  const routes = [
    "/",
    "/about",
    "/services",
    "/contact",
    "/blog",
    "/blog/first-spinal-surgeries-in-the-region",
    "/blog/oesophageal-cancer-screening-partnership",
    "/blog/new-ward-block-and-cancer-centre",
    "/blog/community-blood-drive-results",
    "/events",
    "/events/arsenal-kenya-supporters-club-blood-drive",
    "/events/manchester-united-fans-kenya-blood-donation",
    "/events/county-mass-blood-donation",
    "/careers",
    "/careers/metrh-hrm-02-2025-2026",
    "/tenders",
    "/privacy-policy",
    "/terms-of-use",
    "/cookie-policy",
  ];

  const urls = routes
    .map(
      (path) => `
    <url>
      <loc>${baseUrl}${path}</loc>
      <changefreq>weekly</changefreq>
      <priority>${path === "/" ? "1.0" : "0.7"}</priority>
    </url>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;
});

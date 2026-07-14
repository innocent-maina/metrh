import { supabaseAdmin } from "~~/server/utils/supabase-admin";

function uniqueRoutes(routes: string[]) {
  return Array.from(new Set(routes));
}

type RouteSlugRow = {
  slug: string;
};

export default defineEventHandler(async () => {
  const config = useRuntimeConfig();
  const baseUrl = config.public.siteUrl.replace(/\/$/, "");
  let dynamicRoutes: string[] = [];

  try {
    const admin = supabaseAdmin();
    const [
      blogPostsResult,
      servicesResult,
      jobPostingsResult,
      tendersResult,
    ] = await Promise.all([
      admin.from("blog_posts").select("slug").eq("status", "published"),
      admin.from("services").select("slug").eq("is_active", true),
      admin.from("job_postings").select("slug").eq("status", "open"),
      admin.from("tenders").select("slug").neq("status", "draft"),
    ]);

    const blogRows = (blogPostsResult.data ?? []) as RouteSlugRow[];
    const serviceRows = (servicesResult.data ?? []) as RouteSlugRow[];
    const jobRows = (jobPostingsResult.data ?? []) as RouteSlugRow[];
    const tenderRows = (tendersResult.data ?? []) as RouteSlugRow[];

    dynamicRoutes = [
      ...blogRows.map((row) => `/blog/${row.slug}`),
      ...serviceRows.map((row) => `/services/${row.slug}`),
      ...jobRows.map((row) => `/careers/${row.slug}`),
      ...tenderRows.map((row) => `/tenders/${row.slug}`),
    ];
  } catch (error) {
    console.warn("[sitemap] Falling back to static routes.", error);
  }

  const routes = uniqueRoutes([
    "/",
    "/about",
    "/services",
    "/contact",
    "/blog",
    "/careers",
    "/tenders",
    "/privacy-policy",
    "/terms-of-use",
    "/cookie-policy",
    ...dynamicRoutes,
  ]);

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

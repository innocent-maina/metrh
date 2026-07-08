import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

export default defineNuxtConfig({
  future: { compatibilityVersion: 4 },
  compatibilityDate: "2025-05-12",

  devtools: { enabled: true },

  modules: ["@nuxtjs/supabase", "@nuxt/icon", "@vueuse/nuxt"],

  app: {
    head: {
      htmlAttrs: { lang: "en" },
      link: [
        { rel: "icon", type: "image/png", href: "/icon.png" },
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      ],
      meta: [{ name: "theme-color", content: "#0B4F5C" }],
    },
  },

  components: [{ path: "~/components", pathPrefix: false }],

  imports: {
    dirs: ["composables", "composables/**"],
  },

  css: ["~/assets/css/main.css"],

  vite: {
    plugins: [tailwindcss()],
  },

  // Supabase reads/writes for RLS-sensitive tables happen through server/api
  // and server/utils only. The client module below is used for public,
  // already-RLS-open reads (e.g. published blog posts) and for the staff
  // login/session flow. See server/utils/supabase-admin.ts for the
  // service-role client, which is never imported in any client bundle.
  supabase: {
    redirect: true,
    redirectOptions: {
      login: "/dashboard/login",
      callback: "/dashboard/confirm",
      exclude: [
        "/",
        "/about",
        "/services",
        "/services/**",
        "/contact",
        "/blog",
        "/blog/**",
        "/events",
        "/events/**",
        "/careers",
        "/careers/**",
        "/tenders",
        "/tenders/**",
        "/privacy-policy",
        "/terms-of-service",
        "/cookie-policy",
      ],
    },
    types: fileURLToPath(new URL("./types/database.types.ts", import.meta.url)),
    cookieOptions: {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // staff sessions: 7 days
    },
  },

  runtimeConfig: {
    supabaseSecretKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    public: {
      supabaseUrl: process.env.SUPABASE_URL ?? "",
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "",
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL ?? "https://www.metrh.or.ke",
    },
  },

  typescript: {
    strict: true,
    typeCheck: true,
  },

  icon: {
    serverBundle: "remote",
    clientBundle: { scan: true },
  },

  nitro: {
    prerender: {
      routes: ["/sitemap.xml", "/robots.txt"],
    },
  },
});

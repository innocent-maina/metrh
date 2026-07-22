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
      meta: [{ name: "theme-color", content: "#0f64a1" }],
    },
  },

  components: [{ path: "~/components", pathPrefix: false }],

  imports: {
    dirs: ["composables", "composables/**"],
  },

  css: ["~/assets/css/main.css"],

  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ["@vue/devtools-core", "@vue/devtools-kit"],
    },
  },

  // Supabase reads/writes for RLS-sensitive tables happen through server/api
  // and server/utils only. The client module below is used for public,
  // already-RLS-open reads (e.g. published blog posts) and for the staff
  // login/session flow. See server/utils/supabase-admin.ts for the
  // service-role client, which is never imported in any client bundle.
  supabase: {
    redirect: false,
    useSsrCookies: true,
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
        "/terms-of-use",
        "/cookie-policy",
      ],
    },
    types: fileURLToPath(new URL("./types/database.types.ts", import.meta.url)),
    cookieOptions: {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      // Local `nuxt dev` runs over http://localhost, even if NODE_ENV is set to
      // production in the shell. Secure cookies would never round-trip there,
      // which makes serverSupabaseUser() think the session is missing.
      secure: !process.dev && process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // staff sessions: 7 days
    },
    clientOptions: {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    },
  },

  routeRules: {
    "/dashboard": { ssr: false },
    "/dashboard/**": { ssr: false },
  },

  runtimeConfig: {
    supabase: {
      serviceKey: process.env.NUXT_SUPABASE_SERVICE_KEY ?? "",
      secretKey: process.env.NUXT_SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    },
    public: {
      supabase: {
        url: process.env.NUXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "",
        key: process.env.NUXT_PUBLIC_SUPABASE_KEY ?? process.env.SUPABASE_ANON_KEY ?? "",
      },
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
});

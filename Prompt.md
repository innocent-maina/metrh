# MeTRH Website — Build Prompt

You are building the public website and staff dashboard for **Meru Teaching and Referral Hospital (MeTRH)** — a real, public, Level 6 referral hospital in Meru, Kenya. This is a live institutional website, not a demo or a SaaS product. Every design and content decision should read as "this is a hospital we'd trust," not "this is a startup landing page."

Two files ship alongside this prompt and are your source of truth. Read both in full before writing any code:

- `content.md` — everything currently known about MeTRH: mission/vision/values, services, clinic schedule, leadership, milestones, community engagement, careers, tenders, and an explicit list of data gaps that must NOT be guessed at.
- `schema.sql` — the finalized Supabase Postgres schema (public schema), including enums, RLS policies, and storage bucket policies. Do not redesign it. Extend only if a genuine gap appears, and call it out explicitly rather than silently adding tables.

---

## 1. Non-negotiable stack conventions

These are house rules, not suggestions. Every one of these has bitten us before when skipped.

- **Nuxt 4** — latest app directory conventions (`app/` structure), TypeScript throughout.
- **Supabase, server-side only.** All Supabase calls (including reads that touch RLS-sensitive tables) go through Nuxt server routes/utilities (`server/api/*`, `server/utils/*`) using the server client. Never expose the service role key to the client. Public reads can use the anon key client-side where RLS already allows it (e.g. published blog posts), but anything touching staff data, storage signed URLs, or writes must be server-mediated.
- **TypeScript strict mode.** No `any` used to paper over a real type problem. Generate types from the Supabase schema (`supabase gen types typescript`) and use them everywhere — don't hand-roll duplicate interfaces that drift from the DB.
- **Tailwind v4, CSS-native.** Configuration lives in `@theme {}` in CSS, not a `tailwind.config.js` JS object. No hardcoded hex colors anywhere in components — every color reference goes through the theme tokens defined in section 3.
- **No Pinia.** State management is composables (`useState`, custom composables). If you reach for a global store, stop and use a composable instead.
- **Lucide icons only.** No other icon sets, no emoji-as-icon.
- **No emojis** anywhere in UI copy, dashboard labels, error messages, or commit messages. This is a hospital, keep it clean and clinical-appropriate.
- **No serif display fonts.** Typography is specified in section 3 — Poppins and Plus Jakarta Sans. Do not substitute a serif for "gravitas." Readability and warmth over formality-signaling.

---

## 2. Brand & design direction

Apply the frontend-design skill's process (token plan → self-critique against generic AI defaults → build) before writing UI code. Below is the locked design brief — treat it as the brief you critique against, not a starting suggestion to override.

### Why this matters

MeTRH's own words are "Exemplary Health Care for You" — client-centered, affordable, specialized. The audience is: patients and families (often first-time web users, on mid-range Android phones, sometimes anxious — a family looking for visiting hours or an emergency line, not browsing for fun), medical professionals considering referrals or teaching affiliations, suppliers checking tenders, and job seekers. The design has to work under stress, at low bandwidth, and build trust fast. This is the opposite brief from a SaaS product — familiarity and legibility beat novelty.

### Explicitly avoid

- The cream-background-plus-serif-plus-terracotta look (reads as generic AI output, and a serif display face reads as either luxury-brand or law-firm, wrong register for a public hospital).
- Near-black backgrounds with a neon accent — wrong tone entirely for healthcare.
- Anything that looks like a fintech or SaaS dashboard aesthetic on the public-facing site: no glassmorphism, no gradient-mesh blobs, no oversized rounded pill buttons as the entire personality.
- Stock "diverse doctors smiling with arms crossed" imagery clichés if you're sourcing/generating photography direction — prefer descriptions grounded in what MeTRH actually is (the ward block, the Meru highlands setting, real clinical detail) over generic hospital-stock-photo tropes.

### Token system (locked)

**Color:**

- `--color-primary`: `#0F64A1` — MeTRH logo blue. Primary brand color, headers, primary buttons, links.
- `--color-primary-dark`: `#0A4D7D` — deeper blue for hover/active states and the footer.
- `--color-accent`: `#92B74A` — MeTRH logo green. Use for supporting highlights, badges, and selective emphasis.
- `--color-surface`: `#F6FBFE` — page background. A very light blue-white that stays close to the logo palette.
- `--color-surface-alt`: `#EEF6EF` — section alternation and card backgrounds, with a faint green tint.
- `--color-ink`: `#16211F` — body text, near-black with a slight green-black undertone (ties to the teal without being literal).
- `--color-ink-muted`: `#5A6663` — secondary text, captions, metadata.
- `--color-border`: `#DDE3E1` — hairlines, dividers, card borders.
- Semantic: success `#3E7D5A`, warning `#C77B1E`, danger `#B3413C`, info `#2F6E8C` — keep these desaturated enough to sit next to the primary palette without clashing.

All of the above are defined once in `@theme {}` as CSS custom properties and referenced by name everywhere — never inline hex in a component.

**Typography:**

- Display/headings: **Poppins** (600/700 weights) — geometric, warm, highly legible at large sizes, reads as approachable rather than corporate-cold.
- Body/UI: **Plus Jakarta Sans** (400/500/600) — excellent readability at small sizes, works well for dense content like the clinic schedule table and service listings.
- Set a real type scale (not ad hoc `text-lg`/`text-xl` scattered around): define `--text-hero`, `--text-h1` through `--text-h4`, `--text-body`, `--text-small`, `--text-caption` in the theme, with line-height and letter-spacing set intentionally per size, not left at Tailwind defaults.
- Numerals (stats like "1.4 million catchment," "500+ staff," "360 beds") should use tabular figures and a slightly heavier weight — these numbers are doing credibility work, don't let them look like body text.

**Layout concept:**

- Homepage: a hero with a **rotating/sliding panel** (not autoplay-only — include visible prev/next controls and pause-on-hover, respect `prefers-reduced-motion` by disabling autoplay) surfacing 3–5 rotating items pulled from real content: emergency line + visiting hours (always present, pinned first), then rotating milestones/news from the blog (spinal surgery milestone, oesophageal cancer partnership, blood drive results). This is the signature element — a real hospital "notice board" feeling, not a generic hero carousel of stock photography. Below the fold: quick-access tiles (Find a Service, Clinic Schedule, Emergency, Careers, Tenders), a services overview grouped by category, a milestones/impact strip with real numbers, a leadership/teaching-affiliation credibility section, and a community-impact module for the blood-drive stories.
- Interior pages (Services, Careers, Tenders) favor a two-column layout on desktop: filterable list/sidebar + content, collapsing to a single column with a filter drawer on mobile.
- Signature element: the sliding "notice board" hero panel described above — this is the one place to spend visual ambition. Everywhere else should be quiet, legible, well-spaced.

Do the brainstorm → critique → build sequence from the frontend-design skill in your own planning before generating markup; this brief is deliberately specific so you're not guessing, but still exercise judgment on spacing, component-level composition, and responsive behavior.

---

## 3. Public site map

Build these as the primary public routes. Use `content.md` as the literal source of copy — do not invent facts, statistics, or quotes not present there. Where `content.md` flags a data gap (CEO name/title, bed count, Corporate Clinic scope, etc.), use a clearly-marked placeholder in a code comment (`<!-- CONFIRM WITH CLIENT: ... -->`) rather than guessing — do not publish unverified specifics like leadership names.

1. **Home** — hero notice-board (see above), quick-access tiles, services overview, milestones/impact numbers, community impact (blood drives), teaching affiliations, CTA to careers/tenders.
2. **About** — vision/mission/core values/strategic goals, scale & capacity stats, growth & development (new ward block, Cancer Centre PPP project), institutional role & teaching affiliations, leadership/team (pull from `team_members`).
3. **Services** — grouped by `service_categories` → `services`, filterable/searchable given the 80+ item list from `content.md` §5. Include the clinic schedule as a dedicated, readable table/grid (from `clinic_schedule`), not buried in prose.
4. **Contact** — emergency line prominent above the fold, visiting hours, address/map, contact form (writes to `contact_submissions`), general enquiries vs. emergency clearly distinguished.
5. **Blog** — list + detail pages, sourced from `blog_posts` (published only), category/tag filtering, this is also where milestones/news content from `content.md` §10 lives.
6. **Events & Media** — album grid sourced from `media_albums`/`media_items` (published only), event date, photo/video galleries (blood drives, milestones, camps).
7. **Careers & Opportunities** — list of `job_postings` where `status = 'open'`, detail page per posting with a real application form (writes to `job_applications`, resume upload to the `documents` bucket via a signed upload URL from a server route).
8. **Tenders & Downloads** — `tenders` where `status <> 'draft'`, tender detail with attached `tender_documents` (signed download URLs), plus a general `downloads` section (registered suppliers list, policy PDFs).
9. **Legal pages** — `/privacy-policy`, `/terms-of-service`, `/cookie-policy`, all rendered from the `pages` table (do not hardcode legal copy into `.vue` files — it must be dashboard-editable).
10. **404 / error page** — on-brand, includes emergency line and a way back to Home — someone landing here might be stressed, don't make it cute.

---

## 4. `/dashboard` — staff CRUD

Gate the entire `/dashboard/**` route tree behind Supabase Auth + role check via a Nuxt middleware that calls `has_role()`/checks `user_roles` server-side. Unauthenticated or unauthorized users get redirected to a dashboard login page, not a generic 404.

### Structure

- `/dashboard` — role-aware overview: recent contact submissions, applications needing review, tenders closing soon, quick links scoped to what that user's roles can actually do. Don't show a procurement widget to someone with only `content_editor`.
- `/dashboard/blog` — list/create/edit/delete `blog_posts`, category/tag management, draft/publish workflow, image upload to `media` bucket, SEO fields editable inline (title/description/OG image), slug auto-generated from title but editable.
- `/dashboard/contact` — inbox view of `contact_submissions`, status workflow (new → read → responded → archived), internal notes field, cannot edit the submission content itself (that's the visitor's words).
- `/dashboard/careers` — CRUD `job_postings` (draft/open/closed workflow), and a separate applications view per posting with status pipeline (submitted → shortlisted → interviewing → rejected/hired), resume download via signed URL, reviewer notes.
- `/dashboard/tenders` — CRUD `tenders`, multi-document upload/management per tender (`tender_documents`), status workflow (draft → open → closed → awarded), plus a `/dashboard/downloads` sibling for the non-tender-specific documents.
- `/dashboard/media` — CRUD `media_albums` and their `media_items` (bulk image/video upload, reordering, captions), publish workflow.
- `/dashboard/services` — CRUD `service_categories`, `services`, and `clinic_schedule` — this is the table hospital staff will touch most often for routine updates, so it should be the most frictionless CRUD in the dashboard: inline editing over multi-step forms where reasonable.
- `/dashboard/team` — CRUD `team_members` (leadership/board photos, bios, ordering).
- `/dashboard/pages` — edit the legal pages and any other static `pages` rows.
- `/dashboard/users` — **super_admin only.** Invite staff (Supabase Auth invite flow), assign/revoke roles via `user_roles`, deactivate accounts (`profiles.is_active`), view who has what access. This is the highest-stakes screen in the dashboard — require a confirmation step for role changes and deactivation.
- `/dashboard/settings` — edit `site_settings` singleton (emergency line, hours, social links, homepage hero content) — super_admin only.

### Dashboard UX requirements

- Every list view: search, filter by status, sort, pagination — don't ship an unpaginated table for `blog_posts` or `job_applications` that will grow over time.
- Every create/edit form: clear save/cancel, inline validation, optimistic-but-honest feedback (a toast that says "Published" only after the write actually succeeds, not before).
- Every destructive action (delete post, revoke role, reject application): confirmation dialog naming what will be affected, no silent deletes.
- Every table with a FK to storage (resumes, tender docs, media): upload progress state, file type/size validation before upload starts, not after.
- Empty states are instructional, not blank ("No tenders yet — create your first one" with a direct CTA, not just an empty table).
- Keep the dashboard visually distinct from the public site (it can use a more conventional admin-UI pattern — sidebar nav, data tables) but still built from the same design tokens, same fonts — it should feel like the same institution's internal tool, not a bolted-on third-party admin panel.

---

## 5. Auth

- Supabase Auth, email/password for staff (no public self-signup — accounts are provisioned via the `/dashboard/users` invite flow only).
- `profiles` row created automatically on auth user creation (DB trigger or server route on invite acceptance) — don't leave this as a manual step.
- Session handling via Supabase SSR helpers for Nuxt, cookies not localStorage.
- Route middleware checks both "is authenticated" and "has at least one relevant role" before rendering any `/dashboard/**` page — check at the server route level too, not just client-side route guards, since RLS is the real backstop but a broken UI check shouldn't be the only line of defense.
- Password reset flow, not just login — staff will forget passwords.

---

## 6. SEO — taken seriously from day one, not bolted on

- Server-rendered (Nuxt SSR/SSG where content allows) — no critical content hidden behind client-only rendering. Services, blog posts, tenders, and job postings must be crawlable and indexable.
- Per-page `<Head>` meta: unique `title`, `description`, canonical URL, Open Graph + Twitter card tags, sourced from each table's `seo_*` fields where present, with sensible fallbacks generated from title/excerpt where not.
- `sitemap.xml` generated dynamically from published content (blog posts, services, open tenders, open jobs, static pages) — not a static hand-written file that goes stale.
- `robots.txt` — allow public routes, disallow `/dashboard/**`.
- Structured data (JSON-LD): `MedicalOrganization` / `Hospital` schema on the homepage and About page with real fields from `content.md` (address, phone, emergency line, medical specialties); `JobPosting` schema on career detail pages; `Article` schema on blog posts.
- Semantic HTML throughout — real heading hierarchy, `<nav>`/`<main>`/`<footer>` landmarks, not div soup — this matters for both SEO and accessibility.
- Image optimization: `nuxt/image` (or equivalent), proper `alt` text sourced from captions where available, never left empty on content images.
- Core Web Vitals discipline: no layout shift from the hero carousel loading late, lazy-load below-the-fold images, keep the JS bundle lean — this is a hospital site that needs to work on a mid-range Android phone on 3G in rural Meru, not just a fast office connection.

---

## 7. Accessibility & resilience (quality floor, not optional)

- Responsive down to small mobile viewports — this is likely the majority of real traffic.
- Visible keyboard focus states everywhere, full keyboard navigation through the hero carousel, forms, and dashboard.
- `prefers-reduced-motion` respected — the hero carousel and any scroll-triggered reveals must have a static/no-motion fallback.
- Color contrast meets WCAG AA at minimum, given this is a public institutional site serving an older/general-population audience, not a tech-savvy niche.
- Forms (contact, job application, tender/document search) have real error states in plain language — "Enter a valid email address," not a generic red border with no text.
- Design for the emergency line and visiting hours to be reachable within one interaction from any page (footer, minimum) — a family in a hurry should never have to hunt for this.

---

## 8. What NOT to do

- Do not fabricate hospital facts, statistics, leadership names/titles, or quotes beyond what's in `content.md` — where it flags a gap, mark it as a gap in the code/content, don't fill it in with something plausible-sounding.
- Do not redesign the schema in `schema.sql` — extend it only with a clearly flagged, separate migration if an unavoidable gap surfaces during the build, and explain why.
- Do not use Pinia, do not hardcode colors, do not reach for a serif display font, do not use emojis in copy or UI.
- Do not put Supabase service-role credentials or any privileged logic in client-side code.
- Do not build the public site as a client-rendered SPA that hides content from crawlers — SEO is a stated priority, treat it as one from the first commit, not a later pass.
- Do not make the dashboard visually indistinguishable from a generic open-source admin template — it should still feel like it belongs to the same institution as the public site.
- Do not ship destructive dashboard actions (delete, revoke access) without a confirmation step.

---

## 9. Suggested build order

Work in this order so there's always something reviewable, rather than a big-bang reveal:

1. Nuxt 4 project scaffold, Tailwind v4 `@theme` token setup, font loading, base layout/nav/footer shell.
2. Supabase client setup (server + browser), generated types from `schema.sql`, auth scaffolding + `/dashboard` middleware.
3. Static/content-light pages first: Home shell (with placeholder-but-structurally-correct hero), About, Legal pages wired to `pages` table.
4. Services + Clinic Schedule (public) — this is the densest content set, get the data model/UI pattern right early.
5. Blog (public + dashboard CRUD) — establishes the pattern (list/detail/dashboard-CRUD/SEO fields/storage upload) reused by every other content type.
6. Careers, Tenders/Downloads, Events & Media — public + dashboard, following the pattern established by blog.
7. Contact form (public) + dashboard inbox.
8. `/dashboard/users` and `/dashboard/settings` last, since they depend on every role having something real to manage first.
9. SEO pass (sitemap, structured data, meta audit) + accessibility pass + performance pass as an explicit final phase, not skipped under deadline pressure.

Confirm your understanding of `content.md` and `schema.sql`, flag any ambiguity up front, then start at step 1.

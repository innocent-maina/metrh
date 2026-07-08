-- ============================================================================
-- MeTRH (Meru Teaching & Referral Hospital) — Supabase Schema
-- Public schema only. Nuxt 4 + Supabase.
-- ============================================================================
-- Design notes:
-- 1. auth.users stays untouched. Every human user gets a row in profiles
--    (1:1) and zero or more rows in user_roles (roles are additive, not
--    a single enum on profiles — an editor could also be hr, etc).
-- 2. Every content table follows the same shape where it makes sense:
--    id (uuid), slug, status enum, timestamps, created_by/updated_by.
--    This keeps CRUD + RLS predictable across the dashboard instead of
--    bespoke rules per table.
-- 3. RLS pattern: public (anon) can SELECT published/open rows only.
--    Authenticated staff with the right role can do everything, gated
--    through a has_role() helper — not per-table hardcoded checks.
-- 4. Two storage buckets: "media" (public — images/video for blog, events,
--    team photos) and "documents" (private-by-default — tender PDFs, job
--    attachments, applicant resumes — served via signed URLs).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. EXTENSIONS
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto";      -- gen_random_uuid()
create extension if not exists "unaccent";       -- clean slug generation

-- ----------------------------------------------------------------------------
-- 1. ENUMS
-- ----------------------------------------------------------------------------
create type app_role as enum (
  'super_admin',      -- full access incl. user/role management
  'content_editor',   -- blog, pages, media/events
  'hr_manager',        -- careers/job postings + applications
  'procurement_manager', -- tenders + documents
  'front_desk'         -- read contact submissions, no publishing rights
);

create type publish_status as enum ('draft', 'published', 'archived');

create type contact_status as enum ('new', 'read', 'responded', 'archived');

create type employment_type as enum ('contract', 'permanent', 'internship', 'locum');

create type job_status as enum ('draft', 'open', 'closed');

create type application_status as enum ('submitted', 'shortlisted', 'interviewing', 'rejected', 'hired');

create type tender_category as enum ('goods', 'services', 'works', 'framework_agreement', 'consultancy');

create type tender_status as enum ('draft', 'open', 'closed', 'awarded', 'cancelled');

create type media_type as enum ('image', 'video');

create type day_of_week as enum ('monday','tuesday','wednesday','thursday','friday','saturday','sunday');

-- ----------------------------------------------------------------------------
-- 2. UTILITY: updated_at trigger (reused by every table)
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 3. PROFILES + ROLES
-- ----------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text not null,
  avatar_url   text,
  phone        text,
  job_title    text,               -- e.g. "Communications Officer" (dashboard display only)
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create table public.user_roles (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  role         app_role not null,
  granted_by   uuid references public.profiles(id),
  created_at   timestamptz not null default now(),
  unique (user_id, role)
);

-- Helper: does the current auth'd user hold this role (or super_admin)?
-- security definer so it can read user_roles regardless of caller's RLS.
create or replace function public.has_role(_role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
      and (role = _role or role = 'super_admin')
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid());
$$;

-- ----------------------------------------------------------------------------
-- 4. BLOG
-- ----------------------------------------------------------------------------
create table public.blog_categories (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  description   text,
  created_at    timestamptz not null default now()
);

create table public.blog_tags (
  id    uuid primary key default gen_random_uuid(),
  name  text not null,
  slug  text not null unique
);

create table public.blog_posts (
  id                 uuid primary key default gen_random_uuid(),
  title              text not null,
  slug               text not null unique,
  excerpt            text,
  content            text not null,              -- markdown/rich text
  cover_image_url    text,                        -- storage: media bucket
  category_id        uuid references public.blog_categories(id) on delete set null,
  author_id          uuid references public.profiles(id) on delete set null,
  status             publish_status not null default 'draft',
  published_at       timestamptz,
  seo_title          text,
  seo_description    text,
  seo_og_image_url   text,
  reading_minutes    int,
  view_count         int not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index idx_blog_posts_status_published on public.blog_posts (status, published_at desc);
create index idx_blog_posts_category on public.blog_posts (category_id);

create trigger trg_blog_posts_updated_at
  before update on public.blog_posts
  for each row execute function public.set_updated_at();

create table public.blog_post_tags (
  post_id  uuid not null references public.blog_posts(id) on delete cascade,
  tag_id   uuid not null references public.blog_tags(id) on delete cascade,
  primary key (post_id, tag_id)
);

-- ----------------------------------------------------------------------------
-- 5. SERVICES / DEPARTMENTS (content.md §5 — 80+ services, needs structure)
-- ----------------------------------------------------------------------------
create table public.service_categories (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,          -- e.g. "Maternity, Newborn & Reproductive Health"
  slug           text not null unique,
  icon           text,                    -- icon name/key for frontend
  description    text,
  display_order  int not null default 0,
  created_at     timestamptz not null default now()
);

create table public.services (
  id             uuid primary key default gen_random_uuid(),
  category_id    uuid not null references public.service_categories(id) on delete cascade,
  name           text not null,
  slug           text not null unique,
  summary        text,
  description    text,                    -- longer body for a service detail page
  is_specialized boolean not null default false,
  display_order  int not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_services_category on public.services (category_id);

create trigger trg_services_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

-- Weekly specialist clinic schedule (content.md §6) — staff-editable table
create table public.clinic_schedule (
  id           uuid primary key default gen_random_uuid(),
  service_id   uuid references public.services(id) on delete set null,
  clinic_name  text not null,             -- e.g. "Psychiatry" (denormalized for display even if service_id null)
  day_of_week  day_of_week not null,
  start_time   time not null,
  is_active    boolean not null default true,
  notes        text,
  created_at   timestamptz not null default now()
);

create index idx_clinic_schedule_day on public.clinic_schedule (day_of_week);

-- ----------------------------------------------------------------------------
-- 6. TEAM / LEADERSHIP
-- ----------------------------------------------------------------------------
create table public.team_members (
  id             uuid primary key default gen_random_uuid(),
  full_name      text not null,
  title          text not null,           -- e.g. "Chief Executive Officer"
  bio            text,
  photo_url      text,
  department     text,
  display_order  int not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger trg_team_members_updated_at
  before update on public.team_members
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 7. CAREERS
-- ----------------------------------------------------------------------------
create table public.job_postings (
  id                 uuid primary key default gen_random_uuid(),
  reference_no       text unique,          -- e.g. "MeTRH/HRM/02/2025/2026"
  title              text not null,
  slug               text not null unique,
  department         text,
  employment_type    employment_type not null,
  positions_count    int not null default 1,
  description        text not null,
  requirements       text,
  responsibilities   text,
  how_to_apply       text,
  status             job_status not null default 'draft',
  application_deadline date,
  created_by         uuid references public.profiles(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index idx_job_postings_status on public.job_postings (status, application_deadline);

create trigger trg_job_postings_updated_at
  before update on public.job_postings
  for each row execute function public.set_updated_at();

create table public.job_applications (
  id               uuid primary key default gen_random_uuid(),
  job_id           uuid not null references public.job_postings(id) on delete cascade,
  applicant_name   text not null,
  email            text not null,
  phone            text,
  cover_letter     text,
  resume_url       text not null,          -- storage: documents bucket (private)
  status           application_status not null default 'submitted',
  reviewed_by      uuid references public.profiles(id),
  reviewer_notes   text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_job_applications_job on public.job_applications (job_id, status);

create trigger trg_job_applications_updated_at
  before update on public.job_applications
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 8. TENDERS & DOWNLOADS
-- ----------------------------------------------------------------------------
create table public.tenders (
  id              uuid primary key default gen_random_uuid(),
  tender_number   text not null unique,   -- e.g. "CGM/ONT/FWA/001/2024-2025"
  title           text not null,
  slug            text not null unique,
  category        tender_category not null,
  description     text,
  status          tender_status not null default 'draft',
  opening_date    date,
  closing_date    date,
  awarded_to      text,                    -- filled in once awarded
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_tenders_status on public.tenders (status, closing_date);

create trigger trg_tenders_updated_at
  before update on public.tenders
  for each row execute function public.set_updated_at();

create table public.tender_documents (
  id           uuid primary key default gen_random_uuid(),
  tender_id    uuid not null references public.tenders(id) on delete cascade,
  file_name    text not null,
  file_url     text not null,              -- storage: documents bucket
  file_size_kb int,
  uploaded_by  uuid references public.profiles(id),
  created_at   timestamptz not null default now()
);

create index idx_tender_documents_tender on public.tender_documents (tender_id);

-- Standalone downloads not tied to a specific tender (supplier lists, policy PDFs, etc.)
create table public.downloads (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  category      text,                      -- e.g. "Registered Suppliers", "Reports", "Policies"
  file_url      text not null,             -- storage: documents bucket
  file_size_kb  int,
  is_published  boolean not null default true,
  uploaded_by   uuid references public.profiles(id),
  created_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 9. EVENTS & MEDIA
-- ----------------------------------------------------------------------------
create table public.media_albums (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  slug           text not null unique,
  description    text,
  event_date     date,
  cover_image_url text,
  status         publish_status not null default 'draft',
  created_by     uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_media_albums_status on public.media_albums (status, event_date desc);

create trigger trg_media_albums_updated_at
  before update on public.media_albums
  for each row execute function public.set_updated_at();

create table public.media_items (
  id             uuid primary key default gen_random_uuid(),
  album_id       uuid not null references public.media_albums(id) on delete cascade,
  type           media_type not null default 'image',
  file_url       text not null,            -- storage: media bucket
  caption        text,
  display_order  int not null default 0,
  created_at     timestamptz not null default now()
);

create index idx_media_items_album on public.media_items (album_id, display_order);

-- ----------------------------------------------------------------------------
-- 10. CONTACT FORM
-- ----------------------------------------------------------------------------
create table public.contact_submissions (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  email        text not null,
  phone        text,
  subject      text,
  message      text not null,
  status       contact_status not null default 'new',
  handled_by   uuid references public.profiles(id),
  internal_notes text,
  created_at   timestamptz not null default now()
);

create index idx_contact_submissions_status on public.contact_submissions (status, created_at desc);

-- ----------------------------------------------------------------------------
-- 11. STATIC / LEGAL PAGES (privacy, terms, cookies — CMS-editable, not hardcoded)
-- ----------------------------------------------------------------------------
create table public.pages (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,   -- e.g. "privacy-policy", "terms-of-service", "cookie-policy", "about"
  title            text not null,
  content          text not null,
  seo_title        text,
  seo_description  text,
  status           publish_status not null default 'draft',
  updated_by       uuid references public.profiles(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger trg_pages_updated_at
  before update on public.pages
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 12. SITE SETTINGS (single-row config: emergency line, socials, homepage hero)
-- ----------------------------------------------------------------------------
create table public.site_settings (
  id                  boolean primary key default true,   -- enforced singleton
  emergency_line      text,
  main_phone          text,
  main_email          text,
  physical_address     text,
  postal_address      text,
  visiting_hours       jsonb,             -- [{label, start, end}]
  social_links        jsonb,             -- {facebook, x, instagram, ...}
  homepage_hero        jsonb,             -- {headline, subhead, cta_label, cta_href, image_url}
  updated_by          uuid references public.profiles(id),
  updated_at          timestamptz not null default now(),
  constraint singleton_row check (id)
);

create trigger trg_site_settings_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

insert into public.site_settings (id) values (true);

-- ============================================================================
-- 13. ROW LEVEL SECURITY
-- ============================================================================
alter table public.profiles            enable row level security;
alter table public.user_roles          enable row level security;
alter table public.blog_categories     enable row level security;
alter table public.blog_tags           enable row level security;
alter table public.blog_posts          enable row level security;
alter table public.blog_post_tags      enable row level security;
alter table public.service_categories  enable row level security;
alter table public.services            enable row level security;
alter table public.clinic_schedule     enable row level security;
alter table public.team_members        enable row level security;
alter table public.job_postings        enable row level security;
alter table public.job_applications    enable row level security;
alter table public.tenders             enable row level security;
alter table public.tender_documents    enable row level security;
alter table public.downloads           enable row level security;
alter table public.media_albums        enable row level security;
alter table public.media_items         enable row level security;
alter table public.contact_submissions enable row level security;
alter table public.pages               enable row level security;
alter table public.site_settings       enable row level security;

-- ---- profiles: staff can see each other; user can update own row; only
--      super_admin can insert/delete (user provisioning happens server-side).
create policy "profiles_select_staff" on public.profiles
  for select using (public.is_staff());
create policy "profiles_update_self" on public.profiles
  for update using (id = auth.uid());
create policy "profiles_all_super_admin" on public.profiles
  for all using (public.has_role('super_admin'));

-- ---- user_roles: only super_admin manages roles; users can read own roles
create policy "user_roles_select_self_or_admin" on public.user_roles
  for select using (user_id = auth.uid() or public.has_role('super_admin'));
create policy "user_roles_write_super_admin" on public.user_roles
  for insert with check (public.has_role('super_admin'));
create policy "user_roles_update_super_admin" on public.user_roles
  for update using (public.has_role('super_admin'));
create policy "user_roles_delete_super_admin" on public.user_roles
  for delete using (public.has_role('super_admin'));

-- ---- blog: public reads published only; content_editor full CRUD
create policy "blog_categories_public_read" on public.blog_categories
  for select using (true);
create policy "blog_categories_editor_write" on public.blog_categories
  for all using (public.has_role('content_editor'));

create policy "blog_tags_public_read" on public.blog_tags
  for select using (true);
create policy "blog_tags_editor_write" on public.blog_tags
  for all using (public.has_role('content_editor'));

create policy "blog_posts_public_read_published" on public.blog_posts
  for select using (status = 'published' or public.has_role('content_editor'));
create policy "blog_posts_editor_write" on public.blog_posts
  for all using (public.has_role('content_editor'));

create policy "blog_post_tags_public_read" on public.blog_post_tags
  for select using (true);
create policy "blog_post_tags_editor_write" on public.blog_post_tags
  for all using (public.has_role('content_editor'));

-- ---- services: public reads active only; content_editor manages
create policy "service_categories_public_read" on public.service_categories
  for select using (true);
create policy "service_categories_editor_write" on public.service_categories
  for all using (public.has_role('content_editor'));

create policy "services_public_read_active" on public.services
  for select using (is_active = true or public.has_role('content_editor'));
create policy "services_editor_write" on public.services
  for all using (public.has_role('content_editor'));

create policy "clinic_schedule_public_read_active" on public.clinic_schedule
  for select using (is_active = true or public.has_role('content_editor'));
create policy "clinic_schedule_editor_write" on public.clinic_schedule
  for all using (public.has_role('content_editor'));

-- ---- team: public reads active; content_editor manages
create policy "team_members_public_read_active" on public.team_members
  for select using (is_active = true or public.has_role('content_editor'));
create policy "team_members_editor_write" on public.team_members
  for all using (public.has_role('content_editor'));

-- ---- careers: public reads open postings; hr_manager manages postings +
--      applications. Anyone (incl. anon) can INSERT an application, but
--      only hr_manager can read/update them.
create policy "job_postings_public_read_open" on public.job_postings
  for select using (status = 'open' or public.has_role('hr_manager'));
create policy "job_postings_hr_write" on public.job_postings
  for all using (public.has_role('hr_manager'));

create policy "job_applications_public_insert" on public.job_applications
  for insert with check (true);
create policy "job_applications_hr_read" on public.job_applications
  for select using (public.has_role('hr_manager'));
create policy "job_applications_hr_update" on public.job_applications
  for update using (public.has_role('hr_manager'));
create policy "job_applications_hr_delete" on public.job_applications
  for delete using (public.has_role('hr_manager'));

-- ---- tenders: public reads open/closed/awarded (not draft); procurement_manager manages
create policy "tenders_public_read" on public.tenders
  for select using (status <> 'draft' or public.has_role('procurement_manager'));
create policy "tenders_procurement_write" on public.tenders
  for all using (public.has_role('procurement_manager'));

create policy "tender_documents_public_read" on public.tender_documents
  for select using (
    exists (select 1 from public.tenders t where t.id = tender_id and t.status <> 'draft')
    or public.has_role('procurement_manager')
  );
create policy "tender_documents_procurement_write" on public.tender_documents
  for all using (public.has_role('procurement_manager'));

create policy "downloads_public_read_published" on public.downloads
  for select using (is_published = true or public.has_role('procurement_manager'));
create policy "downloads_procurement_write" on public.downloads
  for all using (public.has_role('procurement_manager'));

-- ---- media/events: public reads published; content_editor manages
create policy "media_albums_public_read_published" on public.media_albums
  for select using (status = 'published' or public.has_role('content_editor'));
create policy "media_albums_editor_write" on public.media_albums
  for all using (public.has_role('content_editor'));

create policy "media_items_public_read" on public.media_items
  for select using (
    exists (select 1 from public.media_albums a where a.id = album_id and a.status = 'published')
    or public.has_role('content_editor')
  );
create policy "media_items_editor_write" on public.media_items
  for all using (public.has_role('content_editor'));

-- ---- contact form: anyone can submit, only front_desk/super_admin reads
create policy "contact_submissions_public_insert" on public.contact_submissions
  for insert with check (true);
create policy "contact_submissions_staff_read" on public.contact_submissions
  for select using (public.has_role('front_desk') or public.has_role('content_editor') or public.has_role('super_admin'));
create policy "contact_submissions_staff_update" on public.contact_submissions
  for update using (public.has_role('front_desk') or public.has_role('super_admin'));

-- ---- legal/static pages: public reads published; content_editor manages
create policy "pages_public_read_published" on public.pages
  for select using (status = 'published' or public.has_role('content_editor'));
create policy "pages_editor_write" on public.pages
  for all using (public.has_role('content_editor'));

-- ---- site settings: public reads; super_admin writes
create policy "site_settings_public_read" on public.site_settings
  for select using (true);
create policy "site_settings_admin_write" on public.site_settings
  for update using (public.has_role('super_admin'));

-- ============================================================================
-- 14. STORAGE BUCKETS
-- ============================================================================
-- "media"     — public bucket. Blog covers, team photos, event photos/video.
--               Served directly via public URL, no signing needed.
-- "documents" — private bucket. Tender PDFs, job attachments, applicant
--               resumes. Public tender/download docs are served via a
--               short-lived signed URL generated server-side (Nuxt server
--               route) even though "public" tenders are open, so we keep
--               one consistent private-bucket + signed-URL pattern instead
--               of splitting policies by file type.

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- media bucket: public read, content_editor (or any staff, per folder) write
create policy "media_bucket_public_read" on storage.objects
  for select using (bucket_id = 'media');

create policy "media_bucket_staff_write" on storage.objects
  for insert with check (bucket_id = 'media' and public.is_staff());
create policy "media_bucket_staff_update" on storage.objects
  for update using (bucket_id = 'media' and public.is_staff());
create policy "media_bucket_staff_delete" on storage.objects
  for delete using (bucket_id = 'media' and public.is_staff());

-- documents bucket: no public read policy — always fetched via signed URL
-- generated by a server route that checks the linked row's status first.
create policy "documents_bucket_staff_read" on storage.objects
  for select using (bucket_id = 'documents' and public.is_staff());
create policy "documents_bucket_staff_write" on storage.objects
  for insert with check (bucket_id = 'documents' and public.is_staff());
create policy "documents_bucket_staff_update" on storage.objects
  for update using (bucket_id = 'documents' and public.is_staff());
create policy "documents_bucket_staff_delete" on storage.objects
  for delete using (bucket_id = 'documents' and public.is_staff());

-- Suggested folder convention inside "documents":
--   /tenders/{tender_id}/{filename}
--   /jobs/{job_id}/attachments/{filename}
--   /applications/{application_id}/{filename}   <- resumes, most sensitive
-- Suggested folder convention inside "media":
--   /blog/{post_id}/{filename}
--   /team/{member_id}/{filename}
--   /events/{album_id}/{filename}

-- ============================================================================
-- 15. NOT INCLUDED YET (flag for a follow-up migration, not needed for launch)
-- ============================================================================
-- - audit_log table (who changed what, when) — worth adding once dashboard
--   has multiple editors, so edits are traceable.
-- - newsletter_subscribers — not requested, easy add later if wanted.
-- - full-text search indexes (pg_trgm / tsvector) on blog_posts + services
--   once content volume justifies it — flat ILIKE search is fine at launch.
-- ============================================================================

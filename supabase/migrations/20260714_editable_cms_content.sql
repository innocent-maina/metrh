begin;

create extension if not exists pgcrypto;

do $$
begin
  create type public.publish_status as enum ('draft', 'published', 'archived');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.site_settings (
  id boolean primary key default true,
  emergency_line text,
  main_phone text,
  main_email text,
  physical_address text,
  postal_address text,
  visiting_hours jsonb,
  social_links jsonb,
  homepage_hero jsonb,
  whatsapp_label text,
  whatsapp_href text,
  emergency_label text,
  emergency_href text,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint site_settings_singleton check (id)
);

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  content text not null default '',
  seo_title text,
  seo_description text,
  status public.publish_status not null default 'draft',
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.page_sections (
  id uuid primary key default gen_random_uuid(),
  page_slug text not null,
  section_key text not null,
  section_type text not null default 'content',
  eyebrow text,
  title text not null,
  summary text,
  body text,
  image_url text,
  image_alt text,
  cta_label text,
  cta_href text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists page_sections_page_slug_section_key_idx
  on public.page_sections (page_slug, section_key);

create index if not exists page_sections_page_slug_display_order_idx
  on public.page_sections (page_slug, display_order);

create table if not exists public.page_section_items (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.page_sections(id) on delete cascade,
  title text not null,
  description text,
  icon text,
  image_url text,
  image_alt text,
  cta_label text,
  cta_href text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists page_section_items_section_id_display_order_idx
  on public.page_section_items (section_id, display_order);

create unique index if not exists page_section_items_section_id_title_idx
  on public.page_section_items (section_id, title);

create table if not exists public.page_slides (
  id uuid primary key default gen_random_uuid(),
  page_slug text not null,
  section_key text not null default 'hero',
  eyebrow text,
  title text not null,
  body text not null,
  cta_label text,
  cta_href text,
  image_url text not null,
  image_alt text,
  caption text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists page_slides_page_slug_section_key_display_order_idx
  on public.page_slides (page_slug, section_key, display_order);

create index if not exists page_slides_page_slug_section_key_idx
  on public.page_slides (page_slug, section_key);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_site_settings_updated_at on public.site_settings;
create trigger set_site_settings_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

drop trigger if exists set_pages_updated_at on public.pages;
create trigger set_pages_updated_at
before update on public.pages
for each row execute function public.set_updated_at();

drop trigger if exists set_page_sections_updated_at on public.page_sections;
create trigger set_page_sections_updated_at
before update on public.page_sections
for each row execute function public.set_updated_at();

drop trigger if exists set_page_section_items_updated_at on public.page_section_items;
create trigger set_page_section_items_updated_at
before update on public.page_section_items
for each row execute function public.set_updated_at();

drop trigger if exists set_page_slides_updated_at on public.page_slides;
create trigger set_page_slides_updated_at
before update on public.page_slides
for each row execute function public.set_updated_at();

insert into public.site_settings (
  id,
  emergency_line,
  main_phone,
  main_email,
  physical_address,
  postal_address,
  visiting_hours,
  social_links,
  homepage_hero,
  whatsapp_label,
  whatsapp_href,
  emergency_label,
  emergency_href
)
values (
  true,
  '0711-207623',
  null,
  null,
  'Meru–Nanyuki Road, Telkom Ltd junction, Meru Town',
  'P.O. Box 8 – 60200, Meru',
  jsonb_build_array(
    jsonb_build_object('label', 'Morning', 'start', '6:00 AM', 'end', '7:00 AM'),
    jsonb_build_object('label', 'Lunch', 'start', '12:30 PM', 'end', '2:00 PM'),
    jsonb_build_object('label', 'Evening', 'start', '4:30 PM', 'end', '5:30 PM')
  ),
  jsonb_build_object(
    'facebook', 'https://facebook.com/MeTRH.Hospital',
    'x', 'https://x.com/MeTRH_Hospital'
  ),
  jsonb_build_object(
    'headline', 'Compassionate public care, every day.',
    'subhead', 'Meru Teaching and Referral Hospital serves Upper Eastern Kenya with emergency care, specialist clinics, surgery, diagnostics, and teaching-led service delivery.',
    'cta_label', 'Explore services',
    'cta_href', '/services',
    'image_url', '/welcome.jpg'
  ),
  'Chat on WhatsApp',
  'https://wa.me/254711207623?text=Hello%20MeTRH%2C%20I%20would%20like%20to%20ask%20about%20the%20hospital%20services.',
  'Emergency line',
  'tel:0711207623'
)
on conflict (id) do update set
  emergency_line = excluded.emergency_line,
  main_phone = excluded.main_phone,
  main_email = excluded.main_email,
  physical_address = excluded.physical_address,
  postal_address = excluded.postal_address,
  visiting_hours = excluded.visiting_hours,
  social_links = excluded.social_links,
  homepage_hero = excluded.homepage_hero,
  whatsapp_label = excluded.whatsapp_label,
  whatsapp_href = excluded.whatsapp_href,
  emergency_label = excluded.emergency_label,
  emergency_href = excluded.emergency_href,
  updated_at = now();

insert into public.pages (slug, title, content, seo_title, seo_description, status)
values
  ('privacy-policy', 'Privacy Policy', '', 'Privacy Policy — MeTRH', 'Privacy policy for Meru Teaching and Referral Hospital.', 'published'),
  ('terms-of-use', 'Terms of Use', '', 'Terms of Use — MeTRH', 'Terms of use for Meru Teaching and Referral Hospital.', 'published'),
  ('terms-of-service', 'Terms of Service', '', 'Terms of Service — MeTRH', 'Terms of service for Meru Teaching and Referral Hospital.', 'published'),
  ('cookie-policy', 'Cookie Policy', '', 'Cookie Policy — MeTRH', 'Cookie policy for Meru Teaching and Referral Hospital.', 'published')
on conflict (slug) do update set
  title = excluded.title,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  status = excluded.status,
  updated_at = now();

insert into public.page_sections (
  id,
  page_slug,
  section_key,
  section_type,
  eyebrow,
  title,
  summary,
  body,
  cta_label,
  cta_href,
  display_order,
  is_active
)
values
  (
    '11111111-1111-1111-1111-111111111101',
    'home',
    'hero',
    'hero',
    'Welcome to MeTRH',
    'Compassionate public care, every day.',
    'Meru Teaching and Referral Hospital serves Upper Eastern Kenya with emergency care, specialist clinics, surgery, diagnostics, and teaching-led service delivery.',
    null,
    null,
    null,
    0,
    true
  ),
  (
    '11111111-1111-1111-1111-111111111102',
    'home',
    'home-at-a-glance',
    'feature-list',
    'Hospital profile',
    'MeTRH at a glance',
    'Key figures the public often wants to see at a glance.',
    null,
    null,
    null,
    1,
    true
  ),
  (
    '11111111-1111-1111-1111-111111111103',
    'home',
    'community-impact',
    'card-grid',
    'Community impact',
    'Blood donated here saves lives here',
    'Donated blood is critical for cancer patients, children with severe anaemia, and mothers during childbirth.',
    null,
    null,
    null,
    2,
    true
  ),
  (
    '11111111-1111-1111-1111-111111111104',
    'home',
    'teaching-context-links',
    'list',
    'Teaching & research',
    'A teaching hospital, not just a treating one',
    'MeTRH is the teaching hospital for three institutions and an internship centre for Ministry of Health interns, clinical officers, nurses, and nutritionists.',
    null,
    null,
    null,
    3,
    true
  ),
  (
    '11111111-1111-1111-1111-111111111105',
    'home',
    'services-overview',
    'feature-list',
    'What we offer',
    'Services across every level of care',
    'Public, specialist, and support services grouped for quick scanning.',
    '/services',
    'View all services',
    null,
    4,
    true
  ),
  (
    '11111111-1111-1111-1111-111111111106',
    'home',
    'careers-tenders',
    'dual-card',
    'Careers and procurement',
    'Find opportunities and procurement notices',
    'MeTRH recruits on a rolling basis and publishes procurement notices through the dashboard.',
    '/careers',
    'View open positions',
    null,
    5,
    true
  ),
  (
    '22222222-2222-2222-2222-222222222201',
    'about',
    'vision-mission',
    'content',
    'Vision and mission',
    'Vision, mission, and context',
    'A specialized referral hospital committed to excellence in innovative health care and training.',
    '<p><strong>Vision:</strong> A specialized referral hospital committed to excellence in innovative health care and training.</p><p><strong>Mission:</strong> To provide client-centered, innovative, specialized and affordable health care; facilitate training and research; and participate in county, national and global healthcare policy formulation.</p>',
    null,
    null,
    0,
    true
  ),
  (
    '22222222-2222-2222-2222-222222222202',
    'about',
    'mission-values',
    'list',
    'Core values',
    'Core values',
    'The values that guide the institution.',
    null,
    null,
    null,
    1,
    true
  ),
  (
    '22222222-2222-2222-2222-222222222203',
    'about',
    'strategic-goals',
    'ordered-list',
    'Strategic goals',
    'Strategic goals',
    'The long-range goals the hospital is pursuing.',
    null,
    null,
    null,
    2,
    true
  ),
  (
    '22222222-2222-2222-2222-222222222204',
    'about',
    'growth-development',
    'card-grid',
    'Growth and development',
    'Built for where MeTRH is headed, not just where it is',
    'Current projects that show where the hospital is heading next.',
    null,
    null,
    null,
    3,
    true
  ),
  (
    '22222222-2222-2222-2222-222222222205',
    'about',
    'teaching-affiliations',
    'list',
    'Teaching and research',
    'Teaching & research',
    'MeTRH is the teaching hospital for several local training institutions.',
    null,
    null,
    null,
    4,
    true
  ),
  (
    '33333333-3333-3333-3333-333333333301',
    'services',
    'services-intro',
    'content',
    'Services',
    'Clinical services organized for fast access',
    'MeTRH''s services are grouped by department so patients, families, and referrers can find what they need without scanning a wall of text.',
    null,
    null,
    null,
    0,
    true
  ),
  (
    '44444444-4444-4444-4444-444444444401',
    'careers',
    'careers-intro',
    'content',
    'Careers & opportunities',
    'Current openings and recruitment rounds',
    'MeTRH recruits on a rolling basis. When there are live openings, they appear here with application instructions and upload support.',
    null,
    null,
    null,
    0,
    true
  ),
  (
    '55555555-5555-5555-5555-555555555501',
    'blog',
    'blog-intro',
    'content',
    'Blog & news',
    'Milestones, community impact, and service updates',
    'MeTRH uses this space for stories that matter to patients, families, referrers, and the wider Meru community.',
    null,
    null,
    null,
    0,
    true
  ),
  (
    '66666666-6666-6666-6666-666666666601',
    'contact',
    'contact-intro',
    'content',
    'Contact',
    'Reach MeTRH quickly and clearly',
    'Use the emergency line for urgent care. Use the form for general enquiries, directions, appointments, and institutional requests.',
    null,
    null,
    null,
    0,
    true
  ),
  (
    '77777777-7777-7777-7777-777777777701',
    'tenders',
    'tenders-intro',
    'content',
    'Tenders & downloads',
    'Procurement notices and downloadable documents',
    'This section is designed for open tender notices, registered supplier lists, and procurement PDFs.',
    null,
    null,
    null,
    0,
    true
  )
on conflict (page_slug, section_key) do update set
  section_type = excluded.section_type,
  eyebrow = excluded.eyebrow,
  title = excluded.title,
  summary = excluded.summary,
  body = excluded.body,
  cta_label = excluded.cta_label,
  cta_href = excluded.cta_href,
  display_order = excluded.display_order,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.page_slides (
  id,
  page_slug,
  section_key,
  eyebrow,
  title,
  body,
  cta_label,
  cta_href,
  image_url,
  image_alt,
  caption,
  display_order,
  is_active
)
values
  (
    '41111111-1111-1111-1111-111111111101',
    'home',
    'hero',
    'Welcome to MeTRH',
    'Compassionate public care, every day.',
    'Meru Teaching and Referral Hospital serves Upper Eastern Kenya with emergency care, specialist clinics, surgery, diagnostics, and teaching-led service delivery.',
    'Explore services',
    '/services',
    '/welcome.jpg',
    'MeTRH welcome entrance',
    'The main entry point for patients, families, and referrers.',
    0,
    true
  ),
  (
    '41111111-1111-1111-1111-111111111102',
    'home',
    'hero',
    'Specialist referral care',
    'Advanced treatment closer to home.',
    'From outpatient review to diagnostics and specialist pathways, MeTRH keeps care accessible for patients who would otherwise travel farther for treatment.',
    'View clinic schedule',
    '/services#clinic-schedule',
    '/doctor-examining-patient.jpg',
    'A doctor examining a patient',
    'Clinical assessment that starts the care journey.',
    1,
    true
  ),
  (
    '41111111-1111-1111-1111-111111111103',
    'home',
    'hero',
    'Growth and teaching',
    'A hospital that is expanding with purpose.',
    'New capacity, equipment, and training investments are strengthening the hospital''s ability to deliver better outcomes for patients and the wider region.',
    'Learn about MeTRH',
    '/about',
    '/planning-1.jpg',
    'Hospital planning session',
    'Operational planning behind service delivery and growth.',
    2,
    true
  );

insert into public.page_section_items (
  section_id,
  title,
  description,
  icon,
  image_url,
  image_alt,
  cta_label,
  cta_href,
  display_order,
  is_active
)
select
  section.id,
  item.title,
  item.description,
  item.icon,
  item.image_url,
  item.image_alt,
  item.cta_label,
  item.cta_href,
  item.display_order,
  item.is_active
from (
  values
    ('home', 'home-at-a-glance', '1.4M+', 'Catchment population', null, null, null, null, null, 0, true),
    ('home', 'home-at-a-glance', '500+', 'Full-time staff', null, null, null, null, null, 1, true),
    ('home', 'home-at-a-glance', '~1,000', 'Outpatients per day', null, null, null, null, null, 2, true),
    ('home', 'home-at-a-glance', '7.6', 'Hectares of land', null, null, null, null, null, 3, true),
    ('home', 'community-impact', 'Arsenal Kenya Supporters'' Club blood drive', 'Over 300 units collected in Meru town, timed around an Arsenal match.', 'lucide:heart-handshake', null, null, null, null, 0, true),
    ('home', 'community-impact', 'Manchester United Fans Kenya (Meru)', 'Around 100 fans donated blood at MeTRH in an organized club drive.', 'lucide:droplets', null, null, null, null, 1, true),
    ('home', 'community-impact', 'County-led mass donation drives', 'Meru County Government and Kenya Red Cross have run mass blood donation drives.', 'lucide:users', null, null, null, null, 2, true),
    ('home', 'teaching-context-links', 'Kenya Methodist University (KeMU)', null, 'lucide:graduation-cap', null, null, null, null, 0, true),
    ('home', 'teaching-context-links', 'Meru University of Science and Technology', null, 'lucide:graduation-cap', null, null, null, null, 1, true),
    ('home', 'teaching-context-links', 'Kenya Medical Training College (KMTC)', null, 'lucide:graduation-cap', null, null, null, null, 2, true),
    ('about', 'mission-values', 'Leadership & Integrity', null, 'lucide:check-circle-2', null, null, null, null, 0, true),
    ('about', 'mission-values', 'Compassion', null, 'lucide:check-circle-2', null, null, null, null, 1, true),
    ('about', 'mission-values', 'Professionalism & Excellence', null, 'lucide:check-circle-2', null, null, null, null, 2, true),
    ('about', 'mission-values', 'Creativity', null, 'lucide:check-circle-2', null, null, null, null, 3, true),
    ('about', 'mission-values', 'Teamwork & Team Spirit', null, 'lucide:check-circle-2', null, null, null, null, 4, true),
    ('about', 'mission-values', 'Responsiveness', null, 'lucide:check-circle-2', null, null, null, null, 5, true),
    ('about', 'strategic-goals', 'Meet the Highest Standard of Health Care', null, null, null, null, null, null, 0, true),
    ('about', 'strategic-goals', 'Develop a Culture of Excellence', null, null, null, null, null, null, 1, true),
    ('about', 'strategic-goals', 'Resource Sustainability', null, null, null, null, null, null, 2, true),
    ('about', 'strategic-goals', 'Enhance Institutional Capacity', null, null, null, null, null, null, 3, true),
    ('about', 'strategic-goals', 'Strategic Partnership', null, null, null, null, null, null, 4, true),
    ('about', 'strategic-goals', 'Strengthening Information Management, Research, Innovation and Development', null, null, null, null, null, null, 5, true),
    ('about', 'growth-development', 'Dedicated Cancer Centre', 'A 50-bed facility with pathology and imaging capacity, offering chemotherapy, radiotherapy, and surgery.', 'lucide:building-2', null, null, null, null, 0, true),
    ('about', 'growth-development', 'New 250-bed ward block', 'Additional inpatient capacity as MeTRH''s daily load exceeds current bed capacity.', 'lucide:hammer', null, null, null, null, 1, true),
    ('about', 'growth-development', 'Level 6 transition', 'Hospital-wide departmental changes as MeTRH becomes a fully-fledged specialized referral hospital.', 'lucide:trending-up', null, null, null, null, 2, true)
) as item(
  page_slug,
  section_key,
  title,
  description,
  icon,
  image_url,
  image_alt,
  cta_label,
  cta_href,
  display_order,
  is_active
)
join public.page_sections section
  on section.page_slug = item.page_slug
 and section.section_key = item.section_key
on conflict (section_id, title) do update set
  title = excluded.title,
  description = excluded.description,
  icon = excluded.icon,
  image_url = excluded.image_url,
  image_alt = excluded.image_alt,
  cta_label = excluded.cta_label,
  cta_href = excluded.cta_href,
  display_order = excluded.display_order,
  is_active = excluded.is_active,
  updated_at = now();

commit;

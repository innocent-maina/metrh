-- Editable CMS content for MeTRH
-- Adds row-based section/slide tables plus richer site settings so the
-- dashboard can manage homepage slides, image sections, and global buttons
-- without hardcoding them in Vue components.

-- ---------------------------------------------------------------------------
-- 1. Extend singleton site settings
-- ---------------------------------------------------------------------------
alter table public.site_settings
  add column if not exists whatsapp_label text,
  add column if not exists whatsapp_href text,
  add column if not exists emergency_label text,
  add column if not exists emergency_href text;

-- ---------------------------------------------------------------------------
-- 2. Row-based editable sections
-- ---------------------------------------------------------------------------
create table if not exists public.page_sections (
  id             uuid primary key default gen_random_uuid(),
  page_slug      text not null,
  section_key    text not null,
  section_type   text not null default 'content',
  eyebrow        text,
  title          text not null,
  summary        text,
  body           text,
  image_url      text,
  image_alt      text,
  cta_label      text,
  cta_href       text,
  display_order  integer not null default 0,
  is_active      boolean not null default true,
  updated_by     uuid references public.profiles(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint page_sections_unique_key unique (page_slug, section_key)
);

create index if not exists idx_page_sections_page_slug_order
  on public.page_sections (page_slug, display_order, created_at desc);
create index if not exists idx_page_sections_active
  on public.page_sections (page_slug, is_active, display_order);

drop trigger if exists trg_page_sections_updated_at on public.page_sections;
create trigger trg_page_sections_updated_at
  before update on public.page_sections
  for each row execute function public.set_updated_at();

create table if not exists public.page_section_items (
  id             uuid primary key default gen_random_uuid(),
  section_id     uuid not null references public.page_sections(id) on delete cascade,
  title          text not null,
  description    text,
  icon           text,
  image_url      text,
  image_alt      text,
  cta_label      text,
  cta_href       text,
  display_order  integer not null default 0,
  is_active      boolean not null default true,
  updated_by     uuid references public.profiles(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_page_section_items_section_order
  on public.page_section_items (section_id, display_order, created_at desc);
create index if not exists idx_page_section_items_active
  on public.page_section_items (section_id, is_active, display_order);

drop trigger if exists trg_page_section_items_updated_at on public.page_section_items;
create trigger trg_page_section_items_updated_at
  before update on public.page_section_items
  for each row execute function public.set_updated_at();

create table if not exists public.page_slides (
  id             uuid primary key default gen_random_uuid(),
  page_slug      text not null default 'home',
  section_key    text not null default 'hero',
  eyebrow        text,
  title          text not null,
  body           text not null,
  cta_label      text,
  cta_href       text,
  image_url      text not null,
  image_alt      text,
  caption        text,
  display_order  integer not null default 0,
  is_active      boolean not null default true,
  updated_by     uuid references public.profiles(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint page_slides_unique_key unique (page_slug, section_key, display_order)
);

create index if not exists idx_page_slides_page_slug_order
  on public.page_slides (page_slug, section_key, display_order, created_at desc);
create index if not exists idx_page_slides_active
  on public.page_slides (page_slug, section_key, is_active, display_order);

drop trigger if exists trg_page_slides_updated_at on public.page_slides;
create trigger trg_page_slides_updated_at
  before update on public.page_slides
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. Row level security
-- ---------------------------------------------------------------------------
alter table public.page_sections enable row level security;
alter table public.page_section_items enable row level security;
alter table public.page_slides enable row level security;

drop policy if exists "page_sections_public_read" on public.page_sections;
create policy "page_sections_public_read" on public.page_sections
  for select using (is_active = true or public.has_role('content_editor'));

drop policy if exists "page_sections_editor_write" on public.page_sections;
create policy "page_sections_editor_write" on public.page_sections
  for all using (public.has_role('content_editor'));

drop policy if exists "page_section_items_public_read" on public.page_section_items;
create policy "page_section_items_public_read" on public.page_section_items
  for select using (
    public.has_role('content_editor')
    or (
      is_active = true
      and exists (
      select 1
      from public.page_sections s
      where s.id = section_id
        and s.is_active = true
      )
    )
  );

drop policy if exists "page_section_items_editor_write" on public.page_section_items;
create policy "page_section_items_editor_write" on public.page_section_items
  for all using (public.has_role('content_editor'));

drop policy if exists "page_slides_public_read" on public.page_slides;
create policy "page_slides_public_read" on public.page_slides
  for select using (is_active = true or public.has_role('content_editor'));

drop policy if exists "page_slides_editor_write" on public.page_slides;
create policy "page_slides_editor_write" on public.page_slides
  for all using (public.has_role('content_editor'));

drop policy if exists "site_settings_admin_write" on public.site_settings;
create policy "site_settings_admin_write" on public.site_settings
  for update using (public.has_role('content_editor'));

-- ---------------------------------------------------------------------------
-- 4. Seed singleton settings and editable content
-- ---------------------------------------------------------------------------
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
  '[
    {"label":"Morning","start":"6:00 AM","end":"7:00 AM"},
    {"label":"Lunch","start":"12:30 PM","end":"2:00 PM"},
    {"label":"Evening","start":"4:30 PM","end":"5:30 PM"}
  ]'::jsonb,
  '{
    "facebook":"https://facebook.com/MeTRH.Hospital",
    "x":"https://x.com/MeTRH_Hospital"
  }'::jsonb,
  '{
    "headline":"Compassionate public care, every day.",
    "subhead":"Meru Teaching and Referral Hospital serves Upper Eastern Kenya with emergency care, specialist clinics, surgery, diagnostics, and teaching-led service delivery.",
    "cta_label":"Explore services",
    "cta_href":"/services",
    "image_url":"/welcome.jpg"
  }'::jsonb,
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
  emergency_href = excluded.emergency_href;

insert into public.pages (slug, title, content, seo_title, seo_description, status)
values
  (
    'privacy-policy',
    'Privacy Policy',
    $$
<p>Meru Teaching and Referral Hospital ("MeTRH", "we", "our", or "us") respects your privacy. This page explains how we handle information collected through our website, online forms, and related public services.</p>

<h2>Information we collect</h2>
<p>Depending on how you use the site, we may collect:</p>
<ul>
  <li>contact details you submit, such as your name, email address, phone number, subject, and message;</li>
  <li>information you include in requests, feedback, job applications, or other forms;</li>
  <li>technical data from your browser and device, such as IP address, browser type, pages visited, and approximate location derived from network data;</li>
  <li>cookie and usage data that helps us keep the website secure and understand what content is being used.</li>
</ul>

<h2>How we use information</h2>
<p>We use information to respond to enquiries, provide hospital services, improve the website, protect the security of our systems, and meet legal and administrative obligations.</p>

<h2>Sharing and disclosure</h2>
<p>We may share information with staff who need it to handle your request, trusted service providers who help us run the website, and public authorities where the law requires it. We do not sell personal information.</p>

<h2>Health and sensitive information</h2>
<p>Do not send urgent clinical details through general website forms unless a form explicitly asks for them. For emergencies, use the emergency line or seek immediate in-person care.</p>

<h2>Retention and security</h2>
<p>We keep information only for as long as it is needed for the purpose it was collected, or as required by law, record-keeping rules, or patient care needs. We use reasonable administrative and technical safeguards to protect it.</p>

<h2>Your rights</h2>
<p>Subject to applicable law, you may request access to your information, ask for corrections, object to certain processing, or raise a concern about how your data is handled. You may start with the hospital and, where appropriate, contact the Office of the Data Protection Commissioner.</p>

<h2>Changes to this policy</h2>
<p>We may update this policy from time to time. The latest version will appear on this page.</p>

<h2>Contact</h2>
<p>If you have a privacy question, use the contact page or reach the hospital through the official communication channels listed on the site.</p>
$$,
    'Privacy Policy - MeTRH',
    'How Meru Teaching and Referral Hospital collects, uses, stores, and protects information shared through the website and online forms.',
    'published'
  ),
  (
    'terms-of-use',
    'Terms of Use',
    $$
<p>These terms apply to the Meru Teaching and Referral Hospital website. By using the site, you agree to these terms. If you do not agree, please do not use the site.</p>

<h2>Information only</h2>
<p>The website is provided for public information, navigation, announcements, and general service access. It does not replace clinical assessment, diagnosis, or treatment from a qualified health professional.</p>

<h2>Emergency use</h2>
<p>Do not use this website for emergencies. If you need urgent medical help, call the emergency line or go to the nearest appropriate care point immediately.</p>

<h2>Your responsibilities</h2>
<p>When you submit forms or messages, you must provide information that is accurate, lawful, and relevant. Do not submit spam, abusive content, malware, or content that interferes with the website or its users.</p>

<h2>Acceptable use</h2>
<ul>
  <li>Use the site in a lawful and respectful way.</li>
  <li>Do not attempt to bypass security controls or access data you are not authorized to access.</li>
  <li>Do not copy or reuse content in a way that misrepresents the hospital or harms users.</li>
  <li>Do not rely on the site as a substitute for official notices, referrals, or clinical instructions.</li>
</ul>

<h2>Intellectual property</h2>
<p>Unless otherwise stated, the text, images, logos, and layout on this site belong to MeTRH or are used with permission. You may view and share pages for personal, educational, or journalistic use, but you may not claim hospital content as your own.</p>

<h2>External links</h2>
<p>The site may link to third-party services or information sources. Those sites are governed by their own terms and policies, and we are not responsible for their content or practices.</p>

<h2>Availability and changes</h2>
<p>We may change, suspend, or remove parts of the site at any time without notice. We may also update these terms when needed, and continued use of the site means you accept the updated version.</p>

<h2>Liability</h2>
<p>To the extent allowed by law, MeTRH is not liable for losses caused by misuse of the site, interruption of service, third-party content, or reliance on information that has become outdated.</p>

<h2>Contact</h2>
<p>If you have a question about these terms, use the contact page or the hospital's official communication channels.</p>
$$,
    'Terms of Use - MeTRH',
    'The rules for using the Meru Teaching and Referral Hospital website, including medical disclaimers, acceptable use, and contact information.',
    'published'
  ),
  (
    'cookie-policy',
    'Cookie Policy',
    $$
<p>This policy explains how MeTRH uses cookies and similar technologies on the website.</p>

<h2>What cookies are</h2>
<p>Cookies are small text files stored by your browser when you visit a website. They help the site remember basic settings and understand how pages are used.</p>

<h2>Cookies we may use</h2>
<ul>
  <li><strong>Essential cookies:</strong> needed for security, page navigation, and core site functions.</li>
  <li><strong>Preference cookies:</strong> remember choices such as display settings where the site offers them.</li>
  <li><strong>Analytics cookies:</strong> help us understand which pages are visited and how users move through the site so we can improve it.</li>
  <li><strong>Embedded content cookies:</strong> may be set by third-party services if a page includes maps, video, or other embedded tools.</li>
</ul>

<h2>Why we use them</h2>
<p>We use cookies to keep the site working, improve performance, measure usage trends, and support a better browsing experience.</p>

<h2>Managing cookies</h2>
<p>You can control cookies through your browser settings. Most browsers let you block or delete cookies, but disabling essential cookies may affect how some parts of the site work.</p>

<h2>Third-party services</h2>
<p>Some services on the site may come from third parties. Those providers may set their own cookies, and their use of data is governed by their own policies.</p>

<h2>Updates</h2>
<p>We may update this cookie policy when the website changes or when the law requires a revision. The latest version will always appear on this page.</p>

<h2>Contact</h2>
<p>If you want to ask a question about cookies on this site, use the contact page.</p>
$$,
    'Cookie Policy - MeTRH',
    'What cookies and similar technologies the Meru Teaching and Referral Hospital website uses and how you can manage them.',
    'published'
  )
on conflict (slug) do update set
  title = excluded.title,
  content = excluded.content,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  status = excluded.status;

insert into public.page_sections (
  page_slug,
  section_key,
  section_type,
  eyebrow,
  title,
  summary,
  body,
  image_url,
  image_alt,
  cta_label,
  cta_href,
  display_order,
  is_active
)
values
  (
    'home',
    'services-overview',
    'feature-list',
    'What we offer',
    'Services across every level of care',
    'Public, specialist, and support services grouped for quick scanning.',
    null,
    null,
    null,
    'View all services',
    '/services',
    10,
    true
  ),
  (
    'home',
    'community-impact',
    'card-grid',
    'Community impact',
    'Blood donated here saves lives here',
    'Stories about the practical impact of blood drives across Meru.',
    'Donated blood is critical for cancer patients, children with severe anaemia, and mothers during childbirth - demand rises during the rainy season with more road accidents on the Meru-Nanyuki highway.',
    null,
    null,
    null,
    null,
    20,
    true
  ),
  (
    'home',
    'careers-tenders',
    'dual-card',
    null,
    'Careers and tenders',
    'A quick link area for applicants and suppliers.',
    null,
    null,
    null,
    'View open positions',
    '/careers',
    30,
    true
  ),
  (
    'about',
    'vision-mission',
    'copy',
    'Vision and mission',
    'Vision and mission',
    'A Level 6 specialized and tertiary referral hospital serving Meru, Tharaka-Nithi, Marsabit, and Isiolo counties - public, affordable, and specialized, with training and research built into how it operates.',
    '<p><strong>Vision:</strong> A specialized referral hospital committed to excellence in innovative health care and training.</p><p><strong>Mission:</strong> To provide client-centered, innovative, specialized and affordable health care; facilitate training and research; and participate in county, national and global healthcare policy formulation.</p>',
    null,
    null,
    null,
    null,
    null,
    10,
    true
  ),
  (
    'about',
    'mission-values',
    'list',
    null,
    'Core Values',
    null,
    null,
    null,
    null,
    null,
    null,
    20,
    true
  ),
  (
    'about',
    'strategic-goals',
    'ordered-list',
    null,
    'Strategic Goals',
    null,
    null,
    null,
    null,
    null,
    null,
    30,
    true
  ),
  (
    'about',
    'growth-development',
    'card-grid',
    'Growth & development',
    'Built for where MeTRH is headed, not just where it is',
    'Current projects showing where the hospital is expanding next.',
    null,
    null,
    null,
    null,
    null,
    40,
    true
  ),
  (
    'about',
    'teaching-affiliations',
    'list',
    'Teaching & research',
    'A teaching hospital, not just a treating one',
    'MeTRH is the teaching hospital for three institutions and an internship centre for Ministry of Health interns, clinical officers, nurses, and nutritionists.',
    null,
    null,
    null,
    null,
    null,
    50,
    true
  ),
  (
    'contact',
    'contact-intro',
    'copy',
    null,
    'Reach MeTRH quickly and clearly',
    'Use the emergency line for urgent care. Use the form for general enquiries, directions, appointments, and institutional requests.',
    null,
    null,
    null,
    null,
    null,
    10,
    true
  )
on conflict (page_slug, section_key) do update set
  section_type = excluded.section_type,
  eyebrow = excluded.eyebrow,
  title = excluded.title,
  summary = excluded.summary,
  body = excluded.body,
  image_url = excluded.image_url,
  image_alt = excluded.image_alt,
  cta_label = excluded.cta_label,
  cta_href = excluded.cta_href,
  display_order = excluded.display_order,
  is_active = excluded.is_active;

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
  section_map.id,
  item.title,
  item.description,
  item.icon,
  item.image_url,
  item.image_alt,
  item.cta_label,
  item.cta_href,
  item.display_order,
  true
from (
  values
    ('home', 'community-impact', 'Arsenal Kenya Supporters'' Club blood drive', 'Over 300 units collected in Meru town, timed around an Arsenal match - organized by AKSC in partnership with local health experts.', 'lucide:heart-handshake', null, null, null, null, 10),
    ('home', 'community-impact', 'Manchester United Fans Kenya (Meru)', 'Around 100 fans donated blood at MeTRH in an organized club drive, covered by Nation Media and K24.', 'lucide:droplets', null, null, null, null, 20),
    ('home', 'community-impact', 'County-led mass donation drives', 'Meru County Government and Kenya Red Cross have run mass blood donation drives, with real lives saved through transfusion at MeTRH documented by the County.', 'lucide:users', null, null, null, null, 30),
    ('about', 'mission-values', 'Leadership & Integrity', null, 'lucide:check-circle-2', null, null, null, null, 10),
    ('about', 'mission-values', 'Compassion', null, 'lucide:check-circle-2', null, null, null, null, 20),
    ('about', 'mission-values', 'Professionalism & Excellence', null, 'lucide:check-circle-2', null, null, null, null, 30),
    ('about', 'mission-values', 'Creativity', null, 'lucide:check-circle-2', null, null, null, null, 40),
    ('about', 'mission-values', 'Teamwork & Team Spirit', null, 'lucide:check-circle-2', null, null, null, null, 50),
    ('about', 'mission-values', 'Responsiveness', null, 'lucide:check-circle-2', null, null, null, null, 60),
    ('about', 'strategic-goals', 'Meet the Highest Standard of Health Care', null, null, null, null, null, null, 10),
    ('about', 'strategic-goals', 'Develop a Culture of Excellence', null, null, null, null, null, null, 20),
    ('about', 'strategic-goals', 'Resource Sustainability', null, null, null, null, null, null, 30),
    ('about', 'strategic-goals', 'Enhance Institutional Capacity', null, null, null, null, null, null, 40),
    ('about', 'strategic-goals', 'Strategic Partnership', null, null, null, null, null, null, 50),
    ('about', 'strategic-goals', 'Strengthening Information Management, Research, Innovation and Development', null, null, null, null, null, null, 60),
    ('about', 'growth-development', 'Dedicated Cancer Centre', 'Public-Private Partnership - Under development', 'lucide:building-2', null, null, null, null, 10),
    ('about', 'growth-development', 'New 250-bed ward block', 'Additional inpatient capacity as MeTRH''s daily inpatient load regularly exceeds current bed capacity.', 'lucide:hammer', null, null, null, null, 20),
    ('about', 'growth-development', 'Level 6 transition', 'Hospital-wide departmental changes as MeTRH becomes a fully-fledged specialized referral hospital.', 'lucide:trending-up', null, null, null, null, 30),
    ('about', 'teaching-affiliations', 'Kenya Methodist University (KeMU)', null, 'lucide:graduation-cap', null, null, null, null, 10),
    ('about', 'teaching-affiliations', 'Meru University of Science and Technology', null, 'lucide:graduation-cap', null, null, null, null, 20),
    ('about', 'teaching-affiliations', 'Kenya Medical Training College (KMTC)', null, 'lucide:graduation-cap', null, null, null, null, 30)
) as item(page_slug, section_key, title, description, icon, image_url, image_alt, cta_label, cta_href, display_order)
join public.page_sections as section_map
  on section_map.page_slug = item.page_slug
 and section_map.section_key = item.section_key
on conflict do nothing;

insert into public.page_slides (
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
    10,
    true
  ),
  (
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
    20,
    true
  ),
  (
    'home',
    'hero',
    'Growth and teaching',
    'A hospital that is expanding with purpose.',
    'New capacity, equipment, and training investments are strengthening the hospital''s ability to deliver better outcomes for patients and the wider region.',
    'Learn about MeTRH',
    '/about',
    '/surgery-1.jpg',
    'Surgical care inside MeTRH',
    'Specialized treatment supported by theatre and recovery teams.',
    30,
    true
  )
on conflict (page_slug, section_key, display_order) do update set
  eyebrow = excluded.eyebrow,
  title = excluded.title,
  body = excluded.body,
  cta_label = excluded.cta_label,
  cta_href = excluded.cta_href,
  image_url = excluded.image_url,
  image_alt = excluded.image_alt,
  caption = excluded.caption,
  is_active = excluded.is_active;

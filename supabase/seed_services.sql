-- Seed public services from content.md
-- Run this after the schema in schema.sql has been applied.

begin;

insert into public.service_categories (name, slug, icon, description, display_order)
values
  ('Emergency & Critical Care', 'emergency-critical-care', 'lucide:siren', null, 1),
  ('Outpatient / Specialized Clinics', 'outpatient-specialized-clinics', 'lucide:clipboard-list', null, 2),
  ('Surgery & Theatre', 'surgery-theatre', 'lucide:scissors', null, 3),
  ('Maternity, Newborn & Reproductive Health', 'maternity-newborn-reproductive-health', 'lucide:baby', null, 4),
  ('Oncology / Cancer Care', 'oncology-cancer-care', 'lucide:ribbon', null, 5),
  ('Renal Services', 'renal-services', 'lucide:droplets', null, 6),
  ('Imaging & Diagnostics', 'imaging-diagnostics', 'lucide:scan-line', null, 7),
  ('Laboratory', 'laboratory', 'lucide:flask-conical', null, 8),
  ('Tuberculosis & Infectious Disease', 'tuberculosis-infectious-disease', 'lucide:shield-plus', null, 9),
  ('Mental Health', 'mental-health', 'lucide:brain', null, 10),
  ('Dental & Maxillofacial', 'dental-maxillofacial', 'lucide:smile-plus', null, 11),
  ('Rehabilitation & Therapy', 'rehabilitation-therapy', 'lucide:activity', null, 12),
  ('Other Specialized / Support Services', 'other-specialized-support-services', 'lucide:badge-info', null, 13)
on conflict (slug) do update set
  name = excluded.name,
  icon = excluded.icon,
  description = excluded.description,
  display_order = excluded.display_order;

with service_rows (category_slug, name, slug, display_order) as (
  values
    ('emergency-critical-care', 'Accident and Emergency Casualty Services', 'accident-and-emergency-casualty-services', 1),
    ('emergency-critical-care', 'ICU Services', 'icu-services', 2),
    ('emergency-critical-care', 'High Dependency Services', 'high-dependency-services', 3),
    ('emergency-critical-care', 'Comprehensive Emergency Preparedness – Basic Life Support', 'comprehensive-emergency-preparedness-basic-life-support', 4),
    ('emergency-critical-care', 'Basic Emergency Preparedness – Advanced Life Support', 'basic-emergency-preparedness-advanced-life-support', 5),
    ('emergency-critical-care', 'Ambulatory Services', 'ambulatory-services', 6),
    ('outpatient-specialized-clinics', 'General Outpatient', 'general-outpatient', 1),
    ('outpatient-specialized-clinics', 'Medical Outpatient Clinic', 'medical-outpatient-clinic', 2),
    ('outpatient-specialized-clinics', 'Surgical Outpatient Clinic', 'surgical-outpatient-clinic', 3),
    ('outpatient-specialized-clinics', 'Paediatric Outpatient Clinic', 'paediatric-outpatient-clinic', 4),
    ('outpatient-specialized-clinics', 'Gynaecology Outpatient Clinic', 'gynaecology-outpatient-clinic', 5),
    ('outpatient-specialized-clinics', 'Skin Clinic (Dermatology)', 'skin-clinic-dermatology', 6),
    ('outpatient-specialized-clinics', 'Ophthalmology', 'ophthalmology', 7),
    ('outpatient-specialized-clinics', 'Ear, Nose and Throat (ENT) Services', 'ear-nose-and-throat-ent-services', 8),
    ('surgery-theatre', 'General Theatre Services', 'general-theatre-services', 1),
    ('surgery-theatre', 'Minor Theatre Services', 'minor-theatre-services', 2),
    ('surgery-theatre', 'Orthopaedic Surgeries & Procedures', 'orthopaedic-surgeries-procedures', 3),
    ('surgery-theatre', 'Orthopaedic Technology / Basic Orthopaedic Services', 'orthopaedic-technology-basic-orthopaedic-services', 4),
    ('maternity-newborn-reproductive-health', 'Comprehensive Maternity Obstetric Care (CEmOC)', 'comprehensive-maternity-obstetric-care-cemoc', 1),
    ('maternity-newborn-reproductive-health', 'Basic Obstetric Care (BEmOC)', 'basic-obstetric-care-bemoc', 2),
    ('maternity-newborn-reproductive-health', 'Postnatal Care Services', 'postnatal-care-services', 3),
    ('maternity-newborn-reproductive-health', 'Focused Antenatal Care', 'focused-antenatal-care', 4),
    ('maternity-newborn-reproductive-health', 'Specialised ANC – High-Risk Pregnancy', 'specialised-anc-high-risk-pregnancy', 5),
    ('maternity-newborn-reproductive-health', 'New Born Care Service', 'new-born-care-service', 6),
    ('maternity-newborn-reproductive-health', 'Family Planning: Short Acting, Long Acting, Permanent, Natural methods', 'family-planning-short-acting-long-acting-permanent-natural-methods', 7),
    ('maternity-newborn-reproductive-health', 'Integrated Management of Newborn & Childhood Illnesses (IMNCI)', 'integrated-management-of-newborn-childhood-illnesses-imnci', 8),
    ('maternity-newborn-reproductive-health', 'Child Immunization / Integrated Immunisation', 'child-immunization-integrated-immunisation', 9),
    ('maternity-newborn-reproductive-health', 'TT Toxoid for Pregnant Women', 'tt-toxoid-for-pregnant-women', 10),
    ('oncology-cancer-care', 'Chemotherapy', 'chemotherapy', 1),
    ('oncology-cancer-care', 'Counselling for Oncology Services', 'counselling-for-oncology-services', 2),
    ('oncology-cancer-care', 'Weekly endoscopy services (Wednesdays) — part of oesophageal cancer screening partnership', 'weekly-endoscopy-services-wednesdays-part-of-oesophageal-cancer-screening-partnership', 3),
    ('oncology-cancer-care', 'Dedicated Cancer Centre under development (see Growth section — chemotherapy, radiotherapy, surgery)', 'dedicated-cancer-centre-under-development-see-growth-section-chemotherapy-radiotherapy-surgery', 4),
    ('renal-services', 'Renal Services (general)', 'renal-services-general', 1),
    ('renal-services', 'Dialysis', 'dialysis', 2),
    ('imaging-diagnostics', 'CT Scans', 'ct-scans', 1),
    ('imaging-diagnostics', 'MRI Imaging', 'mri-imaging', 2),
    ('imaging-diagnostics', 'General Radiography Services', 'general-radiography-services', 3),
    ('imaging-diagnostics', 'Specialised X-Ray', 'specialised-x-ray', 4),
    ('imaging-diagnostics', 'Ultrasound', 'ultrasound', 5),
    ('imaging-diagnostics', 'Mammography', 'mammography', 6),
    ('imaging-diagnostics', 'Barium Meal', 'barium-meal', 7),
    ('laboratory', 'Laboratory Classes A through F (full diagnostic lab capability)', 'laboratory-classes-a-through-f-full-diagnostic-lab-capability', 1),
    ('laboratory', 'GeneXpert (TB/molecular diagnostics)', 'genexpert-tb-molecular-diagnostics', 2),
    ('laboratory', 'Tumour markers testing', 'tumour-markers-testing', 3),
    ('laboratory', 'Pathology department', 'pathology-department', 4),
    ('tuberculosis-infectious-disease', 'TB Diagnosis: Smear Microscopy, Sputum Culture, Fine Needle Aspiration, X-ray, GeneXpert', 'tb-diagnosis-smear-microscopy-sputum-culture-fine-needle-aspiration-x-ray-genexpert', 1),
    ('tuberculosis-infectious-disease', 'TB Treatment, including Multi-Drug Resistant TB Treatment', 'tb-treatment-including-multi-drug-resistant-tb-treatment', 2),
    ('tuberculosis-infectious-disease', 'HIV Treatment and Care', 'hiv-treatment-and-care', 3),
    ('tuberculosis-infectious-disease', 'HIV Counselling & Testing', 'hiv-counselling-testing', 4),
    ('tuberculosis-infectious-disease', 'HIV Risk Reduction for Priority Populations', 'hiv-risk-reduction-for-priority-populations', 5),
    ('tuberculosis-infectious-disease', 'EMTCT (Elimination of Mother-to-Child Transmission of HIV)', 'emtct-elimination-of-mother-to-child-transmission-of-hiv', 6),
    ('tuberculosis-infectious-disease', 'Condom Distribution & STI Prevention', 'condom-distribution-sti-prevention', 7),
    ('tuberculosis-infectious-disease', 'Leprosy Diagnosis (Slit Skin Smears — Microscopy & Culture) and Treatment', 'leprosy-diagnosis-slit-skin-smears-microscopy-culture-and-treatment', 8),
    ('mental-health', 'Basic Mental Health Services – Psychosocial interventions (promotive/preventive)', 'basic-mental-health-services-psychosocial-interventions-promotive-preventive', 1),
    ('mental-health', 'Specialised Mental Health Services – Vocational and Medical Rehabilitation Centres', 'specialised-mental-health-services-vocational-and-medical-rehabilitation-centres', 2),
    ('mental-health', 'Weekly Psychiatry clinic', 'weekly-psychiatry-clinic', 3),
    ('dental-maxillofacial', 'Basic Dental Services', 'basic-dental-services', 1),
    ('dental-maxillofacial', 'Specialised Dental Services', 'specialised-dental-services', 2),
    ('dental-maxillofacial', 'Maxillofacial Surgery', 'maxillofacial-surgery', 3),
    ('rehabilitation-therapy', 'Basic & Specialised Physiotherapy', 'basic-specialised-physiotherapy', 1),
    ('rehabilitation-therapy', 'Basic & Specialised Occupational Therapy (including paediatric)', 'basic-specialised-occupational-therapy-including-paediatric', 2),
    ('rehabilitation-therapy', 'Orthopaedic rehabilitation', 'orthopaedic-rehabilitation', 3),
    ('other-specialized-support-services', 'Blood Transfusion Services', 'blood-transfusion-services', 1),
    ('other-specialized-support-services', 'Comprehensive & Basic Mortuary Services', 'comprehensive-basic-mortuary-services', 2),
    ('other-specialized-support-services', 'Forensic Services', 'forensic-services', 3),
    ('other-specialized-support-services', 'Comprehensive Services for Gender-Based Violence (GBV) Survivors (and Basic GBV services)', 'comprehensive-services-for-gender-based-violence-gbv-survivors-and-basic-gbv-services', 4),
    ('other-specialized-support-services', 'Youth-Friendly Services', 'youth-friendly-services', 5),
    ('other-specialized-support-services', 'Endoscopic surgery / laparoscopy (minimal access surgery)', 'endoscopic-surgery-laparoscopy-minimal-access-surgery', 6),
    ('other-specialized-support-services', 'Neurosurgery (spinal and head injury surgery — see Milestones)', 'neurosurgery-spinal-and-head-injury-surgery-see-milestones', 7),
    ('other-specialized-support-services', 'Cleft lip and palate camps (periodic specialist camps)', 'cleft-lip-and-palate-camps-periodic-specialist-camps', 8),
    ('other-specialized-support-services', 'Infection Prevention and Control (workplace HIV mitigation)', 'infection-prevention-and-control-workplace-hiv-mitigation', 9)
)
insert into public.services (category_id, name, slug, summary, description, display_order, is_active)
select
  sc.id,
  sr.name,
  sr.slug,
  null,
  null,
  sr.display_order,
  true
from service_rows sr
join public.service_categories sc on sc.slug = sr.category_slug
on conflict (slug) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  summary = excluded.summary,
  description = excluded.description,
  display_order = excluded.display_order,
  is_active = excluded.is_active,
  updated_at = now();

-- Clinic schedule is stored as one row per day + clinic.
insert into public.clinic_schedule (clinic_name, day_of_week, start_time, is_active, notes)
select clinic_name, day_of_week, start_time, is_active, notes
from (
  values
    ('Dermatology', 'monday'::day_of_week, time '07:00', true, null),
    ('NCD', 'monday'::day_of_week, time '07:00', true, null),
    ('Psychiatry', 'monday'::day_of_week, time '07:00', true, null),
    ('Maxillofacial', 'monday'::day_of_week, time '07:00', true, null),
    ('SOPC', 'tuesday'::day_of_week, time '07:00', true, null),
    ('Urology', 'tuesday'::day_of_week, time '07:00', true, null),
    ('Neuro Surgery', 'tuesday'::day_of_week, time '07:00', true, null),
    ('NCD', 'tuesday'::day_of_week, time '07:00', true, null),
    ('ENT (7 AM)', 'tuesday'::day_of_week, time '07:00', true, null),
    ('Psychiatry', 'tuesday'::day_of_week, time '07:00', true, null),
    ('Maxillofacial', 'tuesday'::day_of_week, time '07:00', true, null),
    ('NCD', 'wednesday'::day_of_week, time '07:00', true, null),
    ('GOPC', 'wednesday'::day_of_week, time '07:00', true, null),
    ('Ophthalmology', 'wednesday'::day_of_week, time '07:00', true, null),
    ('Psychiatry', 'wednesday'::day_of_week, time '07:00', true, null),
    ('Maxillofacial', 'wednesday'::day_of_week, time '07:00', true, null),
    ('NCD', 'thursday'::day_of_week, time '07:00', true, null),
    ('POPC', 'thursday'::day_of_week, time '07:00', true, null),
    ('Psychiatry', 'thursday'::day_of_week, time '07:00', true, null),
    ('NCD', 'friday'::day_of_week, time '07:00', true, null),
    ('Dermatology', 'friday'::day_of_week, time '07:00', true, null),
    ('Psychiatry', 'friday'::day_of_week, time '07:00', true, null),
    ('Orthopaedic', 'friday'::day_of_week, time '07:00', true, null)
) as seed (clinic_name, day_of_week, start_time, is_active, notes)
where not exists (
  select 1
  from public.clinic_schedule cs
  where cs.clinic_name = seed.clinic_name
    and cs.day_of_week = seed.day_of_week
    and cs.start_time = seed.start_time
);

commit;

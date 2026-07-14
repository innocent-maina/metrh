export interface HospitalMediaItem {
  src: string;
  alt: string;
  eyebrow: string;
  caption: string;
}

type MediaKey =
  | "home"
  | "about"
  | "services"
  | "contact"
  | "blog"
  | "careers"
  | "tenders"
  | "legal"
  | "dashboard"
  | "auth";

function image(path: string, alt: string, eyebrow: string, caption: string): HospitalMediaItem {
  return {
    src: encodeURI(`/${path}`),
    alt,
    eyebrow,
    caption,
  };
}

const mediaSets: Record<MediaKey, HospitalMediaItem[]> = {
  home: [
    image(
      "welcome.jpg",
      "MeTRH welcome entrance",
      "Welcome",
      "The main entry point for patients, families, and referrers.",
    ),
    image(
      "facility.jpg",
      "MeTRH facility exterior",
      "Facility",
      "A broad view of the hospital campus and public service areas.",
    ),
    image(
      "doctor-examining-patient.jpg",
      "A doctor examining a patient",
      "Outpatient care",
      "Clinical assessment that starts the care journey.",
    ),
    image(
      "surgery-1.jpg",
      "Surgical care inside MeTRH",
      "Surgery",
      "Specialized treatment supported by theatre and recovery teams.",
    ),
    image(
      "blood-1.jpg",
      "Blood donation activity at MeTRH",
      "Community impact",
      "Blood drives keep emergency, maternity, and oncology care supplied.",
    ),
    image(
      "care.jpg",
      "Care team at MeTRH",
      "Care",
      "A calm care setting that runs throughout the hospital.",
    ),
    image(
      "care1.jpg",
      "Clinical care interaction",
      "Support",
      "A patient-facing interaction from the care continuum.",
    ),
    image(
      "planning-1.jpg",
      "Hospital planning session",
      "Planning",
      "Operational planning behind service delivery and growth.",
    ),
    image(
      "new-machine-2.jpg",
      "New medical machine installation",
      "Infrastructure",
      "Capacity gains come from equipment and infrastructure upgrades.",
    ),
    image(
      "donation-2.jpg",
      "Donation campaign participants",
      "Community",
      "Public participation strengthens the hospital's outreach work.",
    ),
  ],
  about: [
    image(
      "building.jpg",
      "MeTRH hospital building",
      "Hospital profile",
      "The hospital's scale and presence in Meru County.",
    ),
    image(
      "Governor Mutuma.jpg",
      "Hospital leadership visit",
      "Leadership",
      "Public leadership and institutional accountability in action.",
    ),
    image(
      "planning-1.jpg",
      "Hospital planning session",
      "Growth",
      "Strategic planning for service expansion and capacity growth.",
    ),
    image(
      "new-machine-1.jpg",
      "New diagnostic machine installation",
      "Modernization",
      "Equipment upgrades that improve diagnosis and treatment.",
    ),
    image(
      "care1.jpg",
      "Care team interaction with a patient",
      "Patient-centered care",
      "The hospital's core mission is built around compassionate service.",
    ),
  ],
  services: [
    image(
      "doctor-with-patient.jpg",
      "Doctor speaking with a patient",
      "Consultation",
      "A direct conversation about symptoms, treatment, and next steps.",
    ),
    image(
      "doctor-examining-patient.jpg",
      "Doctor examining a patient",
      "Assessment",
      "Clinical examination that supports informed specialist referral.",
    ),
    image(
      "lab-1.jpg",
      "Laboratory work at MeTRH",
      "Laboratory",
      "Testing services that support diagnosis and monitoring.",
    ),
    image(
      "lab-2.jpg",
      "Laboratory equipment in use",
      "Diagnostics",
      "Modern lab processes help clinicians act quickly and accurately.",
    ),
    image(
      "surgery-2.jpg",
      "Surgical theatre activity",
      "Theatre",
      "Specialist surgical care delivered by coordinated clinical teams.",
    ),
  ],
  contact: [
    image(
      "welcome.jpg",
      "MeTRH welcome entrance",
      "Visit",
      "A familiar entry point for patients and visitors.",
    ),
    image(
      "facility.jpg",
      "Hospital facility view",
      "Directions",
      "The main campus layout helps patients find services quickly.",
    ),
    image(
      "building.jpg",
      "Hospital building exterior",
      "Address",
      "The public-facing hospital block where most visits begin.",
    ),
    image(
      "care.jpg",
      "Patient care scene",
      "Enquiries",
      "General enquiries are handled through the hospital teams.",
    ),
    image(
      "doctor-with-patient.jpg",
      "Doctor consulting with a patient",
      "Appointments",
      "Use the contact page for directions, appointments, and general help.",
    ),
  ],
  blog: [
    image(
      "blood-2.jpg",
      "Blood donation campaign imagery",
      "Stories",
      "Community coverage around blood donation and donor recruitment.",
    ),
    image(
      "blood-3.jpg",
      "Hospital blood bank activity",
      "Impact",
      "Transfusion support that changes patient outcomes.",
    ),
    image(
      "blood-4.jpg",
      "Blood donation and volunteer support",
      "Outreach",
      "Hospital outreach stories captured in the public record.",
    ),
    image(
      "donation-1.jpg",
      "Donation drive at MeTRH",
      "Community",
      "Public-facing campaign work with local partners.",
    ),
    image(
      "donation-2.jpg",
      "Donation campaign participants",
      "Service",
      "News items that document how the hospital serves Meru.",
    ),
  ],
  careers: [
    image(
      "new-machine-2.jpg",
      "New medical machine installation",
      "Modern tools",
      "The hospital keeps investing in equipment and capability.",
    ),
    image(
      "new-machine-3.jpg",
      "Specialized hospital machine",
      "Infrastructure",
      "Technical capacity matters when recruiting specialist staff.",
    ),
    image(
      "new-machine-4.jpg",
      "Hospital machine upgrade",
      "Growth",
      "A changing clinical environment creates new roles and skills.",
    ),
    image(
      "planning-2.jpg",
      "Planning session at the hospital",
      "Workforce",
      "Recruitment rounds support the teams that keep services running.",
    ),
    image(
      "planning-3.jpg",
      "Strategic planning document review",
      "Opportunities",
      "Recruitment is tied to service expansion and operational planning.",
    ),
  ],
  tenders: [
    image(
      "planning-1.jpg",
      "Procurement planning discussion",
      "Procurement",
      "Planning sessions for public tender and supply needs.",
    ),
    image(
      "planning-2.jpg",
      "Tender planning materials",
      "Bids",
      "Procurement notices start with clear planning and specifications.",
    ),
    image(
      "planning-3.jpg",
      "Supply and procurement planning",
      "Suppliers",
      "Public procurement supports the hospital's service continuity.",
    ),
    image(
      "building.jpg",
      "Hospital building and operations",
      "Operations",
      "Facilities and infrastructure keep the institution functioning.",
    ),
    image(
      "facility.jpg",
      "Hospital facility overview",
      "Supporting files",
      "Document workflows fit into the wider operational picture.",
    ),
  ],
  legal: [
    image(
      "care.jpg",
      "Care team and patient support",
      "Policy",
      "Hospital policies are written around patient care and safety.",
    ),
    image(
      "care1.jpg",
      "Clinical care interaction",
      "Trust",
      "Terms and privacy pages sit behind a real care setting.",
    ),
    image(
      "care2.jpg",
      "Hospital care scene",
      "Safeguards",
      "Clear policies protect patients, staff, and public data.",
    ),
    image(
      "welcome.jpg",
      "Hospital welcome entrance",
      "Access",
      "The public-facing hospital stays grounded in service and access.",
    ),
    image(
      "building.jpg",
      "MeTRH building exterior",
      "Institution",
      "The hospital's legal pages describe the institution behind the service.",
    ),
  ],
  dashboard: [
    image(
      "building.jpg",
      "Hospital building exterior",
      "Operations",
      "The management view starts with the physical hospital campus.",
    ),
    image(
      "facility.jpg",
      "Hospital facility overview",
      "Capacity",
      "Staff tools support the spaces where care is delivered.",
    ),
    image(
      "planning-1.jpg",
      "Planning work at the hospital",
      "Planning",
      "Internal content management depends on clear planning and roles.",
    ),
    image(
      "doctor-examining-patient.jpg",
      "Doctor examining a patient",
      "Clinical workflow",
      "Operational decisions must stay close to patient care.",
    ),
    image(
      "new-machine-1.jpg",
      "New medical machine installation",
      "Service growth",
      "Content management reflects a hospital that keeps expanding.",
    ),
  ],
  auth: [
    image(
      "welcome.jpg",
      "Hospital welcome entrance",
      "Staff access",
      "Sign-in pages sit alongside the hospital's public identity.",
    ),
    image(
      "facility.jpg",
      "Hospital facility overview",
      "Access",
      "Staff tools connect back to the hospital environment.",
    ),
    image(
      "care.jpg",
      "Clinical care scene",
      "Support",
      "Credentialed access protects operational and patient information.",
    ),
    image(
      "doctor-with-patient.jpg",
      "Doctor speaking with a patient",
      "Accountability",
      "Staff login keeps the management workflow close to real care.",
    ),
    image(
      "building.jpg",
      "Hospital building exterior",
      "Hospital",
      "The MeTRH brand stays visible even in the internal tools.",
    ),
  ],
};

function resolveKey(path: string): MediaKey {
  const normalized = path.toLowerCase();

  if (normalized === "/") return "home";
  if (normalized.startsWith("/about")) return "about";
  if (normalized.startsWith("/services")) return "services";
  if (normalized.startsWith("/contact")) return "contact";
  if (normalized.startsWith("/blog")) return "blog";
  if (normalized.startsWith("/careers")) return "careers";
  if (normalized.startsWith("/tenders")) return "tenders";
  if (normalized.startsWith("/dashboard")) {
    if (
      normalized.startsWith("/dashboard/login") ||
      normalized.startsWith("/dashboard/forgot-password") ||
      normalized.startsWith("/dashboard/confirm") ||
      normalized.startsWith("/dashboard/unauthorized")
    ) {
      return "auth";
    }
    return "dashboard";
  }

  return "legal";
}

export function resolveHospitalMedia(path: string): HospitalMediaItem[] {
  return mediaSets[resolveKey(path)];
}

export function useHospitalMedia() {
  const route = useRoute();
  return computed<HospitalMediaItem[]>(() => resolveHospitalMedia(route.path));
}

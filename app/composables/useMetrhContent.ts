import contentMarkdown from "../../content.md?raw";
import type { DayOfWeek } from "~~/types/database.types";

export interface ServiceItem {
  name: string;
  slug: string;
}

export interface ServiceGroup {
  name: string;
  slug: string;
  icon: string;
  services: ServiceItem[];
}

export interface ClinicSession {
  day: DayOfWeek;
  dayLabel: string;
  clinics: string[];
}

export interface ContactSummary {
  emergencyLine: string;
  physicalAddress: string;
  postalAddress: string;
  visitingHoursSummary: string;
  visitingHours: Array<{ label: string; start: string; end: string }>;
  googleMapsHref: string;
  socialLinks: {
    facebook: string;
    x: string;
  };
}

export interface StoryCard {
  slug: string;
  category: string;
  yearLabel: string;
  title: string;
  summary: string;
  body: string;
}

export interface EventAlbum {
  slug: string;
  category: string;
  yearLabel: string;
  title: string;
  summary: string;
  highlights: string[];
}

export interface RecruitmentPosition {
  title: string;
  posts: number;
  terms: string;
}

export interface RecruitmentRound {
  slug: string;
  referenceNo: string;
  title: string;
  status: "open" | "closed";
  deadlineLabel: string;
  summary: string;
  description: string;
  positions: RecruitmentPosition[];
}

const iconByCategory: Record<string, string> = {
  "Emergency & Critical Care": "lucide:siren",
  "Outpatient / Specialized Clinics": "lucide:clipboard-list",
  "Surgery & Theatre": "lucide:scissors",
  "Maternity, Newborn & Reproductive Health": "lucide:baby",
  "Oncology / Cancer Care": "lucide:ribbon",
  "Renal Services": "lucide:droplets",
  "Imaging & Diagnostics": "lucide:scan-line",
  Laboratory: "lucide:flask-conical",
  "Tuberculosis & Infectious Disease": "lucide:shield-plus",
  "Mental Health": "lucide:brain",
  "Dental & Maxillofacial": "lucide:smile-plus",
  "Rehabilitation & Therapy": "lucide:activity",
  "Other Specialized / Support Services": "lucide:badge-info",
  "Specialist departments explicitly named (from legacy site + press)": "lucide:users",
};

const contactSummary: ContactSummary = {
  emergencyLine: "0711-207623",
  physicalAddress: "Meru–Nanyuki Road, Telkom Ltd junction, Meru Town",
  postalAddress: "P.O. Box 8 – 60200, Meru",
  visitingHoursSummary: "Visiting: 6–7am · 12:30–2pm · 4:30–5:30pm",
  visitingHours: [
    { label: "Morning", start: "6:00 AM", end: "7:00 AM" },
    { label: "Lunch", start: "12:30 PM", end: "2:00 PM" },
    { label: "Evening", start: "4:30 PM", end: "5:30 PM" },
  ],
  googleMapsHref:
    "https://www.google.com/maps/search/?api=1&query=Meru+Teaching+and+Referral+Hospital+Meru+Kenya",
  socialLinks: {
    facebook: "https://facebook.com/MeTRH.Hospital",
    x: "https://x.com/MeTRH_Hospital",
  },
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function linesFromSection(sectionNumber: number) {
  const lines = contentMarkdown.split(/\r?\n/);
  const start = lines.findIndex((line) =>
    line.startsWith(`## ${sectionNumber}. `),
  );

  if (start === -1) {
    return [];
  }

  const end = lines.findIndex(
    (line, index) => index > start && line.startsWith("## "),
  );

  return lines.slice(start + 1, end === -1 ? undefined : end);
}

function parseBulletGroups(sectionLines: string[]) {
  const groups: ServiceGroup[] = [];
  let currentGroup: ServiceGroup | null = null;

  for (const rawLine of sectionLines) {
    const line = rawLine.trim();
    if (!line) continue;

    const headingMatch = line.match(/^\*\*(.+)\*\*$/);
    if (headingMatch) {
      const name = headingMatch[1]?.trim();
      if (!name) continue;
      currentGroup = {
        name,
        slug: slugify(name),
        icon: iconByCategory[name] ?? "lucide:stethoscope",
        services: [],
      };
      groups.push(currentGroup);
      continue;
    }

    if (line.startsWith("- ") && currentGroup) {
      currentGroup.services.push({
        name: line.slice(2).trim(),
        slug: slugify(line.slice(2).trim()),
      });
    }
  }

  return groups;
}

function parseServices() {
  const sectionLines = linesFromSection(5);
  const start = sectionLines.findIndex((line) =>
    line.includes("Full verified service list"),
  );
  const end = sectionLines.findIndex((line) =>
    line.includes("Specialist departments explicitly named"),
  );

  const verifiedGroups =
    start === -1
      ? []
      : parseBulletGroups(sectionLines.slice(start + 1, end === -1 ? undefined : end));

  const specialistGroups =
    end === -1
      ? []
      : parseBulletGroups(sectionLines.slice(end + 1));

  return [...verifiedGroups, ...specialistGroups];
}

function parseClinicSchedule(): ClinicSession[] {
  const sectionLines = linesFromSection(6);
  return sectionLines
    .map((line) => {
      const match = line.match(/^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|$/);
      if (!match) return null;

      const dayLabel = match[1]?.trim();
      const clinicsText = match[2]?.trim();
      if (!dayLabel || !clinicsText) return null;
      if (dayLabel === "Day" || dayLabel.startsWith("-")) return null;

      const clinics = clinicsText
        .replace(/\s*—\s*$/, "")
        .split(/,\s*/)
        .map((entry) => entry.trim())
        .filter(Boolean);

      const day = dayLabel.toLowerCase() as DayOfWeek;
      return { day, dayLabel, clinics };
    })
    .filter((entry): entry is ClinicSession => entry !== null);
}

const serviceGroups = parseServices();
const clinicSchedule = parseClinicSchedule();

const milestoneStories: StoryCard[] = [
  {
    slug: "first-spinal-surgeries-in-the-region",
    category: "2023 milestone",
    yearLabel: "2023",
    title: "First spinal surgeries in Upper Eastern Kenya",
    summary:
      "MeTRH's neurosurgery team performed the region's first spinal procedures, ending routine referral to Nairobi for spinal, neck, and head injuries.",
    body:
      "A team led by Dr. Muthoka Mativo performed the first spinal surgeries in the region, including a neck fracture case and a paralysis case. The milestone marked a practical shift in what the hospital can safely treat on site.",
  },
  {
    slug: "oesophageal-cancer-screening-partnership",
    category: "Service expansion",
    yearLabel: "2025",
    title: "Weekly oesophageal cancer screening continues",
    summary:
      "MeTRH partnered with the National Cancer Institute of Kenya and Meru County to run weekly endoscopy services every Wednesday.",
    body:
      "The partnership brought mobile screening and endoscopy across the county, with MeTRH committing to maintain Wednesday endoscopy as a standing service for early detection.",
  },
  {
    slug: "new-ward-block-and-cancer-centre",
    category: "Growth & development",
    yearLabel: "Under development",
    title: "A new ward block and Cancer Centre are being built",
    summary:
      "The hospital is transitioning into a fuller Level 6 facility with a new 250-bed ward block and a 50-bed Cancer Centre PPP project.",
    body:
      "The ward block and cancer project are the clearest signal of where the hospital is heading: more inpatient capacity, more specialized care, and more treatment kept closer to home for Upper Eastern Kenya.",
  },
  {
    slug: "community-blood-drive-results",
    category: "Community impact",
    yearLabel: "2026",
    title: "Blood drives keep transfusion supplies moving",
    summary:
      "Fan-club and county-led blood drives have collected hundreds of units for cancer patients, mothers, children, and trauma cases.",
    body:
      "Meru's blood donation stories are about practical, local impact: blood collected in the community is transfused at MeTRH for cancer patients, severe anaemia, complicated deliveries, and road-traffic injuries.",
  },
];

const eventAlbums: EventAlbum[] = [
  {
    slug: "arsenal-kenya-supporters-club-blood-drive",
    category: "Blood drive",
    yearLabel: "2026",
    title: "Arsenal Kenya Supporters' Club blood drive",
    summary:
      "A Meru town drive that collected 300+ units and turned a football match weekend into community health action.",
    highlights: [
      "300+ units collected",
      "Held in Meru town",
      "Linked to local transfusion demand",
    ],
  },
  {
    slug: "manchester-united-fans-kenya-blood-donation",
    category: "Blood drive",
    yearLabel: "Community event",
    title: "Manchester United Fans Kenya donation day",
    summary:
      "A fan-led blood drive at MeTRH that brought around 100 donors to the hospital.",
    highlights: ["Around 100 donors", "Hospital-based drive", "Community-led"],
  },
  {
    slug: "county-mass-blood-donation",
    category: "Public health",
    yearLabel: "County drive",
    title: "County-led mass blood donation",
    summary:
      "Meru County and Kenya Red Cross have hosted mass donation drives with stories of lives saved through transfusion.",
    highlights: [
      "County-led",
      "Kenya Red Cross involvement",
      "Real transfusion impact",
    ],
  },
];

const recruitmentRounds: RecruitmentRound[] = [
  {
    slug: "metrh-hrm-02-2025-2026",
    referenceNo: "MeTRH/HRM/02/2025/2026",
    title: "Recent contract recruitment round",
    status: "closed",
    deadlineLabel: "Thursday, 2 April 2026",
    summary:
      "An archived recruitment round showing the kinds of roles MeTRH advertises when hiring is active.",
    description:
      "The hospital recruits on a rolling basis. This archived round is retained here as a realistic example of the kind of vacancies MeTRH publishes through the dashboard when openings are live.",
    positions: [
      { title: "Critical Care Nurse", posts: 2, terms: "Contract" },
      { title: "Medical Laboratory Technologist", posts: 4, terms: "Contract" },
      { title: "Theatre Technologist", posts: 2, terms: "Contract" },
      { title: "Orthopedic Technologist", posts: 1, terms: "Contract" },
      { title: "Inventory Clerk", posts: 5, terms: "Contract" },
      { title: "Pharmaceutical Technologist", posts: 1, terms: "Contract" },
      { title: "Registered Clinical Officer", posts: 1, terms: "Contract" },
      { title: "Medical Social Worker", posts: 1, terms: "Contract" },
    ],
  },
];

let cachedContent: {
  serviceGroups: ServiceGroup[];
  clinicSchedule: ClinicSession[];
  contactSummary: ContactSummary;
  milestoneStories: StoryCard[];
  eventAlbums: EventAlbum[];
  recruitmentRounds: RecruitmentRound[];
} | null = null;

function buildContent() {
  return {
    serviceGroups,
    clinicSchedule,
    contactSummary,
    milestoneStories,
    eventAlbums,
    recruitmentRounds,
  };
}

export function useMetrhContent() {
  if (!cachedContent) {
    cachedContent = buildContent();
  }

  return cachedContent;
}

import type { AppRole } from "~~/types/database.types";

export interface DashboardSection {
  id: string;
  label: string;
  to: string;
  description: string;
  roles: AppRole[];
  icon: string;
}

const dashboardSections: DashboardSection[] = [
  {
    id: "blog",
    label: "Blog",
    to: "/dashboard/blog",
    description: "Manage milestone stories, categories, and tags.",
    roles: ["content_editor"],
    icon: "lucide:newspaper",
  },
  {
    id: "services",
    label: "Services",
    to: "/dashboard/services",
    description: "Edit service categories, services, and clinic schedule.",
    roles: ["content_editor"],
    icon: "lucide:stethoscope",
  },
  {
    id: "contact",
    label: "Contact inbox",
    to: "/dashboard/contact",
    description: "Review enquiries and internal notes.",
    roles: ["front_desk", "content_editor"],
    icon: "lucide:inbox",
  },
  {
    id: "careers",
    label: "Careers",
    to: "/dashboard/careers",
    description: "Publish jobs and review applications.",
    roles: ["hr_manager"],
    icon: "lucide:briefcase",
  },
  {
    id: "tenders",
    label: "Tenders",
    to: "/dashboard/tenders",
    description: "Manage tender notices and supporting documents.",
    roles: ["procurement_manager"],
    icon: "lucide:file-text",
  },
  {
    id: "media",
    label: "Media",
    to: "/dashboard/media",
    description: "Publish albums and media items.",
    roles: ["content_editor"],
    icon: "lucide:image",
  },
  {
    id: "team",
    label: "Team",
    to: "/dashboard/team",
    description: "Maintain leadership and board profiles.",
    roles: ["content_editor"],
    icon: "lucide:users",
  },
  {
    id: "pages",
    label: "Pages",
    to: "/dashboard/pages",
    description: "Edit legal pages and other static content.",
    roles: ["content_editor"],
    icon: "lucide:file-pen-line",
  },
  {
    id: "users",
    label: "Users",
    to: "/dashboard/users",
    description: "Invite staff and manage roles.",
    roles: ["super_admin"],
    icon: "lucide:shield-user",
  },
  {
    id: "settings",
    label: "Settings",
    to: "/dashboard/settings",
    description: "Update the hospital site settings singleton.",
    roles: ["super_admin"],
    icon: "lucide:settings-2",
  },
];

export function useDashboardSections() {
  return dashboardSections;
}

export interface DashboardSection {
  id: string;
  label: string;
  to: string;
  description: string;
  roles: import("~~/types/database.types").AppRole[];
  icon: string;
}

import { dashboardSections as sharedDashboardSections } from "~~/shared/dashboard-crud";

const dashboardSections: DashboardSection[] = sharedDashboardSections.map(
  ({ id, label, to, description, roles, icon }) => ({
    id,
    label,
    to,
    description,
    roles,
    icon,
  }),
);

export function useDashboardSections() {
  return dashboardSections;
}

import { vi } from "vitest";

const dashboardRouteMocks = vi.hoisted(() => ({
  requireAnyRole: vi.fn(),
  createStaffAccount: vi.fn(),
  updateStaffAccount: vi.fn(),
  deleteStaffAccount: vi.fn(),
  getMethod: vi.fn(),
  getQuery: vi.fn(),
  readBody: vi.fn(),
}));

vi.mock("~~/server/utils/require-role", () => ({
  requireAnyRole: dashboardRouteMocks.requireAnyRole,
}));

vi.mock("~~/server/utils/staff-accounts", () => ({
  createStaffAccount: dashboardRouteMocks.createStaffAccount,
  updateStaffAccount: dashboardRouteMocks.updateStaffAccount,
  deleteStaffAccount: dashboardRouteMocks.deleteStaffAccount,
}));

vi.mock("h3", async () => {
  const actual = await vi.importActual<typeof import("h3")>("h3");
  return {
    ...actual,
    getMethod: dashboardRouteMocks.getMethod,
    getQuery: dashboardRouteMocks.getQuery,
    readBody: dashboardRouteMocks.readBody,
  };
});

export { dashboardRouteMocks };

export async function loadDashboardResourceHandler() {
  return (await import("../../../../../server/api/dashboard/[resource]")).default;
}

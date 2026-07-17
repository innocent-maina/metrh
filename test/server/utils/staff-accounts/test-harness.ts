import { vi } from "vitest";

const staffAccountsMocks = vi.hoisted(() => ({
  supabaseAdmin: vi.fn(),
}));

vi.mock("~~/server/utils/supabase-admin", () => ({
  supabaseAdmin: staffAccountsMocks.supabaseAdmin,
}));

export { staffAccountsMocks };

export async function loadStaffAccountsModule() {
  return import("../../../../server/utils/staff-accounts");
}

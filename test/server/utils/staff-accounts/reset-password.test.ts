import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseAdminMock } from "../../../support/mocks";
import { loadStaffAccountsModule, staffAccountsMocks } from "./test-harness";

describe("server/utils/staff-accounts/reset-password", () => {
  let resetStaffPassword: Awaited<ReturnType<typeof loadStaffAccountsModule>>["resetStaffPassword"];

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await loadStaffAccountsModule();
    resetStaffPassword = mod.resetStaffPassword;
  });

  it("resets a staff password", async () => {
    const { adminClient } = createSupabaseAdminMock();
    staffAccountsMocks.supabaseAdmin.mockReturnValue(adminClient);

    const result = await resetStaffPassword("user-123");

    expect(result.tempPassword).toHaveLength(16);
    expect(adminClient.auth.admin.updateUserById).toHaveBeenCalledWith("user-123", {
      password: result.tempPassword,
    });
  });
});

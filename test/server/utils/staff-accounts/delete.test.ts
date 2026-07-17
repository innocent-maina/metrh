import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseAdminMock } from "../../../support/mocks";
import { loadStaffAccountsModule, staffAccountsMocks } from "./test-harness";

describe("server/utils/staff-accounts/delete", () => {
  let deleteStaffAccount: Awaited<ReturnType<typeof loadStaffAccountsModule>>["deleteStaffAccount"];

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await loadStaffAccountsModule();
    deleteStaffAccount = mod.deleteStaffAccount;
  });

  it("deletes the auth user", async () => {
    const { adminClient } = createSupabaseAdminMock();
    staffAccountsMocks.supabaseAdmin.mockReturnValue(adminClient);

    const result = await deleteStaffAccount("user-123");

    expect(result).toEqual({ ok: true });
    expect(adminClient.auth.admin.deleteUser).toHaveBeenCalledWith("user-123");
  });
});

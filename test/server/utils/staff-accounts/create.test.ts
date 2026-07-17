import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseAdminMock } from "../../../support/mocks";
import { loadStaffAccountsModule, staffAccountsMocks } from "./test-harness";

describe("server/utils/staff-accounts/create", () => {
  let createStaffAccount: Awaited<ReturnType<typeof loadStaffAccountsModule>>["createStaffAccount"];

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await loadStaffAccountsModule();
    createStaffAccount = mod.createStaffAccount;
  });

  it("creates a staff account and returns the temporary password", async () => {
    const { adminClient } = createSupabaseAdminMock({
      createdRow: {
        id: "user-123",
        full_name: "Ada Example",
        email: "ada@example.org",
        avatar_url: null,
        phone: null,
        job_title: "Nurse",
        roles: ["hr_manager"],
        is_active: true,
      },
    });

    staffAccountsMocks.supabaseAdmin.mockReturnValue(adminClient);

    const created = await createStaffAccount({
      full_name: "Ada Example",
      email: "ada@example.org",
      roles: ["hr_manager"],
      is_active: true,
    });

    expect(created.row.full_name).toBe("Ada Example");
    expect(created.tempPassword).toHaveLength(16);
    expect(adminClient.auth.admin.createUser).toHaveBeenCalledWith({
      email: "ada@example.org",
      password: created.tempPassword,
      email_confirm: true,
      user_metadata: { full_name: "Ada Example" },
    });
  });
});

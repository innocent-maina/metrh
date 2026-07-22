import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseAdminMock } from "../../../support/mocks";
import { loadStaffAccountsModule, staffAccountsMocks } from "./test-harness";

describe("server/utils/staff-accounts/update", () => {
  let updateStaffAccount: Awaited<ReturnType<typeof loadStaffAccountsModule>>["updateStaffAccount"];

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await loadStaffAccountsModule();
    updateStaffAccount = mod.updateStaffAccount;
  });

  it("updates a staff account and syncs auth state", async () => {
    const { adminClient } = createSupabaseAdminMock({
      existingRow: {
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

    const updated = await updateStaffAccount("user-123", {
      full_name: "Ada Updated",
      email: "ada.updated@example.org",
      roles: ["hr_manager", "content_editor"],
      is_active: false,
    });

    expect(updated.row.full_name).toBe("Ada Updated");
    expect(adminClient.auth.admin.updateUserById).toHaveBeenCalledWith("user-123", {
      email: "ada.updated@example.org",
      email_confirm: true,
      ban_duration: "876000h",
      user_metadata: { full_name: "Ada Updated", email: "ada.updated@example.org" },
    });
  });
});

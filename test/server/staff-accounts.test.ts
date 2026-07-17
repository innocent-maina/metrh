import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseAdminMock } from "../support/mocks";

const supabaseAdmin = vi.fn();

vi.mock("~~/server/utils/supabase-admin", () => ({
  supabaseAdmin,
}));

const staffAccountsPromise = import("../../server/utils/staff-accounts");

describe("server/utils/staff-accounts", () => {
  let createStaffAccount: Awaited<typeof staffAccountsPromise>["createStaffAccount"];
  let updateStaffAccount: Awaited<typeof staffAccountsPromise>["updateStaffAccount"];
  let deleteStaffAccount: Awaited<typeof staffAccountsPromise>["deleteStaffAccount"];
  let resetStaffPassword: Awaited<typeof staffAccountsPromise>["resetStaffPassword"];

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await staffAccountsPromise;
    createStaffAccount = mod.createStaffAccount;
    updateStaffAccount = mod.updateStaffAccount;
    deleteStaffAccount = mod.deleteStaffAccount;
    resetStaffPassword = mod.resetStaffPassword;
  });

  it("creates, updates, and deletes staff accounts", async () => {
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

    supabaseAdmin.mockReturnValue(adminClient);

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
      user_metadata: { full_name: "Ada Updated" },
    });

    const deleted = await deleteStaffAccount("user-123");
    expect(deleted).toEqual({ ok: true });
    expect(adminClient.auth.admin.deleteUser).toHaveBeenCalledWith("user-123");
  });

  it("resets a staff password", async () => {
    const { adminClient } = createSupabaseAdminMock();
    supabaseAdmin.mockReturnValue(adminClient);

    const result = await resetStaffPassword("user-123");

    expect(result.tempPassword).toHaveLength(16);
    expect(adminClient.auth.admin.updateUserById).toHaveBeenCalledWith("user-123", {
      password: result.tempPassword,
    });
  });
});

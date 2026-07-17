import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDashboardClientMock } from "../../../../../support/mocks";
import { dashboardRouteMocks, loadDashboardResourceHandler } from "../test-harness";

describe("server/api/dashboard/resource/team", () => {
  let handler: Awaited<ReturnType<typeof loadDashboardResourceHandler>>;

  beforeEach(async () => {
    vi.clearAllMocks();
    handler = await loadDashboardResourceHandler();
  });

  it("reads profiles", async () => {
    const { client, state } = createDashboardClientMock({
      rows: [{ id: "user-1", full_name: "Nurse One" }],
    });
    dashboardRouteMocks.requireAnyRole.mockResolvedValue({ client, userId: "user-123" });
    dashboardRouteMocks.getMethod.mockReturnValue("GET");
    dashboardRouteMocks.getQuery.mockReturnValue({});

    const result = await handler({
      context: { params: { resource: "profiles" } },
    } as never);

    expect(result).toEqual({ rows: [{ id: "user-1", full_name: "Nurse One" }] });
    expect(state.orderCalls).toEqual([["created_at", { ascending: false }]]);
  });

  it("delegates profile create, update, and delete to the staff helpers", async () => {
    const { client } = createDashboardClientMock();
    dashboardRouteMocks.requireAnyRole.mockResolvedValue({ client, userId: "user-123" });

    dashboardRouteMocks.createStaffAccount.mockResolvedValue({
      row: { id: "user-1", full_name: "Nurse One" },
      tempPassword: "temp-password",
    });
    dashboardRouteMocks.getMethod.mockReturnValue("POST");
    dashboardRouteMocks.readBody.mockResolvedValue({ data: { full_name: "Nurse One" } });

    const created = await handler({
      context: { params: { resource: "profiles" } },
    } as never);

    expect(created).toEqual({
      row: { id: "user-1", full_name: "Nurse One" },
      tempPassword: "temp-password",
    });
    expect(dashboardRouteMocks.createStaffAccount).toHaveBeenCalledWith({
      full_name: "Nurse One",
    });

    dashboardRouteMocks.updateStaffAccount.mockResolvedValue({
      row: { id: "user-1", full_name: "Nurse Updated" },
    });
    dashboardRouteMocks.getMethod.mockReturnValue("PATCH");
    dashboardRouteMocks.readBody.mockResolvedValue({
      id: "user-1",
      data: { full_name: "Nurse Updated" },
    });

    const updated = await handler({
      context: { params: { resource: "profiles" } },
    } as never);

    expect(updated).toEqual({
      row: { id: "user-1", full_name: "Nurse Updated" },
    });
    expect(dashboardRouteMocks.updateStaffAccount).toHaveBeenCalledWith("user-1", {
      full_name: "Nurse Updated",
    });

    dashboardRouteMocks.deleteStaffAccount.mockResolvedValue({ ok: true });
    dashboardRouteMocks.getMethod.mockReturnValue("DELETE");
    dashboardRouteMocks.readBody.mockResolvedValue({ id: "user-1" });

    const deleted = await handler({
      context: { params: { resource: "profiles" } },
    } as never);

    expect(deleted).toEqual({ ok: true });
    expect(dashboardRouteMocks.deleteStaffAccount).toHaveBeenCalledWith("user-1");
  });
});

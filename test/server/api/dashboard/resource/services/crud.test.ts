import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDashboardClientMock } from "../../../../../support/mocks";
import { dashboardRouteMocks, loadDashboardResourceHandler } from "../test-harness";

describe("server/api/dashboard/resource/services", () => {
  let handler: Awaited<ReturnType<typeof loadDashboardResourceHandler>>;

  beforeEach(async () => {
    vi.clearAllMocks();
    handler = await loadDashboardResourceHandler();
  });

  it.each([
    ["service_categories", [{ id: 1, name: "Radiology" }]],
    ["services", [{ id: 2, name: "X-ray" }]],
    ["clinic_schedule", [{ id: 3, clinic_name: "Outpatient" }]],
  ])("reads %s with its default sort", async (resourceId, rows) => {
    const { client, state } = createDashboardClientMock({ rows });
    dashboardRouteMocks.requireAnyRole.mockResolvedValue({ client, userId: "user-123" });
    dashboardRouteMocks.getMethod.mockReturnValue("GET");
    dashboardRouteMocks.getQuery.mockReturnValue({});

    const result = await handler({
      context: { params: { resource: resourceId } },
    } as never);

    expect(result).toEqual({ rows });
    expect(state.orderCalls.length).toBe(1);
  });

  it("creates, updates, and deletes service categories", async () => {
    const { client } = createDashboardClientMock({
      insertRow: { id: 1, name: "Radiology" },
      updateRow: { id: 1, name: "Radiology Updated" },
    });
    dashboardRouteMocks.requireAnyRole.mockResolvedValue({ client, userId: "user-123" });

    dashboardRouteMocks.getMethod.mockReturnValue("POST");
    dashboardRouteMocks.readBody.mockResolvedValue({
      data: { name: "Radiology", slug: "radiology" },
    });
    const created = await handler({
      context: { params: { resource: "service_categories" } },
    } as never);
    expect(created).toMatchObject({ row: { name: "Radiology" } });

    dashboardRouteMocks.getMethod.mockReturnValue("PATCH");
    dashboardRouteMocks.readBody.mockResolvedValue({
      id: 1,
      data: { name: "Radiology Updated" },
    });
    const updated = await handler({
      context: { params: { resource: "service_categories" } },
    } as never);
    expect(updated).toMatchObject({ row: { name: "Radiology Updated" } });

    dashboardRouteMocks.getMethod.mockReturnValue("DELETE");
    dashboardRouteMocks.readBody.mockResolvedValue({ id: 1 });
    const deleted = await handler({
      context: { params: { resource: "service_categories" } },
    } as never);
    expect(deleted).toEqual({ ok: true });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDashboardClientMock } from "../../../../../support/mocks";
import { dashboardRouteMocks, loadDashboardResourceHandler } from "../test-harness";

describe("server/api/dashboard/resource/careers", () => {
  let handler: Awaited<ReturnType<typeof loadDashboardResourceHandler>>;

  beforeEach(async () => {
    vi.clearAllMocks();
    handler = await loadDashboardResourceHandler();
  });

  it.each([
    ["job_postings", [{ id: 1, title: "Nurse" }]],
    ["job_applications", [{ id: 9, applicant_name: "Jane Doe" }]],
  ])("reads %s with the module sort order", async (resourceId, rows) => {
    const { client, builder, state } = createDashboardClientMock({ rows });
    dashboardRouteMocks.requireAnyRole.mockResolvedValue({ client, userId: "user-123" });
    dashboardRouteMocks.getMethod.mockReturnValue("GET");
    dashboardRouteMocks.getQuery.mockReturnValue({});

    const result = await handler({
      context: { params: { resource: resourceId } },
    } as never);

    expect(result).toEqual({ rows });
    expect(builder.select).toHaveBeenCalledWith("*");
    expect(state.orderCalls).toEqual([["created_at", { ascending: false }]]);
  });

  it("creates job postings with a created_by stamp", async () => {
    const { client } = createDashboardClientMock({
      insertRow: { id: 1, title: "Nurse", created_by: "user-123" },
    });
    dashboardRouteMocks.requireAnyRole.mockResolvedValue({ client, userId: "user-123" });
    dashboardRouteMocks.getMethod.mockReturnValue("POST");
    dashboardRouteMocks.readBody.mockResolvedValue({
      data: { title: "Nurse", slug: "nurse", description: "Role description" },
    });

    const result = await handler({
      context: { params: { resource: "job_postings" } },
    } as never);

    expect(result).toMatchObject({
      row: { title: "Nurse", slug: "nurse", created_by: "user-123" },
    });
  });

  it("updates and deletes careers records", async () => {
    const { client } = createDashboardClientMock({
      updateRow: { id: 1, title: "Senior Nurse" },
    });
    dashboardRouteMocks.requireAnyRole.mockResolvedValue({ client, userId: "user-123" });
    dashboardRouteMocks.getMethod.mockReturnValue("PATCH");
    dashboardRouteMocks.readBody.mockResolvedValue({
      id: 1,
      data: { title: "Senior Nurse" },
    });

    const updated = await handler({
      context: { params: { resource: "job_applications" } },
    } as never);

    expect(updated).toMatchObject({ row: { id: 1, title: "Senior Nurse" } });

    dashboardRouteMocks.getMethod.mockReturnValue("DELETE");
    dashboardRouteMocks.readBody.mockResolvedValue({
      id: 1,
    });

    const deleted = await handler({
      context: { params: { resource: "job_applications" } },
    } as never);

    expect(deleted).toEqual({ ok: true });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDashboardClientMock } from "../../../../../support/mocks";
import { dashboardRouteMocks, loadDashboardResourceHandler } from "../test-harness";

describe("server/api/dashboard/resource/tenders", () => {
  let handler: Awaited<ReturnType<typeof loadDashboardResourceHandler>>;

  beforeEach(async () => {
    vi.clearAllMocks();
    handler = await loadDashboardResourceHandler();
  });

  it.each([
    ["tenders", [{ id: 1, title: "Tender A" }]],
    ["downloads", [{ id: 2, title: "Procurement Pack" }]],
  ])("reads %s with the module sort order", async (resourceId, rows) => {
    const { client, state } = createDashboardClientMock({ rows });
    dashboardRouteMocks.requireAnyRole.mockResolvedValue({ client, userId: "user-123" });
    dashboardRouteMocks.getMethod.mockReturnValue("GET");
    dashboardRouteMocks.getQuery.mockReturnValue({});

    const result = await handler({
      context: { params: { resource: resourceId } },
    } as never);

    expect(result).toEqual({ rows });
    expect(state.orderCalls).toEqual([["created_at", { ascending: false }]]);
  });

  it("creates tender notices with a created_by stamp", async () => {
    const { client } = createDashboardClientMock({
      insertRow: { id: 1, title: "Tender A", created_by: "user-123" },
    });
    dashboardRouteMocks.requireAnyRole.mockResolvedValue({ client, userId: "user-123" });
    dashboardRouteMocks.getMethod.mockReturnValue("POST");
    dashboardRouteMocks.readBody.mockResolvedValue({
      data: {
        tender_number: "TN-001",
        title: "Tender A",
        slug: "tender-a",
        category: "goods",
      },
    });

    const result = await handler({
      context: { params: { resource: "tenders" } },
    } as never);

    expect(result).toMatchObject({
      row: { title: "Tender A", created_by: "user-123" },
    });
  });

  it("updates downloads, deletes attachments, and blocks tender deletes", async () => {
    const { client } = createDashboardClientMock({
      updateRow: { id: 2, title: "Procurement Pack v2" },
    });
    dashboardRouteMocks.requireAnyRole.mockResolvedValue({ client, userId: "user-123" });
    dashboardRouteMocks.getMethod.mockReturnValue("PATCH");
    dashboardRouteMocks.readBody.mockResolvedValue({
      id: 2,
      data: { title: "Procurement Pack v2" },
    });

    const updated = await handler({
      context: { params: { resource: "downloads" } },
    } as never);

    expect(updated).toMatchObject({ row: { id: 2, title: "Procurement Pack v2" } });

    dashboardRouteMocks.getMethod.mockReturnValue("DELETE");
    dashboardRouteMocks.readBody.mockResolvedValue({ id: 2 });
    const deletedDownload = await handler({
      context: { params: { resource: "downloads" } },
    } as never);
    expect(deletedDownload).toEqual({ ok: true });

    dashboardRouteMocks.getMethod.mockReturnValue("DELETE");
    dashboardRouteMocks.readBody.mockResolvedValue({ id: 1 });

    await expect(
      handler({
        context: { params: { resource: "tenders" } },
      } as never),
    ).rejects.toMatchObject({
      statusCode: 405,
      statusMessage: "This resource cannot be deleted from the dashboard.",
    });
  });
});

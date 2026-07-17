import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDashboardClientMock } from "../../../../../support/mocks";
import { dashboardRouteMocks, loadDashboardResourceHandler } from "../test-harness";

describe("server/api/dashboard/resource/contact", () => {
  let handler: Awaited<ReturnType<typeof loadDashboardResourceHandler>>;

  beforeEach(async () => {
    vi.clearAllMocks();
    handler = await loadDashboardResourceHandler();
  });

  it("reads contact submissions in newest-first order", async () => {
    const { client, state } = createDashboardClientMock({
      rows: [{ id: 1, subject: "Need appointment" }],
    });
    dashboardRouteMocks.requireAnyRole.mockResolvedValue({ client, userId: "user-123" });
    dashboardRouteMocks.getMethod.mockReturnValue("GET");
    dashboardRouteMocks.getQuery.mockReturnValue({});

    const result = await handler({
      context: { params: { resource: "contact_submissions" } },
    } as never);

    expect(result).toEqual({ rows: [{ id: 1, subject: "Need appointment" }] });
    expect(state.orderCalls).toEqual([["created_at", { ascending: false }]]);
  });

  it("creates, updates, and deletes contact submissions", async () => {
    const { client, state } = createDashboardClientMock({
      insertRow: { id: 1, subject: "Need appointment" },
      updateRow: { id: 1, subject: "Need appointment", handled_by: "user-123" },
    });
    dashboardRouteMocks.requireAnyRole.mockResolvedValue({ client, userId: "user-123" });

    dashboardRouteMocks.getMethod.mockReturnValue("POST");
    dashboardRouteMocks.readBody.mockResolvedValue({
      data: {
        name: "Ada",
        email: "ada@example.org",
        subject: "Need appointment",
        message: "Please call me back",
      },
    });
    const created = await handler({
      context: { params: { resource: "contact_submissions" } },
    } as never);
    expect(created).toMatchObject({ row: { subject: "Need appointment" } });

    dashboardRouteMocks.getMethod.mockReturnValue("PATCH");
    dashboardRouteMocks.readBody.mockResolvedValue({
      id: 1,
      data: { status: "read" },
    });
    const updated = await handler({
      context: { params: { resource: "contact_submissions" } },
    } as never);
    expect(updated).toMatchObject({
      row: { id: 1, subject: "Need appointment", handled_by: "user-123" },
    });
    expect(state.updates).toMatchObject({ status: "read", handled_by: "user-123" });

    dashboardRouteMocks.getMethod.mockReturnValue("DELETE");
    dashboardRouteMocks.readBody.mockResolvedValue({ id: 1 });
    const deleted = await handler({
      context: { params: { resource: "contact_submissions" } },
    } as never);
    expect(deleted).toEqual({ ok: true });
  });
});

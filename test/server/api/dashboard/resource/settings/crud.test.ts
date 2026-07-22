import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDashboardClientMock } from "../../../../../support/mocks";
import { dashboardRouteMocks, loadDashboardResourceHandler } from "../test-harness";

describe("server/api/dashboard/resource/settings", () => {
  let handler: Awaited<ReturnType<typeof loadDashboardResourceHandler>>;

  beforeEach(async () => {
    vi.clearAllMocks();
    handler = await loadDashboardResourceHandler();
  });

  it("reads the singleton site settings row with a limit of one", async () => {
    const { client, state } = createDashboardClientMock({
      rows: [{ id: true, emergency_line: "999" }],
    });
    dashboardRouteMocks.requireAnyRole.mockResolvedValue({ client, userId: "user-123" });
    dashboardRouteMocks.getMethod.mockReturnValue("GET");
    dashboardRouteMocks.getQuery.mockReturnValue({});

    const result = await handler({
      context: { params: { resource: "site_settings" } },
    } as never);

    expect(result).toEqual({ rows: [{ id: true, emergency_line: "999" }] });
    expect(state.orderCalls).toEqual([["updated_at", { ascending: false }]]);
    expect(state.limitCalls).toEqual([[1]]);
  });

  it("updates the singleton row and stamps updated_by", async () => {
    const { client, state } = createDashboardClientMock({
      updateRow: {
        id: "site-settings",
        main_phone: "123456789",
        updated_by: "user-123",
      },
    });
    dashboardRouteMocks.requireAnyRole.mockResolvedValue({ client, userId: "user-123" });
    dashboardRouteMocks.getMethod.mockReturnValue("PATCH");
    dashboardRouteMocks.readBody.mockResolvedValue({
      id: "site-settings",
      data: {
        main_phone: "123456789",
        whatsapp_label: "WhatsApp",
      },
    });

    const result = await handler({
      context: { params: { resource: "site_settings" } },
    } as never);

    expect(result).toMatchObject({
      row: {
        id: "site-settings",
        main_phone: "123456789",
        updated_by: "user-123",
      },
    });
    expect(state.matches).toEqual({ id: "site-settings" });
    expect(state.updates).toEqual({
      main_phone: "123456789",
      whatsapp_label: "WhatsApp",
      updated_by: "user-123",
    });
  });

  it("blocks create and delete on the singleton resource", async () => {
    dashboardRouteMocks.getMethod.mockReturnValue("POST");
    await expect(
      handler({
        context: { params: { resource: "site_settings" } },
      } as never),
    ).rejects.toMatchObject({
      statusCode: 405,
      statusMessage: "This resource cannot be created from the dashboard.",
    });

    dashboardRouteMocks.getMethod.mockReturnValue("DELETE");
    await expect(
      handler({
        context: { params: { resource: "site_settings" } },
      } as never),
    ).rejects.toMatchObject({
      statusCode: 405,
      statusMessage: "This resource cannot be deleted from the dashboard.",
    });
  });
});

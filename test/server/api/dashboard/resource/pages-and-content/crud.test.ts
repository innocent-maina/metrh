import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDashboardClientMock } from "../../../../../support/mocks";
import { dashboardRouteMocks, loadDashboardResourceHandler } from "../test-harness";

describe("server/api/dashboard/resource/pages-and-content", () => {
  let handler: Awaited<ReturnType<typeof loadDashboardResourceHandler>>;

  beforeEach(async () => {
    vi.clearAllMocks();
    handler = await loadDashboardResourceHandler();
  });

  it.each([
    ["pages", [{ id: 1, slug: "home", title: "Home" }]],
    ["page_sections", [{ id: 2, title: "Hero" }]],
    ["page_slides", [{ id: 3, title: "Welcome" }]],
    ["site_settings_editor", [{ id: 4, emergency_line: "999" }]],
  ])("reads %s records", async (resourceId, rows) => {
    const { client, state } = createDashboardClientMock({ rows });
    dashboardRouteMocks.requireAnyRole.mockResolvedValue({ client, userId: "user-123" });
    dashboardRouteMocks.getMethod.mockReturnValue("GET");
    dashboardRouteMocks.getQuery.mockReturnValue({});

    const result = await handler({
      context: { params: { resource: resourceId } },
    } as never);

    expect(result).toEqual({ rows: resourceId === "site_settings_editor" ? rows.slice(0, 1) : rows });
    expect(state.orderCalls.length).toBe(1);
  });

  it("creates, updates, deletes normal records, and blocks singleton deletes", async () => {
    const { client } = createDashboardClientMock({
      insertRow: { id: 2, title: "Hero Section" },
      updateRow: { id: 1, title: "Home Updated" },
    });
    dashboardRouteMocks.requireAnyRole.mockResolvedValue({ client, userId: "user-123" });

    dashboardRouteMocks.getMethod.mockReturnValue("POST");
    dashboardRouteMocks.readBody.mockResolvedValue({
      data: {
        page_slug: "home",
        section_key: "hero",
        section_type: "hero",
        title: "Hero Section",
      },
    });
    const created = await handler({
      context: { params: { resource: "page_sections" } },
    } as never);
    expect(created).toMatchObject({ row: { title: "Hero Section" } });

    dashboardRouteMocks.getMethod.mockReturnValue("PATCH");
    dashboardRouteMocks.readBody.mockResolvedValue({
      id: 1,
      data: { title: "Home Updated" },
    });
    const updated = await handler({
      context: { params: { resource: "pages" } },
    } as never);
    expect(updated).toMatchObject({ row: { title: "Home Updated" } });

    dashboardRouteMocks.getMethod.mockReturnValue("DELETE");
    dashboardRouteMocks.readBody.mockResolvedValue({ id: 2 });
    const deletedSection = await handler({
      context: { params: { resource: "page_sections" } },
    } as never);
    expect(deletedSection).toEqual({ ok: true });

    dashboardRouteMocks.getMethod.mockReturnValue("DELETE");
    dashboardRouteMocks.readBody.mockResolvedValue({ id: 1 });
    await expect(
      handler({
        context: { params: { resource: "site_settings_editor" } },
      } as never),
    ).rejects.toMatchObject({
      statusCode: 405,
      statusMessage: "This resource cannot be deleted from the dashboard.",
    });
  });
});

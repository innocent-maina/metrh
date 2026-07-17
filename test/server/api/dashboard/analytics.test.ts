import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDashboardClientMock } from "../../../support/mocks";

const analyticsRouteMocks = vi.hoisted(() => ({
  requireAnyRole: vi.fn(),
  supabaseAdmin: vi.fn(),
}));

vi.mock("~~/server/utils/require-role", () => ({
  requireAnyRole: analyticsRouteMocks.requireAnyRole,
}));

vi.mock("~~/server/utils/supabase-admin", () => ({
  supabaseAdmin: analyticsRouteMocks.supabaseAdmin,
}));

async function loadAnalyticsHandler() {
  return (await import("../../../../server/api/dashboard/analytics.get")).default;
}

describe("server/api/dashboard/analytics", () => {
  let handler: Awaited<ReturnType<typeof loadAnalyticsHandler>>;

  beforeEach(async () => {
    vi.clearAllMocks();
    handler = await loadAnalyticsHandler();
  });

  it("returns chart-friendly analytics aggregates", async () => {
    const { client, builder, state } = createDashboardClientMock({
      rows: [
        {
          created_at: "2026-07-10T10:00:00.000Z",
          path: "/services",
          page_title: null,
          referrer: null,
          session_id: "session-a",
          viewport_width: 390,
          screen_width: 390,
        },
        {
          created_at: "2026-07-10T12:00:00.000Z",
          path: "/services",
          page_title: null,
          referrer: "https://www.google.com/search?q=metrh",
          session_id: "session-b",
          viewport_width: 1400,
          screen_width: 1400,
        },
        {
          created_at: "2026-07-11T09:00:00.000Z",
          path: "/contact",
          page_title: "Contact Us",
          referrer: null,
          session_id: "session-a",
          viewport_width: 800,
          screen_width: 800,
        },
        {
          created_at: "2026-07-11T10:00:00.000Z",
          path: "/contact",
          page_title: "Contact Us",
          referrer: "https://www.metrh.or.ke/about",
          session_id: "session-c",
          viewport_width: 1024,
          screen_width: 1024,
        },
        {
          created_at: "2026-07-12T09:00:00.000Z",
          path: "/blog/post-1",
          page_title: "Community Update",
          referrer: "https://www.google.com/search?q=metrh",
          session_id: "session-d",
          viewport_width: 375,
          screen_width: 375,
        },
      ],
    });

    analyticsRouteMocks.requireAnyRole.mockResolvedValue({
      client,
      userId: "user-123",
    });
    analyticsRouteMocks.supabaseAdmin.mockReturnValue(client);

    const result = await handler({} as never);

    expect(state.table).toBe("page_pulses");
    expect(builder.gte).toHaveBeenCalledWith(
      "created_at",
      expect.stringMatching(/T00:00:00\.000Z$/),
    );
    expect(result.totals.pulses).toBe(5);
    expect(result.totals.sessions).toBe(4);
    expect(result.totals.uniquePaths).toBe(3);
    expect(result.totals.peakDay?.count).toBe(2);
    expect(result.topPages[0]).toMatchObject({
      label: "/services",
      count: 2,
    });
    expect(result.devices).toEqual([
      { label: "Mobile", count: 2, percent: 40 },
      { label: "Tablet", count: 2, percent: 40 },
      { label: "Desktop", count: 1, percent: 20 },
      { label: "Unknown", count: 0, percent: 0 },
    ]);
    expect(result.referrers.map((entry) => entry.label)).toContain("Google");
    expect(result.referrers.map((entry) => entry.label)).toContain("Direct");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDashboardClientMock } from "../../../../../support/mocks";
import { dashboardRouteMocks, loadDashboardResourceHandler } from "../test-harness";

describe("server/api/dashboard/resource/blog", () => {
  let handler: Awaited<ReturnType<typeof loadDashboardResourceHandler>>;

  beforeEach(async () => {
    vi.clearAllMocks();
    handler = await loadDashboardResourceHandler();
  });

  it("reads post-tag junction rows with composite-key ordering", async () => {
    const { client, state } = createDashboardClientMock({
      rows: [{ post_id: "post-1", tag_id: "tag-1" }],
    });
    dashboardRouteMocks.requireAnyRole.mockResolvedValue({ client, userId: "user-123" });
    dashboardRouteMocks.getMethod.mockReturnValue("GET");
    dashboardRouteMocks.getQuery.mockReturnValue({});

    const result = await handler({
      context: { params: { resource: "blog_post_tags" } },
    } as never);

    expect(result).toEqual({
      rows: [{ post_id: "post-1", tag_id: "tag-1" }],
    });
    expect(state.orderCalls).toEqual([["post_id", { ascending: true }]]);
  });

  it("creates a post-tag relation row", async () => {
    const { client, state } = createDashboardClientMock({
      insertRow: { post_id: "post-1", tag_id: "tag-1" },
    });
    dashboardRouteMocks.requireAnyRole.mockResolvedValue({ client, userId: "user-123" });
    dashboardRouteMocks.getMethod.mockReturnValue("POST");
    dashboardRouteMocks.readBody.mockResolvedValue({
      data: { post_id: "post-1", tag_id: "tag-1" },
    });

    const result = await handler({
      context: { params: { resource: "blog_post_tags" } },
    } as never);

    expect(result).toEqual({
      row: { post_id: "post-1", tag_id: "tag-1" },
    });
    expect(state.ins).toEqual({ post_id: "post-1", tag_id: "tag-1" });
  });

  it("updates and deletes a post-tag relation using the composite identifier", async () => {
    const { client, state } = createDashboardClientMock({
      updateRow: { post_id: "post-1", tag_id: "tag-2" },
    });
    dashboardRouteMocks.requireAnyRole.mockResolvedValue({ client, userId: "user-123" });

    dashboardRouteMocks.getMethod.mockReturnValue("PATCH");
    dashboardRouteMocks.readBody.mockResolvedValue({
      identifier: { post_id: "post-1", tag_id: "tag-1" },
      data: { tag_id: "tag-2" },
    });

    const updated = await handler({
      context: { params: { resource: "blog_post_tags" } },
    } as never);

    expect(updated).toEqual({
      row: { post_id: "post-1", tag_id: "tag-2" },
    });
    expect(state.matches).toEqual({ post_id: "post-1", tag_id: "tag-1" });
    expect(state.updates).toEqual({ tag_id: "tag-2" });

    dashboardRouteMocks.getMethod.mockReturnValue("DELETE");
    dashboardRouteMocks.readBody.mockResolvedValue({
      identifier: { post_id: "post-1", tag_id: "tag-1" },
    });

    const deleted = await handler({
      context: { params: { resource: "blog_post_tags" } },
    } as never);

    expect(deleted).toEqual({ ok: true });
    expect(state.matches).toEqual({ post_id: "post-1", tag_id: "tag-1" });
  });
});

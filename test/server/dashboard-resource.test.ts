import { createError } from "h3";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDashboardClientMock } from "../support/mocks";

const hoisted = vi.hoisted(() => ({
  requireAnyRole: vi.fn(),
  createStaffAccount: vi.fn(),
  updateStaffAccount: vi.fn(),
  deleteStaffAccount: vi.fn(),
  getMethod: vi.fn(),
  getQuery: vi.fn(),
  readBody: vi.fn(),
}));

vi.mock("~~/server/utils/require-role", () => ({
  requireAnyRole: hoisted.requireAnyRole,
}));

vi.mock("~~/server/utils/staff-accounts", () => ({
  createStaffAccount: hoisted.createStaffAccount,
  updateStaffAccount: hoisted.updateStaffAccount,
  deleteStaffAccount: hoisted.deleteStaffAccount,
}));

vi.mock("h3", async () => {
  const actual = await vi.importActual<typeof import("h3")>("h3");
  return {
    ...actual,
    getMethod: hoisted.getMethod,
    getQuery: hoisted.getQuery,
    readBody: hoisted.readBody,
  };
});

(globalThis as typeof globalThis & {
  defineEventHandler?: (handler: unknown) => unknown;
}).defineEventHandler = (handler) => handler;

const handlerPromise = import("../../server/api/dashboard/[resource]");

describe("server/api/dashboard/[resource]", () => {
  let handler: Awaited<typeof handlerPromise>["default"];

  beforeEach(async () => {
    vi.clearAllMocks();
    handler = (await handlerPromise).default;
  });

  it("reads dashboard rows and counts with filters", async () => {
    const { client, builder, state } = createDashboardClientMock({
      rows: [{ id: 1, name: "Radiology" }],
      count: 2,
    });
    hoisted.requireAnyRole.mockResolvedValue({ client, userId: "user-123" });
    hoisted.getMethod.mockReturnValue("GET");

    hoisted.getQuery.mockReturnValue({
      filters: JSON.stringify({
        category: ["general", "special"],
        active: "true",
        order: "4",
        note: "",
      }),
    });

    const rowsResult = await handler({
      context: { params: { resource: "service_categories" } },
    } as never);

    expect(rowsResult).toEqual({ rows: [{ id: 1, name: "Radiology" }] });
    expect(builder.select).toHaveBeenCalledWith("*");
    expect(state.orderCalls).toEqual([["display_order", { ascending: true }]]);
    expect(state.inCalls).toEqual([["category", ["general", "special"]]]);
    expect(state.eqs).toEqual([
      ["active", true],
      ["order", 4],
    ]);

    const countClient = createDashboardClientMock({ count: 2 });
    hoisted.requireAnyRole.mockResolvedValue({ client: countClient.client, userId: "user-123" });
    hoisted.getQuery.mockReturnValue({
      count: "true",
      filters: JSON.stringify({ active: "false" }),
    });

    const countResult = await handler({
      context: { params: { resource: "service_categories" } },
    } as never);

    expect(countResult).toEqual({ count: 2 });
    expect(countClient.builder.select).toHaveBeenCalledWith("id", {
      count: "exact",
      head: true,
    });
    expect(countClient.state.eqs).toEqual([["active", false]]);
  });

  it("creates, updates, and deletes generic dashboard rows", async () => {
    const { client } = createDashboardClientMock({
      insertRow: { id: 11, name: "Emergency" },
      updateRow: { id: 11, name: "Emergency updated" },
    });
    hoisted.requireAnyRole.mockResolvedValue({ client, userId: "user-123" });

    hoisted.getMethod.mockReturnValue("POST");
    hoisted.readBody.mockResolvedValue({
      data: { name: "Emergency", slug: "emergency", description: undefined },
    });

    const createResult = await handler({
      context: { params: { resource: "service_categories" } },
    } as never);

    expect(createResult).toMatchObject({
      row: { id: 11, name: "Emergency", slug: "emergency" },
    });
    expect(client.from).toHaveBeenCalledWith("service_categories");

    hoisted.getMethod.mockReturnValue("PATCH");
    hoisted.readBody.mockResolvedValue({
      id: 11,
      data: { name: "Emergency updated", slug: "emergency-updated" },
    });

    const updateResult = await handler({
      context: { params: { resource: "service_categories" } },
    } as never);

    expect(updateResult).toMatchObject({
      row: { id: 11, name: "Emergency updated", slug: "emergency-updated" },
    });

    hoisted.getMethod.mockReturnValue("DELETE");
    hoisted.readBody.mockResolvedValue({
      id: 11,
    });

    const deleteResult = await handler({
      context: { params: { resource: "service_categories" } },
    } as never);

    expect(deleteResult).toEqual({ ok: true });
  });

  it("returns method errors for resources that disable create or delete", async () => {
    hoisted.getMethod.mockReturnValue("POST");

    await expect(
      handler({
        context: { params: { resource: "site_settings" } },
      } as never),
    ).rejects.toMatchObject({
      statusCode: 405,
      statusMessage: "This resource cannot be created from the dashboard.",
    });

    hoisted.getMethod.mockReturnValue("DELETE");

    await expect(
      handler({
        context: { params: { resource: "site_settings" } },
      } as never),
    ).rejects.toMatchObject({
      statusCode: 405,
      statusMessage: "This resource cannot be deleted from the dashboard.",
    });
  });

  it("delegates profile CRUD to the staff account helpers", async () => {
    const { client } = createDashboardClientMock();
    hoisted.requireAnyRole.mockResolvedValue({ client, userId: "user-123" });

    hoisted.createStaffAccount.mockResolvedValue({
      row: { id: "user-1", full_name: "Nurse One" },
      tempPassword: "temp-password",
    });

    hoisted.getMethod.mockReturnValue("POST");
    hoisted.readBody.mockResolvedValue({ data: { full_name: "Nurse One" } });

    const createResult = await handler({
      context: { params: { resource: "profiles" } },
    } as never);

    expect(hoisted.createStaffAccount).toHaveBeenCalledWith({ full_name: "Nurse One" });
    expect(createResult).toEqual({
      row: { id: "user-1", full_name: "Nurse One" },
      tempPassword: "temp-password",
    });

    hoisted.updateStaffAccount.mockResolvedValue({
      row: { id: "user-1", full_name: "Nurse Updated" },
    });

    hoisted.getMethod.mockReturnValue("PATCH");
    hoisted.readBody.mockResolvedValue({
      id: "user-1",
      data: { full_name: "Nurse Updated" },
    });

    const updateResult = await handler({
      context: { params: { resource: "profiles" } },
    } as never);

    expect(hoisted.updateStaffAccount).toHaveBeenCalledWith("user-1", {
      full_name: "Nurse Updated",
    });
    expect(updateResult).toEqual({
      row: { id: "user-1", full_name: "Nurse Updated" },
    });

    hoisted.deleteStaffAccount.mockResolvedValue({ ok: true });

    hoisted.getMethod.mockReturnValue("DELETE");
    hoisted.readBody.mockResolvedValue({
      id: "user-1",
    });

    const deleteResult = await handler({
      context: { params: { resource: "profiles" } },
    } as never);

    expect(hoisted.deleteStaffAccount).toHaveBeenCalledWith("user-1");
    expect(deleteResult).toEqual({ ok: true });
  });
});

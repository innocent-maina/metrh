import { beforeEach, describe, expect, it, vi } from "vitest";

const serviceRouteMocks = vi.hoisted(() => ({
  supabaseAdmin: vi.fn(),
}));

vi.mock("~~/server/utils/supabase-admin", () => ({
  supabaseAdmin: serviceRouteMocks.supabaseAdmin,
}));

type ServiceRow = {
  id: string;
  category_id: string;
  slug: string;
  is_active: boolean;
  [key: string]: unknown;
};

type CategoryRow = {
  id: string;
  slug: string;
  [key: string]: unknown;
};

function createQueryMock(options: {
  table: "services" | "service_categories";
  serviceRows: ServiceRow[];
  categoryRows: CategoryRow[];
}) {
  const state = {
    conditions: [] as Array<{ method: "eq"; field: string; value: unknown }>,
  };

  const query: Record<string, unknown> = {};

  const rowsForTable = () => {
    const rows =
      options.table === "services" ? options.serviceRows : options.categoryRows;

    return rows.filter((row) =>
      state.conditions.every(
        (condition) => String(row[condition.field]) === String(condition.value),
      ),
    );
  };

  const resolve = async (single: boolean) => {
    const rows = rowsForTable();

    if (single) {
      return { data: rows[0] ?? null, error: null };
    }

    return { data: rows, error: null };
  };

  Object.assign(query, {
    select: vi.fn(() => query),
    eq: vi.fn((field: string, value: unknown) => {
      state.conditions.push({ method: "eq", field, value });
      return query;
    }),
    order: vi.fn(() => query),
    limit: vi.fn(() => query),
    maybeSingle: vi.fn(() => resolve(true)),
    then: (
      onFulfilled: (value: unknown) => unknown,
      onRejected: (reason: unknown) => unknown,
    ) => Promise.resolve(resolve(false)).then(onFulfilled, onRejected),
  });

  return query as never;
}

describe("server/api/public/services/[slug]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("finds a service even when the stored slug has trailing whitespace", async () => {
    const serviceRows: ServiceRow[] = [
      {
        id: "service-1",
        category_id: "category-1",
        slug: "CT-Scans ",
        is_active: true,
        name: "CT Scans",
      },
      {
        id: "service-2",
        category_id: "category-1",
        slug: "mri-imaging",
        is_active: true,
        name: "MRI Imaging",
      },
    ];
    const categoryRows: CategoryRow[] = [
      { id: "category-1", slug: "imaging-diagnostics", name: "Imaging & Diagnostics" },
    ];

    const from = vi.fn((table: "services" | "service_categories") =>
      createQueryMock({
        table,
        serviceRows,
        categoryRows,
      }),
    );

    serviceRouteMocks.supabaseAdmin.mockReturnValue({ from });

    const handler = (await import("../../../../server/api/public/services/[slug].get"))
      .default;

    const result = await handler({
      context: { params: { slug: "ct-scans" } },
    } as never);

    expect(result.service).toMatchObject({
      id: "service-1",
      slug: "CT-Scans ",
      name: "CT Scans",
    });
    expect(result.category).toMatchObject({
      id: "category-1",
      name: "Imaging & Diagnostics",
    });
    expect(result.relatedServices).toHaveLength(2);
    expect(from).toHaveBeenCalledTimes(4);
  });
});

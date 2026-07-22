import { beforeEach, describe, expect, it, vi } from "vitest";

const tenderRouteMocks = vi.hoisted(() => ({
  supabaseAdmin: vi.fn(),
}));

vi.mock("~~/server/utils/supabase-admin", () => ({
  supabaseAdmin: tenderRouteMocks.supabaseAdmin,
}));

type TenderRow = {
  id: string;
  slug: string;
  status: "draft" | "open" | "closed" | "awarded" | "cancelled";
  [key: string]: unknown;
};

type TenderDocumentRow = {
  id: string;
  tender_id: string;
  [key: string]: unknown;
};

function createQueryMock<T extends Record<string, unknown>>(options: {
  table: "tenders" | "tender_documents";
  tenderRows: TenderRow[];
  documentRows: TenderDocumentRow[];
}) {
  const state = {
    conditions: [] as Array<{ method: "eq" | "neq"; field: string; value: unknown }>,
  };

  const query: Record<string, unknown> = {};

  const resolve = async (single: boolean) => {
    if (options.table === "tenders") {
      const slugCondition = state.conditions.find(
        (condition) => condition.method === "eq" && condition.field === "slug",
      );

      const rows = options.tenderRows.filter((row) =>
        state.conditions.every((condition) => {
          if (condition.method === "eq") {
            return String(row[condition.field]) === String(condition.value);
          }

          return String(row[condition.field]) !== String(condition.value);
        }),
      );

      if (single) {
        return {
          data:
            rows.find((row) => row.slug === String(slugCondition?.value ?? "")) ?? null,
          error: null,
        };
      }

      return { data: rows, error: null };
    }

    const tenderIdCondition = state.conditions.find(
      (condition) => condition.method === "eq" && condition.field === "tender_id",
    );

    return {
      data: options.documentRows.filter(
        (row) => row.tender_id === String(tenderIdCondition?.value ?? ""),
      ),
      error: null,
    };
  };

  Object.assign(query, {
    select: vi.fn(() => query),
    eq: vi.fn((field: string, value: unknown) => {
      state.conditions.push({ method: "eq", field, value });
      return query;
    }),
    neq: vi.fn((field: string, value: unknown) => {
      state.conditions.push({ method: "neq", field, value });
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

describe("server/api/public/tenders/[slug]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("finds a tender even when the stored slug has trailing whitespace", async () => {
    const tenderRows: TenderRow[] = [
      {
        id: "tender-1",
        slug: "Pre-Qualified-Suppliers ",
        status: "open",
        tender_number: "FY 2024/2025-2026",
        title: "Pre-Qualified Suppliers",
      },
    ];
    const documentRows: TenderDocumentRow[] = [
      { id: "doc-1", tender_id: "tender-1" },
    ];

    const from = vi.fn((table: "tenders" | "tender_documents") =>
      createQueryMock({
        table,
        tenderRows,
        documentRows,
      }),
    );

    tenderRouteMocks.supabaseAdmin.mockReturnValue({ from });

    const handler = (await import("../../../../server/api/public/tenders/[slug].get"))
      .default;

    const result = await handler({
      context: { params: { slug: "Pre-Qualified-Suppliers" } },
    } as never);

    expect(result.tender).toMatchObject({
      id: "tender-1",
      slug: "Pre-Qualified-Suppliers ",
      title: "Pre-Qualified Suppliers",
    });
    expect(result.documents).toHaveLength(1);
    expect(from).toHaveBeenCalledTimes(4);
  });
});

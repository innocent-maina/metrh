import { vi } from "vitest";

export function createDashboardClientMock(options?: {
  rows?: unknown[];
  count?: number;
  insertRow?: unknown;
  updateRow?: unknown;
  deleteError?: { message?: string } | null;
  readError?: { message?: string } | null;
  writeError?: { message?: string } | null;
}) {
  const state: Record<string, unknown> = {
    table: "",
    selects: [] as unknown[][],
    eqs: [] as unknown[][],
    ins: null as unknown,
    updates: null as unknown,
    matches: null as unknown,
    inCalls: [] as unknown[][],
    orderCalls: [] as unknown[][],
    limitCalls: [] as unknown[][],
    deleteCalled: false,
  };

  const readResponse = {
    data: options?.rows ?? [],
    count: options?.count ?? null,
    error: options?.readError ?? null,
  };
  const writeResponse = {
    data: options?.insertRow ?? options?.updateRow ?? null,
    error: options?.writeError ?? null,
  };
  const deleteResponse = {
    error: options?.deleteError ?? null,
  };

  const builder: any = {
    select: vi.fn((...args: unknown[]) => {
      state.selects.push(args);
      return builder;
    }),
    eq: vi.fn((...args: unknown[]) => {
      state.eqs.push(args);
      return builder;
    }),
    in: vi.fn((...args: unknown[]) => {
      state.inCalls.push(args);
      return builder;
    }),
    order: vi.fn((...args: unknown[]) => {
      state.orderCalls.push(args);
      return builder;
    }),
    limit: vi.fn((...args: unknown[]) => {
      state.limitCalls.push(args);
      return builder;
    }),
    insert: vi.fn((payload: unknown) => {
      state.ins = payload;
      writeResponse.data = {
        ...(options?.insertRow as Record<string, unknown> | null ?? {}),
        ...(payload as Record<string, unknown>),
      };
      return builder;
    }),
    update: vi.fn((payload: unknown) => {
      state.updates = payload;
      writeResponse.data = {
        ...(options?.updateRow as Record<string, unknown> | null ?? {}),
        ...(payload as Record<string, unknown>),
      };
      return builder;
    }),
    delete: vi.fn(() => {
      state.deleteCalled = true;
      return builder;
    }),
    match: vi.fn((identifier: unknown) => {
      state.matches = identifier;
      return builder;
    }),
    maybeSingle: vi.fn(async () => writeResponse),
    then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => {
      return Promise.resolve(readResponse).then(resolve, reject);
    },
  };

  const client = {
    from: vi.fn((table: string) => {
      state.table = table;
      return builder;
    }),
  };

  return { client, builder, state, readResponse, writeResponse, deleteResponse };
}

export function createSupabaseAdminMock(options?: {
  existingRow?: Record<string, unknown> | null;
  createdRow?: Record<string, unknown> | null;
}) {
  const state: Record<string, unknown> = {
    readCalls: [] as unknown[][],
    updateCalls: [] as unknown[][],
    deleteCalls: [] as unknown[][],
    createCalls: [] as unknown[][],
    insertPayload: null as unknown,
  };

  let operation: "read" | "insert" | "update" | null = null;

  const readResponse = {
    data: options?.existingRow ?? null,
    error: null,
  };
  const writeResponse = {
    data: options?.createdRow ?? options?.existingRow ?? null,
    error: null,
  };

  const profilesBuilder: any = {
    select: vi.fn((...args: unknown[]) => {
      state.readCalls.push(args);
      if (operation == null) {
        operation = "read";
      }
      return profilesBuilder;
    }),
    eq: vi.fn((...args: unknown[]) => {
      state.readCalls.push(args);
      return profilesBuilder;
    }),
    insert: vi.fn((payload: unknown) => {
      state.insertPayload = payload;
      writeResponse.data = {
        id: "user-123",
        ...(payload as Record<string, unknown>),
      };
      operation = "insert";
      return profilesBuilder;
    }),
    update: vi.fn((payload: unknown) => {
      state.updateCalls.push([payload]);
      writeResponse.data = {
        ...(options?.existingRow ?? {}),
        ...(payload as Record<string, unknown>),
      };
      operation = "update";
      return profilesBuilder;
    }),
    maybeSingle: vi.fn(async () => {
      return operation === "read" ? readResponse : writeResponse;
    }),
  };

  const adminClient = {
    auth: {
      admin: {
        createUser: vi.fn(async (...args: unknown[]) => {
          state.createCalls.push(args);
          return {
            data: { user: { id: "user-123" } },
            error: null,
          };
        }),
        updateUserById: vi.fn(async (...args: unknown[]) => {
          state.updateCalls.push(args);
          return { error: null };
        }),
        deleteUser: vi.fn(async (...args: unknown[]) => {
          state.deleteCalls.push(args);
          return { error: null };
        }),
      },
    },
    from: vi.fn((table: string) => {
      state.table = table;
      return profilesBuilder;
    }),
  };

  return { adminClient, profilesBuilder, state, readResponse, writeResponse };
}

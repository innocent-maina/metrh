type DashboardFilterValue =
  | string
  | number
  | boolean
  | null
  | Array<string | number | boolean>;

function buildFilterQuery(filters: Record<string, DashboardFilterValue>) {
  return Object.keys(filters).length > 0
    ? { filters: JSON.stringify(filters) }
    : {};
}

export async function fetchDashboardResourceRows(
  resourceId: string,
  filters: Record<string, DashboardFilterValue> = {},
) {
  const response = await $fetch<{ rows: Record<string, unknown>[] }>(
    `/api/dashboard/${resourceId}`,
    {
      query: buildFilterQuery(filters),
    },
  );

  return response.rows ?? [];
}

export async function fetchDashboardResourceCount(
  resourceId: string,
  filters: Record<string, DashboardFilterValue> = {},
) {
  const response = await $fetch<{ count: number }>(
    `/api/dashboard/${resourceId}`,
    {
      query: {
        ...buildFilterQuery(filters),
        count: "true",
      },
    },
  );

  return response.count ?? 0;
}

export async function fetchDashboardResourceRecord(
  resourceId: string,
  identifier: { id: string } | { identifier: Record<string, string> },
) {
  const response = await $fetch<{ rows: Record<string, unknown>[] }>(
    `/api/dashboard/${resourceId}`,
    {
      query:
        "id" in identifier
          ? { id: identifier.id }
          : { identifier: JSON.stringify(identifier.identifier) },
    },
  );

  return response.rows[0] ?? null;
}

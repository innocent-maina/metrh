import { createError, getMethod, getQuery, readBody, type H3Event } from "h3";
import { z } from "zod";
import {
  getDashboardResource,
  getResourceStampFields,
} from "~~/shared/dashboard-crud";
import { requireAnyRole } from "~~/server/utils/require-role";
import {
  createStaffAccount,
  deleteStaffAccount,
  updateStaffAccount,
} from "~~/server/utils/staff-accounts";

const mutationBodySchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  identifier: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
  data: z.record(z.string(), z.unknown()).default({}),
});

function stripNilValues(input: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );
}

function parseFilterValue(value: unknown) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    if (value === "true") return true;
    if (value === "false") return false;
    if (value === "null") return null;
    if (value.trim() === "") return "";
    if (!Number.isNaN(Number(value)) && value.trim() !== "") {
      return Number(value);
    }
    return value;
  }

  return value;
}

function parseFilters(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return {};

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed).map(([key, entry]) => [key, parseFilterValue(entry)]),
    );
  } catch {
    return {};
  }
}

function getPrimaryKeyFields(resource: { primaryKey?: string | string[] }) {
  if (!resource.primaryKey) return ["id"];
  return Array.isArray(resource.primaryKey)
    ? resource.primaryKey
    : [resource.primaryKey];
}

function buildIdentifier(
  resource: { primaryKey?: string | string[] },
  body: { id?: string | number; identifier?: Record<string, string | number> },
) {
  const primaryKeyFields = getPrimaryKeyFields(resource);

  if (primaryKeyFields.length === 1) {
    const key = primaryKeyFields[0] ?? "id";
    const value = body.id ?? body.identifier?.[key];
    if (value == null || value === "") {
      throw createError({
        statusCode: 400,
        statusMessage: "A record id is required.",
      });
    }

    return { [key]: String(value) } as Record<string, string>;
  }

  const identifier: Record<string, string> = {};
  for (const key of primaryKeyFields) {
    const value = body.identifier?.[key];
    if (value == null || value === "") {
      throw createError({
        statusCode: 400,
        statusMessage: `Missing identifier field: ${key}.`,
      });
    }
    identifier[key] = String(value);
  }

  return identifier;
}

export async function handleDashboardResource(event: H3Event, resourceId: string) {
  const resourceMeta = getDashboardResource(resourceId);
  const query = getQuery(event) as Record<string, unknown>;

  if (!resourceMeta) {
    throw createError({ statusCode: 404, statusMessage: "Resource not found." });
  }

  const { resource } = resourceMeta;
  const method = getMethod(event).toUpperCase();
  const mutationRoles = resource.writeRoles ?? resource.readRoles;

  if (method === "GET") {
    const { client } = await requireAnyRole(event, resource.readRoles);
    const filters = parseFilters(query.filters);
    const isCountRequest = String(query.count ?? "") === "true";

    if (isCountRequest) {
      let countQuery = client
        .from(resource.table as never)
        .select("id", { count: "exact", head: true });

      for (const [key, value] of Object.entries(filters)) {
        if (value == null || value === "") continue;
        if (Array.isArray(value)) {
          const entries = value.map((entry) => String(entry));
          if (entries.length > 0) {
            countQuery = countQuery.in(key, entries);
          }
          continue;
        }

        countQuery = countQuery.eq(key, value as never);
      }

      const { count, error } = await countQuery;
      if (error) {
        throw createError({
          statusCode: 500,
          statusMessage: `Could not load ${resource.label.toLowerCase()}.`,
        });
      }

      return { count: count ?? 0 };
    }

    let queryBuilder = client.from(resource.table as never).select("*");
    for (const [key, value] of Object.entries(filters)) {
      if (value == null || value === "") continue;
      if (Array.isArray(value)) {
        const entries = value.map((entry) => String(entry));
        if (entries.length > 0) {
          queryBuilder = queryBuilder.in(key, entries);
        }
        continue;
      }

      queryBuilder = queryBuilder.eq(key, value as never);
    }

    if (resource.defaultSort) {
      queryBuilder = queryBuilder.order(resource.defaultSort.key, {
        ascending: resource.defaultSort.ascending ?? false,
      });
    }

    if (resource.singleton) {
      queryBuilder = queryBuilder.limit(1);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: `Could not load ${resource.label.toLowerCase()}.`,
      });
    }

    return { rows: data ?? [] };
  }

  if (method === "POST") {
    if (resource.allowCreate === false) {
      throw createError({
        statusCode: 405,
        statusMessage: "This resource cannot be created from the dashboard.",
      });
    }

    const { client, userId } = await requireAnyRole(event, mutationRoles);
    const body = mutationBodySchema.parse(await readBody(event));
    const payload = stripNilValues(body.data);

    if (resource.id === "profiles") {
      const result = await createStaffAccount(payload);
      return { row: result.row, tempPassword: result.tempPassword };
    }

    for (const field of getResourceStampFields(resource.id, "create")) {
      payload[field] = userId;
    }

    const { data, error } = await (client.from(resource.table as any) as any)
      .insert(payload)
      .select("*")
      .maybeSingle();

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: `Could not create ${resource.label.toLowerCase()}.`,
      });
    }

    return { row: data };
  }

  if (method === "PATCH") {
    if (resource.allowUpdate === false) {
      throw createError({
        statusCode: 405,
        statusMessage: "This resource cannot be updated from the dashboard.",
      });
    }

    const { client, userId } = await requireAnyRole(event, mutationRoles);
    const body = mutationBodySchema.parse(await readBody(event));

    const payload = stripNilValues(body.data);
    const identifier = buildIdentifier(resource, body);

    if (resource.id === "profiles") {
      const targetId = String(identifier.id ?? "");
      if (!targetId) {
        throw createError({
          statusCode: 400,
          statusMessage: "A record id is required.",
        });
      }

      const { row } = await updateStaffAccount(targetId, payload);
      return { row };
    }

    for (const field of getResourceStampFields(resource.id, "update")) {
      payload[field] = userId;
    }

    const { data, error } = await (client.from(resource.table as any) as any)
      .update(payload)
      .match(identifier)
      .select("*")
      .maybeSingle();

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: `Could not update ${resource.label.toLowerCase()}.`,
      });
    }

    return { row: data };
  }

  if (method === "DELETE") {
    if (resource.allowDelete === false) {
      throw createError({
        statusCode: 405,
        statusMessage: "This resource cannot be deleted from the dashboard.",
      });
    }

    const { client } = await requireAnyRole(event, mutationRoles);
    const body = mutationBodySchema.parse(await readBody(event));

    const identifier = buildIdentifier(resource, body);

    if (resource.id === "profiles") {
      const targetId = String(identifier.id ?? "");
      if (!targetId) {
        throw createError({
          statusCode: 400,
          statusMessage: "A record id is required.",
        });
      }

      await deleteStaffAccount(targetId);
      return { ok: true };
    }

    const { error } = await (client.from(resource.table as any) as any)
      .delete()
      .match(identifier);

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: `Could not delete ${resource.label.toLowerCase()}.`,
      });
    }

    return { ok: true };
  }

  throw createError({ statusCode: 405, statusMessage: "Method not allowed." });
}

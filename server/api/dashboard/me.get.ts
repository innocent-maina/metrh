import { requireAuth } from "~~/server/utils/require-role";
import type { Database } from "~~/types/database.types";

export default defineEventHandler(async (event) => {
  const { client, user } = await requireAuth(event);

  const [
    { data: profile, error: profileError },
    { data: roles, error: rolesError },
  ] = await Promise.all([
    client.from("profiles").select("*").eq("id", user.id).single(),
    client.from("user_roles").select("role").eq("user_id", user.id),
  ]);

  if (profileError) {
    throw createError({
      statusCode: 500,
      statusMessage: "Could not load your profile.",
    });
  }

  if (rolesError) {
    throw createError({
      statusCode: 500,
      statusMessage: "Could not load your access roles.",
    });
  }

  type UserRoleRow = Database["public"]["Tables"]["user_roles"]["Row"];
  const roleRows: Pick<UserRoleRow, "role">[] = roles ?? [];

  return {
    profile,
    roles: roleRows.map((r) => r.role),
  };
});

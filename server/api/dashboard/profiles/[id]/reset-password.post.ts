import { createError } from "h3";
import { requireRole } from "~~/server/utils/require-role";
import { resetStaffPassword } from "~~/server/utils/staff-accounts";

export default defineEventHandler(async (event) => {
  await requireRole(event, "super_admin");

  const userId = String(event.context.params?.id ?? "");
  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: "A user id is required." });
  }

  const result = await resetStaffPassword(userId);
  return result;
});

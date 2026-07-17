import { createError, readBody } from "h3";
import { z } from "zod";
import { requireAuth } from "~~/server/utils/require-role";
import { supabaseAdmin } from "~~/server/utils/supabase-admin";

const passwordUpdateSchema = z.object({
  password: z.string().min(8).max(256),
});

export default defineEventHandler(async (event) => {
  const { client, userId } = await requireAuth(event);
  const body = passwordUpdateSchema.parse(await readBody(event));
  const adminClient = supabaseAdmin();

  const { data: profile, error } = await adminClient
    .from("profiles")
    .select("is_active")
    .eq("id", userId)
    .maybeSingle<{ is_active: boolean }>();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Could not verify your account.",
    });
  }

  if (!profile?.is_active) {
    throw createError({
      statusCode: 403,
      statusMessage: "This account is inactive.",
    });
  }

  const { error: updateError } = await client.auth.updateUser({
    password: body.password,
  });

  if (updateError) {
    throw createError({
      statusCode: 500,
      statusMessage: updateError.message ?? "Could not update your password.",
    });
  }

  return { ok: true };
});

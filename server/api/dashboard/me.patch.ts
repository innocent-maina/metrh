import { createError, readBody } from "h3";
import { z } from "zod";
import { requireAuth } from "~~/server/utils/require-role";
import { supabaseAdmin } from "~~/server/utils/supabase-admin";
import { updateStaffAccount } from "~~/server/utils/staff-accounts";
import type { Database } from "~~/types/database.types";

const profileUpdateSchema = z.object({
  full_name: z.string().trim().min(1).max(255).optional(),
  email: z.string().trim().email().max(255).optional(),
  phone: z.string().trim().max(50).optional(),
  job_title: z.string().trim().max(120).optional(),
  avatar_url: z.string().trim().max(500).optional(),
});

export default defineEventHandler(async (event) => {
  const { userId } = await requireAuth(event);
  const adminClient = supabaseAdmin();
  type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

  const { data: profile, error } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Could not load your profile.",
    });
  }

  const currentProfile = profile as ProfileRow | null;

  if (!currentProfile) {
    throw createError({
      statusCode: 404,
      statusMessage: "Profile not found.",
    });
  }

  if (!currentProfile.is_active) {
    throw createError({
      statusCode: 403,
      statusMessage: "This account is inactive.",
    });
  }

  const body = profileUpdateSchema.parse(await readBody(event));
  const { row } = await updateStaffAccount(userId, body);

  return { row };
});

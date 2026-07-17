import { randomBytes } from "node:crypto";
import { createError } from "h3";
import { supabaseAdmin } from "~~/server/utils/supabase-admin";
import type { AppRole, Database } from "~~/types/database.types";

export type StaffProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type StaffProfileInput = Pick<
  StaffProfileRow,
  "full_name" | "email" | "avatar_url" | "phone" | "job_title" | "roles" | "is_active"
>;

const TEMP_BAN_DURATION = "876000h";

function generateTemporaryPassword() {
  return randomBytes(12).toString("base64url");
}

function normalizeTemporaryPassword(value: unknown) {
  if (value == null) return null;
  const password = String(value).trim();
  if (!password) return null;

  if (password.length < 8) {
    throw createError({
      statusCode: 400,
      statusMessage: "Temporary password must be at least 8 characters.",
    });
  }

  return password;
}

function normalizeRoles(value: unknown): AppRole[] {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .map((entry) => String(entry).trim())
        .filter((entry): entry is AppRole => {
          return (
            entry === "super_admin" ||
            entry === "content_editor" ||
            entry === "hr_manager" ||
            entry === "procurement_manager" ||
            entry === "front_desk"
          );
        }),
    ),
  );
}

function normalizeBoolean(value: unknown, fallback: boolean) {
  if (value == null || value === "") return fallback;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["false", "0", "off", "no"].includes(normalized)) return false;
    if (["true", "1", "on", "yes"].includes(normalized)) return true;
  }

  return Boolean(value);
}

function normalizeText(value: unknown) {
  if (value == null) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
}

function normalizeStaffInput(data: Record<string, unknown>): StaffProfileInput {
  const fullName = normalizeText(data.full_name);
  const email = normalizeText(data.email);

  if (!fullName) {
    throw createError({ statusCode: 400, statusMessage: "Full name is required." });
  }

  if (!email) {
    throw createError({ statusCode: 400, statusMessage: "Email is required." });
  }

  const roles = normalizeRoles(data.roles);
  if (roles.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "At least one role is required for every team member.",
    });
  }

  return {
    full_name: fullName,
    email,
    avatar_url: normalizeText(data.avatar_url),
    phone: normalizeText(data.phone),
    job_title: normalizeText(data.job_title),
    roles,
    is_active: normalizeBoolean(data.is_active, true),
  };
}

export async function createStaffAccount(data: Record<string, unknown>) {
  const adminClient = supabaseAdmin();
  const payload = normalizeStaffInput(data);
  const tempPassword = normalizeTemporaryPassword(data.temporary_password) ?? generateTemporaryPassword();

  const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
    email: payload.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      full_name: payload.full_name,
    },
  });

  if (authError || !authUser.user) {
    throw createError({
      statusCode: 500,
      statusMessage: authError?.message ?? "Could not create the auth user.",
    });
  }

  if (!payload.is_active) {
    const { error: banError } = await adminClient.auth.admin.updateUserById(
      authUser.user.id,
      { ban_duration: TEMP_BAN_DURATION },
    );

    if (banError) {
      await adminClient.auth.admin.deleteUser(authUser.user.id);
      throw createError({
        statusCode: 500,
        statusMessage: banError.message ?? "Could not deactivate the auth user.",
      });
    }
  }

  const profileRow = {
    id: authUser.user.id,
    ...payload,
  };

  const { data: row, error } = await (adminClient.from("profiles") as any)
    .insert(profileRow)
    .select("*")
    .maybeSingle();

  if (error || !row) {
    await adminClient.auth.admin.deleteUser(authUser.user.id);
    throw createError({
      statusCode: 500,
      statusMessage: error?.message ?? "Could not create the staff profile.",
    });
  }

  return { row: row as StaffProfileRow, tempPassword };
}

export async function updateStaffAccount(
  userId: string,
  data: Record<string, unknown>,
) {
  const adminClient = supabaseAdmin();
  const { data: existing, error: readError } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (readError) {
    throw createError({
      statusCode: 500,
      statusMessage: readError.message ?? "Could not load the staff profile.",
    });
  }

  const current = existing as StaffProfileRow | null;
  if (!current) {
    throw createError({ statusCode: 404, statusMessage: "Staff profile not found." });
  }

  const payload = normalizeStaffInput({
    full_name: data.full_name ?? current.full_name,
    email: data.email ?? current.email,
    avatar_url: data.avatar_url ?? current.avatar_url,
    phone: data.phone ?? current.phone,
    job_title: data.job_title ?? current.job_title,
    roles: data.roles ?? current.roles,
    is_active: data.is_active ?? current.is_active,
  });

  const authUpdate: {
    email?: string;
    email_confirm?: boolean;
    ban_duration?: string | "none";
    user_metadata?: { full_name?: string };
  } = {};
  authUpdate.user_metadata = { full_name: payload.full_name };
  const nextEmail = payload.email;
  if (nextEmail !== current.email) {
    authUpdate.email = nextEmail;
    authUpdate.email_confirm = true;
  }

  const activeChanged = payload.is_active !== current.is_active;
  if (activeChanged) {
    authUpdate.ban_duration = payload.is_active ? "none" : TEMP_BAN_DURATION;
  }

  if (Object.keys(authUpdate).length > 0) {
    const { error: authError } = await adminClient.auth.admin.updateUserById(
      userId,
      authUpdate,
    );

    if (authError) {
      throw createError({
        statusCode: 500,
        statusMessage: authError.message ?? "Could not update the auth user.",
      });
    }
  }

  const { data: row, error } = await (adminClient.from("profiles") as any)
    .update(payload)
    .eq("id", userId)
    .select("*")
    .maybeSingle();

  if (error || !row) {
    if (Object.keys(authUpdate).length > 0) {
      await adminClient.auth.admin.updateUserById(userId, {
        email: current.email,
        email_confirm: true,
        ban_duration: current.is_active ? "none" : TEMP_BAN_DURATION,
        user_metadata: { full_name: current.full_name },
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: error?.message ?? "Could not update the staff profile.",
    });
  }

  return { row: row as StaffProfileRow };
}

export async function deleteStaffAccount(userId: string) {
  const adminClient = supabaseAdmin();
  const { error } = await adminClient.auth.admin.deleteUser(userId);

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message ?? "Could not delete the staff account.",
    });
  }

  return { ok: true };
}

export async function resetStaffPassword(userId: string) {
  const adminClient = supabaseAdmin();
  const tempPassword = generateTemporaryPassword();

  const { error } = await adminClient.auth.admin.updateUserById(userId, {
    password: tempPassword,
  });

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message ?? "Could not reset the password.",
    });
  }

  return { tempPassword };
}

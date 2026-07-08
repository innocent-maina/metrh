import { createError } from "h3";
import { supabaseAdmin } from "~~/server/utils/supabase-admin";

export type StorageBucketName = "media" | "documents";

function sanitizeStoragePart(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function sanitizeStorageFolder(folder: string) {
  const parts = folder
    .split("/")
    .map((part) => sanitizeStoragePart(part))
    .filter(Boolean);

  if (parts.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "A storage folder is required.",
    });
  }

  return parts.join("/");
}

function sanitizeStorageFileName(fileName: string) {
  const safeName = sanitizeStoragePart(fileName);

  return safeName || "upload";
}

export async function createSignedStorageUpload(params: {
  bucket: StorageBucketName;
  folder: string;
  fileName: string;
}) {
  const path = `${sanitizeStorageFolder(params.folder)}/${Date.now()}-${sanitizeStorageFileName(params.fileName)}`;

  const { data, error } = await supabaseAdmin()
    .storage.from(params.bucket)
    .createSignedUploadUrl(path);

  if (error || !data) {
    console.error("[storage-upload] Failed to create signed upload URL", {
      bucket: params.bucket,
      folder: params.folder,
      fileName: params.fileName,
      path,
      error,
    });

    throw createError({
      statusCode: 500,
      statusMessage:
        error?.message ?? "Could not create an upload link for this file.",
    });
  }

  return data;
}

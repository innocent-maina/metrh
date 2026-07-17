import { createError } from "h3";
import { supabaseAdmin } from "~~/server/utils/supabase-admin";
import { resolvePublicStorageUrl } from "~~/shared/storage";

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

export function buildStorageObjectPath(params: {
  folder: string;
  fileName: string;
}) {
  return `${sanitizeStorageFolder(params.folder)}/${Date.now()}-${sanitizeStorageFileName(params.fileName)}`;
}

export async function uploadStorageObject(params: {
  bucket: StorageBucketName;
  folder: string;
  fileName: string;
  file: Blob | ArrayBuffer | ArrayBufferView | Buffer | string;
  contentType?: string;
}) {
  const path = buildStorageObjectPath({
    folder: params.folder,
    fileName: params.fileName,
  });

  const { error } = await supabaseAdmin().storage.from(params.bucket).upload(path, params.file, {
    contentType: params.contentType,
    upsert: false,
  });

  if (error) {
    console.error("[storage-upload] Failed to upload storage object", {
      bucket: params.bucket,
      folder: params.folder,
      fileName: params.fileName,
      path,
      error,
    });

    throw createError({
      statusCode: 500,
      statusMessage: error.message ?? "Could not upload the file.",
    });
  }

  const config = useRuntimeConfig();
  const supabaseUrl = config.public.supabase?.url ?? config.public.supabaseUrl;

  return {
    path,
    publicUrl:
      params.bucket === "media" && supabaseUrl
        ? resolvePublicStorageUrl({
            supabaseUrl,
            bucket: "media",
            path,
          })
        : null,
  };
}

export async function createSignedStorageUpload(params: {
  bucket: StorageBucketName;
  folder: string;
  fileName: string;
}) {
  const path = buildStorageObjectPath({
    folder: params.folder,
    fileName: params.fileName,
  });
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

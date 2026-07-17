import { createError, readMultipartFormData } from "h3";
import { z } from "zod";
import { uploadStorageObject } from "~~/server/utils/storage-upload";

const storageUploadSchema = z.object({
  bucket: z.enum(["media", "documents"]),
  folder: z.string().trim().min(1).max(512),
  fileName: z.string().trim().min(1).max(255),
});

export default defineEventHandler(async (event) => {
  const parts = await readMultipartFormData(event);

  if (!parts?.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid upload request.",
    });
  }

  const fields = Object.fromEntries(
    parts
      .filter((part) => part.name && !part.filename)
      .map((part) => [part.name as string, part.data.toString()]),
  );
  const parsed = storageUploadSchema.safeParse(fields);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message ?? "Invalid upload request.",
    });
  }

  const filePart = parts.find((part) => part.name === "file" && part.filename);
  if (!filePart) {
    throw createError({
      statusCode: 400,
      statusMessage: "A file is required.",
    });
  }

  return uploadStorageObject({
    bucket: parsed.data.bucket,
    folder: parsed.data.folder,
    fileName: parsed.data.fileName,
    file: filePart.data,
    contentType: filePart.type ?? undefined,
  });
});

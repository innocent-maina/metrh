import { z } from "zod";
import { readBody } from "h3";
import { createSignedStorageUpload } from "~~/server/utils/storage-upload";

const signUploadSchema = z.object({
  jobSlug: z
    .string()
    .trim()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9-]+$/),
  fileName: z.string().trim().min(1).max(255),
});

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
}

export default defineEventHandler(async (event) => {
  const body = signUploadSchema.parse(await readBody(event));
  const fileName = sanitizeFileName(body.fileName);

  return createSignedStorageUpload({
    bucket: "documents",
    folder: `applications/${body.jobSlug}`,
    fileName,
  });
});

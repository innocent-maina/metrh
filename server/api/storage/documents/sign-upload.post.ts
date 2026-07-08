import { z } from "zod";
import { supabaseAdmin } from "~~/server/utils/supabase-admin";

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
  const path = `applications/${body.jobSlug}/${Date.now()}-${fileName}`;

  const { data, error } = await supabaseAdmin()
    .storage.from("documents")
    .createSignedUploadUrl(path);

  if (error || !data) {
    throw createError({
      statusCode: 500,
      statusMessage: "Could not create an upload link.",
    });
  }

  return data;
});

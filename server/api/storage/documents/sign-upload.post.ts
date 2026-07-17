import { createError, readBody } from "h3";
import { z } from "zod";
import { supabaseAdmin } from "~~/server/utils/supabase-admin";
import { createSignedStorageUpload } from "~~/server/utils/storage-upload";

const schema = z.object({
  jobSlug: z
    .string()
    .trim()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9-]+$/i),
  fileName: z.string().trim().min(1).max(255),
});

export default defineEventHandler(async (event) => {
  const body = schema.parse(await readBody(event));

  const { data: posting, error } = await supabaseAdmin()
    .from("job_postings")
    .select("id,status,slug")
    .eq("slug", body.jobSlug)
    .maybeSingle<{ id: string; status: string; slug: string }>();

  if (error || !posting || posting.status !== "open") {
    throw createError({
      statusCode: 400,
      statusMessage: "This posting is no longer open.",
    });
  }

  return createSignedStorageUpload({
    bucket: "documents",
    folder: `applications/${body.jobSlug}`,
    fileName: body.fileName,
  });
});

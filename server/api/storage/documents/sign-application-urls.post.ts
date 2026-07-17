import { createError, readBody } from "h3";
import { z } from "zod";
import { supabaseAdmin } from "~~/server/utils/supabase-admin";

const schema = z.object({
  applicationId: z.string().uuid(),
});

function isExternalUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

async function signDocumentsFileUrl(fileUrl: string) {
  if (isExternalUrl(fileUrl)) {
    return fileUrl;
  }

  const { data, error } = await supabaseAdmin()
    .storage.from("documents")
    .createSignedUrl(fileUrl, 60 * 10);

  if (error || !data?.signedUrl) {
    throw error ?? new Error("Could not create a signed download URL.");
  }

  return data.signedUrl;
}

export default defineEventHandler(async (event) => {
  const body = schema.parse(await readBody(event));

  const { data: row, error } = await supabaseAdmin()
    .from("job_applications")
    .select("id,resume_url,supporting_document_url")
    .eq("id", body.applicationId)
    .maybeSingle<{
      id: string;
      resume_url: string;
      supporting_document_url: string | null;
    }>();

  if (error || !row) {
    throw createError({
      statusCode: 404,
      statusMessage: "Application not found.",
    });
  }

  return {
    resumeUrl: await signDocumentsFileUrl(row.resume_url),
    supportingDocumentUrl: row.supporting_document_url
      ? await signDocumentsFileUrl(row.supporting_document_url)
      : null,
  };
});

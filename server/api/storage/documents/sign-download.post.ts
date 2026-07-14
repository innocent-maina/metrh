import { readBody } from "h3";
import { z } from "zod";
import { supabaseAdmin } from "~~/server/utils/supabase-admin";

const signDownloadSchema = z.object({
  items: z
    .array(
      z.object({
        resource: z.enum(["downloads", "tender_documents"]),
        id: z.string().uuid(),
      }),
    )
    .min(1)
    .max(50),
});

type SignDownloadItem = z.infer<typeof signDownloadSchema>["items"][number];

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

async function resolveDownloadUrl(item: SignDownloadItem) {
  const admin = supabaseAdmin();

  if (item.resource === "downloads") {
    const { data, error } = await admin
      .from("downloads")
      .select("id,file_url,is_published")
      .eq("id", item.id)
      .maybeSingle();

    if (error || !data || !data.is_published) {
      return { id: item.id, downloadUrl: null };
    }

    try {
      return {
        id: item.id,
        downloadUrl: await signDocumentsFileUrl(data.file_url),
      };
    } catch (error) {
      console.warn("[documents] Could not sign download file URL.", {
        resource: item.resource,
        id: item.id,
        error,
      });
      return { id: item.id, downloadUrl: null };
    }
  }

  const { data: documentRow, error: documentError } = await admin
    .from("tender_documents")
    .select("id,file_url,tender_id")
    .eq("id", item.id)
    .maybeSingle();

  if (documentError || !documentRow) {
    return { id: item.id, downloadUrl: null };
  }

  const { data: tenderRow, error: tenderError } = await admin
    .from("tenders")
    .select("id,status")
    .eq("id", documentRow.tender_id)
    .maybeSingle();

  if (tenderError || !tenderRow || tenderRow.status === "draft") {
    return { id: item.id, downloadUrl: null };
  }

  try {
    return {
      id: item.id,
      downloadUrl: await signDocumentsFileUrl(documentRow.file_url),
    };
  } catch (error) {
    console.warn("[documents] Could not sign tender document URL.", {
      resource: item.resource,
      id: item.id,
      error,
    });
    return { id: item.id, downloadUrl: null };
  }
}

export default defineEventHandler(async (event) => {
  const body = signDownloadSchema.parse(await readBody(event));
  const items = await Promise.all(body.items.map((item) => resolveDownloadUrl(item)));

  return { items };
});

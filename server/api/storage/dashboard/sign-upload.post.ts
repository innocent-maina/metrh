import { z } from "zod";
import { readBody } from "h3";
import { requireAnyRole } from "~~/server/utils/require-role";
import { createSignedStorageUpload } from "~~/server/utils/storage-upload";

const dashboardUploadSchema = z.object({
  bucket: z.enum(["media", "documents"]),
  folder: z.string().trim().min(1).max(200),
  fileName: z.string().trim().min(1).max(255),
});

export default defineEventHandler(async (event) => {
  await requireAnyRole(event, [
    "super_admin",
    "content_editor",
    "hr_manager",
    "procurement_manager",
    "front_desk",
  ]);

  const body = dashboardUploadSchema.parse(await readBody(event));

  return createSignedStorageUpload({
    bucket: body.bucket,
    folder: body.folder,
    fileName: body.fileName,
  });
});

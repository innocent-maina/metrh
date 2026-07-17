import { createError, readMultipartFormData } from "h3";
import { requireAnyRole } from "~~/server/utils/require-role";
import { uploadStorageObject } from "~~/server/utils/storage-upload";

export default defineEventHandler(async (event) => {
  await requireAnyRole(event, [
    "super_admin",
    "content_editor",
    "hr_manager",
    "procurement_manager",
    "front_desk",
  ]);

  const formData = await readMultipartFormData(event);
  if (!formData) {
    throw createError({
      statusCode: 400,
      statusMessage: "A file upload is required.",
    });
  }

  const getFieldValue = (name: string) =>
    formData.find((part) => part.name === name && part.filename == null)?.data?.toString("utf8").trim() ?? "";

  const filePart = formData.find((part) => part.name === "file" && part.filename);
  if (!filePart?.data || !filePart.filename) {
    throw createError({
      statusCode: 400,
      statusMessage: "A file is required.",
    });
  }

  const bucket = getFieldValue("bucket");
  const folder = getFieldValue("folder");
  const fileName = getFieldValue("fileName") || filePart.filename;

  if (bucket !== "media" && bucket !== "documents") {
    throw createError({
      statusCode: 400,
      statusMessage: "An upload bucket is required.",
    });
  }

  if (!folder) {
    throw createError({
      statusCode: 400,
      statusMessage: "An upload folder is required.",
    });
  }

  return uploadStorageObject({
    bucket,
    folder,
    fileName,
    file: filePart.data,
    contentType: filePart.type ?? "application/octet-stream",
  });
});

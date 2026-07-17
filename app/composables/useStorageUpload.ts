export interface StorageUploadResponse {
  path: string;
  publicUrl: string | null;
}

export async function uploadStorageFile(params: {
  bucket: "media" | "documents";
  folder: string;
  fileName: string;
  file: File;
}) {
  const formData = new FormData();
  formData.append("bucket", params.bucket);
  formData.append("folder", params.folder);
  formData.append("fileName", params.fileName);
  formData.append("file", params.file);

  return await $fetch<StorageUploadResponse>("/api/storage/upload", {
    method: "POST",
    body: formData,
  });
}

export function resolvePublicStorageUrl(params: {
  supabaseUrl: string;
  bucket: "media" | "documents";
  path: string;
}) {
  const baseUrl = params.supabaseUrl.trim().replace(/\/+$/, "");
  const storagePath = params.path.trim().replace(/^\/+/, "");

  if (!baseUrl || !storagePath) {
    return "";
  }

  return `${baseUrl}/storage/v1/object/public/${params.bucket}/${storagePath}`;
}

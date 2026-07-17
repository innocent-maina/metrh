import { resolvePublicStorageUrl } from "~~/shared/storage";

export function usePublicStorageUrl() {
  const config = useRuntimeConfig();
  const supabaseUrl = config.public.supabase?.url ?? config.public.supabaseUrl;

  return (value: string | null | undefined, bucket: "media" | "documents" = "media") => {
    const raw = String(value ?? "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw) || raw.startsWith("data:")) return raw;
    if (!supabaseUrl) return raw;

    return resolvePublicStorageUrl({
      supabaseUrl,
      bucket,
      path: raw,
    });
  };
}

export type SignedDocumentResource = "downloads" | "tender_documents";

export type SignedDocumentReference = {
  resource: SignedDocumentResource;
  id: string;
};

type SignedDocumentResponse = {
  items: Array<{
    id: string;
    downloadUrl: string | null;
  }>;
};

export async function fetchSignedDocumentUrls(items: SignedDocumentReference[]) {
  if (items.length === 0) {
    return new Map<string, string | null>();
  }

  const response = await $fetch<SignedDocumentResponse>(
    "/api/storage/documents/sign-download",
    {
      method: "POST",
      body: { items },
    },
  );

  return new Map(response.items.map((item) => [item.id, item.downloadUrl] as const));
}

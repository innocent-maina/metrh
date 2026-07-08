interface CmsPage {
  slug: string;
  title: string;
  content: string;
  seo_title: string | null;
  seo_description: string | null;
  updated_at: string;
}

export function useLegalPage(slug: string) {
  return useFetch<CmsPage>(`/api/pages/${slug}`, {
    key: `page-${slug}`,
  });
}

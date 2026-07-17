import { getRouterParam } from "h3";
import { supabaseAdmin } from "~~/server/utils/supabase-admin";

type BlogPostRow = {
  id: string;
  category_id: string | null;
  [key: string]: unknown;
};

export default defineEventHandler(async (event) => {
  const slug = String(getRouterParam(event, "slug") ?? "");
  const admin = supabaseAdmin();

  const { data: postData, error } = await admin
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw error;
  const post = postData as BlogPostRow | null;
  if (!post) return { post: null, category: null, relatedPosts: [] };

  const [categoryResult, relatedResult] = await Promise.all([
    admin
      .from("blog_categories")
      .select("*")
      .eq("id", post.category_id ?? "")
      .maybeSingle(),
    admin
      .from("blog_posts")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(6),
  ]);

  if (categoryResult.error) throw categoryResult.error;
  if (relatedResult.error) throw relatedResult.error;

  return {
    post,
    category: categoryResult.data ?? null,
    relatedPosts: relatedResult.data ?? [],
  };
});

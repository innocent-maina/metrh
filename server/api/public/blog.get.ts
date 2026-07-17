import { supabaseAdmin } from "~~/server/utils/supabase-admin";

export default defineEventHandler(async () => {
  const admin = supabaseAdmin();

  const [categoriesResult, postsResult] = await Promise.all([
    admin
      .from("blog_categories")
      .select("*")
      .order("name", { ascending: true }),
    admin
      .from("blog_posts")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false }),
  ]);

  if (categoriesResult.error) throw categoriesResult.error;
  if (postsResult.error) throw postsResult.error;

  return {
    categories: categoriesResult.data ?? [],
    posts: postsResult.data ?? [],
  };
});

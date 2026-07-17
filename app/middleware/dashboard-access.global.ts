// Dashboard routes are client-rendered so the browser session can survive a
// refresh without any SSR auth state. This guard checks the browser session
// directly, then fetches the staff profile/roles needed to decide whether the
// user can see the dashboard.
const openDashboardPaths = new Set([
  "/dashboard/login",
  "/dashboard/confirm",
  "/dashboard/forgot-password",
  "/dashboard/unauthorized",
]);

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return;
  if (!to.path.startsWith("/dashboard")) return;

  const supabase = useSupabaseClient();
  const { data } = await supabase.auth.getSession();
  const session = data.session;

  if (!session) {
    if (openDashboardPaths.has(to.path)) return;

    return navigateTo({
      path: "/dashboard/login",
      query: { redirect: to.fullPath },
    });
  }

  if (to.path === "/dashboard/login" || to.path === "/dashboard/forgot-password") {
    return navigateTo("/dashboard");
  }

  if (openDashboardPaths.has(to.path)) return;

  const { me, load } = useDashboardRoles();
  if (!me.value) await load();

  if (
    !me.value ||
    me.value.profile?.is_active === false ||
    me.value.roles.length === 0
  ) {
    return navigateTo("/dashboard/unauthorized");
  }
});

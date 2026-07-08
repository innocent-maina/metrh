// The @nuxtjs/supabase module already redirects unauthenticated visitors to
// /dashboard/login for every route not in nuxt.config's `exclude` list (i.e.
// every /dashboard/** route). That handles "is this person signed in?".
//
// This middleware handles the next question: "does this signed-in person
// hold any dashboard role at all?" A staff account can exist (auth.users +
// profiles row) without a user_roles row yet — e.g. freshly invited, not
// yet assigned a role by a super_admin. Those users should land on a clear
// "no access yet" page, not a broken/empty dashboard.
//
// This is a UX guard, not the security boundary — RLS + requireRole() on
// each server route is what actually enforces access.
const openDashboardPaths = new Set([
  "/dashboard/login",
  "/dashboard/confirm",
  "/dashboard/forgot-password",
  "/dashboard/unauthorized",
]);

export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith("/dashboard")) return;
  if (openDashboardPaths.has(to.path)) return;

  const user = useSupabaseUser();
  if (!user.value) return; // module's own middleware will redirect to login

  const { me, load } = useDashboardRoles();
  if (!me.value) await load();

  if (me.value && me.value.roles.length === 0) {
    return navigateTo("/dashboard/unauthorized");
  }
});

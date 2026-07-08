import type { AppRole, Database } from "~~/types/database.types";

interface DashboardMe {
  profile: Database["public"]["Tables"]["profiles"]["Row"] | null;
  roles: AppRole[];
}

/**
 * Fetches and caches the current staff member's profile + roles for the
 * lifetime of the session. Used to scope dashboard nav and gate UI — the
 * real authorization boundary is RLS + requireRole() on the server, this is
 * for "don't show a procurement widget to a content_editor," not security.
 */
export function useDashboardRoles() {
  const state = useState<DashboardMe | null>("dashboard-me", () => null);
  const pending = useState("dashboard-me-pending", () => false);
  const error = useState<string | null>("dashboard-me-error", () => null);

  async function load(force = false) {
    if (state.value && !force) return state.value;

    pending.value = true;
    error.value = null;

    try {
      state.value = await $fetch<DashboardMe>("/api/dashboard/me");
    } catch {
      error.value = "Could not load your account. Try refreshing the page.";
    } finally {
      pending.value = false;
    }

    return state.value;
  }

  function hasRole(role: AppRole) {
    if (!state.value) return false;
    return (
      state.value.roles.includes(role) ||
      state.value.roles.includes("super_admin")
    );
  }

  const isSuperAdmin = computed(
    () => state.value?.roles.includes("super_admin") ?? false,
  );

  function reset() {
    state.value = null;
  }

  return { me: state, pending, error, load, hasRole, isSuperAdmin, reset };
}

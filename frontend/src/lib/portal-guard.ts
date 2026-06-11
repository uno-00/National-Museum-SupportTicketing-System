import { redirect } from "@tanstack/react-router";
import { api, ApiError } from "@/lib/api/client";
import { LOGIN, dashboardForRole } from "@/lib/navigation";
import { getSession, setSession, type PortalSlot } from "@/lib/sessions";

export async function ensurePortalRole(
  allowed: (role: string) => boolean,
  slot: PortalSlot,
) {
  const saved = getSession(slot);
  if (!saved?.token) {
    throw redirect({ to: LOGIN, replace: true });
  }
  try {
    const { user } = await api.me(slot);
    if (!allowed(user.role)) {
      throw redirect({ to: dashboardForRole(user.role), replace: true });
    }
    setSession(slot, { token: saved.token, user });
    return user;
  } catch (err) {
    if (err && typeof err === "object" && "to" in err) throw err;
    if (err instanceof ApiError && err.status === 401) {
      setSession(slot, null);
      throw redirect({ to: LOGIN, replace: true });
    }
    return;
  }
}

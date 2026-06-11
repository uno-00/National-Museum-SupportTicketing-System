import { isAdminRole } from "@/lib/navigation";
import { ensurePortalRole } from "@/lib/portal-guard";

export async function ensureAdminPortalAccess() {
  return ensurePortalRole(isAdminRole, "admin");
}

import { isClientRole } from "@/lib/navigation";
import { ensurePortalRole } from "@/lib/portal-guard";

export async function ensureClientPortalAccess() {
  return ensurePortalRole(isClientRole, "client");
}

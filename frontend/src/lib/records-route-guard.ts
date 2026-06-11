import { isRecordsRole } from "@/lib/navigation";
import { ensurePortalRole } from "@/lib/portal-guard";

export async function ensureRecordsPortalAccess() {
  return ensurePortalRole(isRecordsRole, "records");
}

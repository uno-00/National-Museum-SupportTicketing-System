import { createFileRoute } from "@tanstack/react-router";
import { PortalLoginPage } from "@/components/auth/PortalLoginPage";
import {
  ADMIN_DASHBOARD,
  validateAdminUser,
} from "@/lib/navigation";

export const Route = createFileRoute("/admin/login")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin sign in — TARF System" }] }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  return (
    <PortalLoginPage
      portalLabel="Admin portal"
      title="Admin (DH/SH)"
      subtitle="Form creation, approvals, and request management"
      footerNote="Use your Admin account only. Records and Client have separate login pages."
      successTo={ADMIN_DASHBOARD}
      demoEmail="admin@nmp.gov.ph"
      demoPassword="admin123"
      validateRole={validateAdminUser}
      wrongRoleMessage="This account is not an Admin user. Use the correct portal login page."
    />
  );
}

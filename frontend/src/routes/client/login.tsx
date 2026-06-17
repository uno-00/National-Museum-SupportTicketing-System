import { createFileRoute } from "@tanstack/react-router";
import { PortalLoginPage } from "@/components/auth/PortalLoginPage";
import {
  CLIENT_DASHBOARD,
  validateClientUser,
} from "@/lib/navigation";

export const Route = createFileRoute("/client/login")({
  ssr: false,
  head: () => ({ meta: [{ title: "Client sign in — TARF System" }] }),
  component: ClientLoginPage,
});

function ClientLoginPage() {
  return (
    <PortalLoginPage
      portalLabel="Client portal"
      title="Client Portal"
      subtitle="View your requests and submit new ones"
      footerNote="Your account only shows your own requests. Admin and Records use separate portals."
      successTo={CLIENT_DASHBOARD}
      demoEmail="user@nmp.gov.ph"
      demoPassword="user123"
      validateRole={validateClientUser}
      wrongRoleMessage="This account is not a Client user. Use the correct portal login page."
    />
  );
}

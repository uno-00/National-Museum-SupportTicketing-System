import { createFileRoute } from "@tanstack/react-router";
import { PortalLoginPage } from "@/components/auth/PortalLoginPage";
import {
  RECORDS_DASHBOARD,
  validateRecordsUser,
} from "@/lib/navigation";

export const Route = createFileRoute("/records/login")({
  ssr: false,
  head: () => ({ meta: [{ title: "Records sign in — TARF System" }] }),
  component: RecordsLoginPage,
});

function RecordsLoginPage() {
  return (
    <PortalLoginPage
      portalLabel="Records portal"
      title="Record Admin"
      subtitle="Review and publish TA forms"
      footerNote="Use your Records account only. Admin and Client have separate login pages."
      successTo={RECORDS_DASHBOARD}
      demoEmail="records@nmp.gov.ph"
      demoPassword="records123"
      validateRole={validateRecordsUser}
      wrongRoleMessage="This account is not a Records user. Use the correct portal login page."
    />
  );
}

import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ensurePortalRole } from "@/lib/portal-guard";
import {
  CLIENT_DASHBOARD,
  CLIENT_FEEDBACK,
  CLIENT_FORMS,
  CLIENT_REQUESTS,
  CLIENT_SUBMIT,
  isClientRole,
} from "@/lib/navigation";

export const Route = createFileRoute("/client")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    await ensurePortalRole(isClientRole, "client");
    if (location.pathname === "/client" || location.pathname === "/client/") {
      throw redirect({ to: CLIENT_DASHBOARD, replace: true });
    }
  },
  component: ClientLayout,
});

function ClientLayout() {

  return (
    <DashboardShell
      portalTitle="Client Portal"
      nav={[
        { to: CLIENT_DASHBOARD, label: "Dashboard" },
        { to: CLIENT_FORMS, label: "Available Forms" },
        { to: CLIENT_SUBMIT, label: "Submit Request" },
        { to: CLIENT_REQUESTS, label: "My Requests" },
        { to: CLIENT_FEEDBACK, label: "Feedback" },
      ]}
    >
      <Outlet />
    </DashboardShell>
  );
}

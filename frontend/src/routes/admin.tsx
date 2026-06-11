import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { api } from "@/lib/api/client";
import { ensurePortalRole } from "@/lib/portal-guard";
import {
  ADMIN_APPROVALS,
  ADMIN_DASHBOARD,
  ADMIN_FORMS,
  ADMIN_MY_FORMS,
  ADMIN_REPORTS,
  ADMIN_REQUESTS,
  isAdminRole,
} from "@/lib/navigation";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    await ensurePortalRole(isAdminRole, "admin");
    if (location.pathname === "/admin" || location.pathname === "/admin/") {
      throw redirect({ to: ADMIN_DASHBOARD, replace: true });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { data: tickets } = useQuery({
    queryKey: ["admin-tickets-pending"],
    queryFn: () => api.listTickets({ status: "pending_approval" }),
  });

  return (
    <DashboardShell
      portalTitle="Admin (DH/SH)"
      notificationCount={tickets?.pendingCount}
      nav={[
        { to: ADMIN_DASHBOARD, label: "Dashboard" },
        { to: ADMIN_FORMS, label: "Form Builder" },
        { to: ADMIN_MY_FORMS, label: "My Forms" },
        { to: ADMIN_APPROVALS, label: "Approvals", badge: tickets?.pendingCount },
        { to: ADMIN_REQUESTS, label: "Request Management" },
        { to: ADMIN_REPORTS, label: "Reports" },
      ]}
    >
      <Outlet />
    </DashboardShell>
  );
}

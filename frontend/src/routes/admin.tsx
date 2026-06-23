import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  ClipboardCheck,
  FilePenLine,
  FileStack,
  LayoutDashboard,
  Ticket,
  UserCheck,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { api } from "@/lib/api/client";
import { adminApprovalNotifications } from "@/lib/notifications";
import { ensurePortalRole } from "@/lib/portal-guard";
import { useAdminSession } from "@/lib/use-portal-session";
import {
  ADMIN_APPROVALS,
  ADMIN_ASSIGNED,
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
  const { canQuery } = useAdminSession();
  const { data: tickets, isLoading: notificationsLoading } = useQuery({
    queryKey: ["admin-tickets-pending"],
    queryFn: () => api.listTickets({ status: "pending_approval" }, "admin"),
    enabled: canQuery,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 15_000,
    staleTime: 0,
  });

  const notifications = adminApprovalNotifications(tickets?.items ?? []);

  return (
    <DashboardShell
      portalTitle="Admin"
      notifications={notifications}
      notificationsLoading={notificationsLoading}
      notificationsViewAllTo={ADMIN_APPROVALS}
      notificationsEmptyMessage="No pending client requests"
      nav={[
        { to: ADMIN_DASHBOARD, label: "Dashboard", icon: LayoutDashboard },
        { to: ADMIN_FORMS, label: "Form Builder", icon: FilePenLine },
        { to: ADMIN_MY_FORMS, label: "My Forms", icon: FileStack },
        {
          to: ADMIN_APPROVALS,
          label: "Approvals",
          icon: ClipboardCheck,
          badge: tickets?.pendingCount ?? notifications.length,
        },
        { to: ADMIN_REQUESTS, label: "Request Management", icon: Ticket },
        { to: ADMIN_ASSIGNED, label: "My Assignments", icon: UserCheck },
        { to: ADMIN_REPORTS, label: "Reports", icon: BarChart3 },
      ]}
    >
      <Outlet />
    </DashboardShell>
  );
}

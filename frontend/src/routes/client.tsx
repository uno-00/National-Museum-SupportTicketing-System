import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Inbox, LayoutDashboard, MessageSquare } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { api } from "@/lib/api/client";
import { ensurePortalRole } from "@/lib/portal-guard";
import { clientTicketNotifications } from "@/lib/notifications";
import { CLIENT_DASHBOARD, CLIENT_FEEDBACK, CLIENT_REQUESTS, isClientRole } from "@/lib/navigation";
import { countTicketsNeedingFeedback } from "@/lib/ticket-workflow";

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
  const { data: tickets, isLoading: notificationsLoading } = useQuery({
    queryKey: ["my-tickets"],
    queryFn: () => api.myTickets(),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 15_000,
    staleTime: 0,
  });

  const notifications = clientTicketNotifications(tickets?.items ?? []);
  const actionCount = notifications.length;
  const feedbackCount = countTicketsNeedingFeedback(tickets?.items ?? []);

  return (
    <DashboardShell
      portalTitle="Client Portal"
      notifications={notifications}
      notificationsLoading={notificationsLoading}
      notificationsViewAllTo={CLIENT_REQUESTS}
      notificationsEmptyMessage="No updates on your requests"
      nav={[
        { to: CLIENT_DASHBOARD, label: "Dashboard", icon: LayoutDashboard },
        { to: CLIENT_REQUESTS, label: "My Requests", icon: Inbox, badge: actionCount || undefined },
        {
          to: CLIENT_FEEDBACK,
          label: "Service Feedback",
          icon: MessageSquare,
          badge: feedbackCount || undefined,
        },
      ]}
    >
      <Outlet />
    </DashboardShell>
  );
}

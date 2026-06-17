import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Clock, History, LayoutDashboard } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { api } from "@/lib/api/client";
import { ensurePortalRole } from "@/lib/portal-guard";
import { recordsPendingNotifications } from "@/lib/notifications";
import { useRecordsSession } from "@/lib/use-portal-session";
import {
  isPortalLoginPath,
  isRecordsRole,
  RECORDS_ACTIVITY,
  RECORDS_DASHBOARD,
  RECORDS_LOGIN,
  RECORDS_PENDING,
  RECORDS_PUBLISHED,
} from "@/lib/navigation";

export const Route = createFileRoute("/records")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    if (isPortalLoginPath(location.pathname)) return;
    await ensurePortalRole(isRecordsRole, "records");
    if (location.pathname === "/records" || location.pathname === "/records/") {
      throw redirect({ to: RECORDS_DASHBOARD, replace: true });
    }
  },
  component: RecordsLayout,
});

function RecordsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, sessionReady, logout, canQuery } = useRecordsSession();

  const { data, isError, isLoading: notificationsLoading } = useQuery({
    queryKey: ["records-dashboard"],
    queryFn: () => api.recordsDashboard(),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 15_000,
    staleTime: 0,
    enabled: canQuery,
  });

  const pendingCount = canQuery && !isError ? data?.pendingCount : undefined;
  const notifications =
    canQuery && !isError ? recordsPendingNotifications(data?.recentPending ?? []) : [];

  if (isPortalLoginPath(pathname)) {
    return <Outlet />;
  }

  if (sessionReady && user && !isRecordsRole(user.role)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg font-medium">Wrong account for Records</p>
        <p className="max-w-md text-sm text-muted-foreground">
          No Records session found. Log in at <strong>{RECORDS_LOGIN}</strong> with{" "}
          <strong>records@nmp.gov.ph</strong> (this does not affect Admin or Client tabs).
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => logout()}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Sign out
          </button>
          <Link to={RECORDS_LOGIN} className="rounded-md border px-4 py-2 text-sm">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <DashboardShell
      portalTitle="Record Admin"
      notifications={notifications}
      notificationsLoading={notificationsLoading && canQuery}
      notificationsViewAllTo={RECORDS_PENDING}
      notificationsEmptyMessage="No forms waiting for review"
      nav={[
        { to: RECORDS_DASHBOARD, label: "Dashboard", icon: LayoutDashboard },
        { to: RECORDS_PENDING, label: "Pending Forms", icon: Clock, badge: pendingCount },
        { to: RECORDS_PUBLISHED, label: "Published Forms", icon: BookOpen },
        { to: RECORDS_ACTIVITY, label: "Activity Logs", icon: History },
      ]}
    >
      <Outlet />
    </DashboardShell>
  );
}

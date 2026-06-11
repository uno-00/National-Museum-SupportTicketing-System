import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { api } from "@/lib/api/client";
import { ensurePortalRole } from "@/lib/portal-guard";
import { useRecordsSession } from "@/lib/use-portal-session";
import {
  LOGIN,
  RECORDS_ACTIVITY,
  RECORDS_DASHBOARD,
  RECORDS_PENDING,
  RECORDS_PUBLISHED,
  isRecordsRole,
} from "@/lib/navigation";

export const Route = createFileRoute("/records")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    await ensurePortalRole(isRecordsRole, "records");
    if (location.pathname === "/records" || location.pathname === "/records/") {
      throw redirect({ to: RECORDS_DASHBOARD, replace: true });
    }
  },
  component: RecordsLayout,
});

function RecordsLayout() {
  const { user, sessionReady, logout, canQuery } = useRecordsSession();

  const { data, isError } = useQuery({
    queryKey: ["records-dashboard"],
    queryFn: () => api.recordsDashboard(),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 15_000,
    staleTime: 0,
    enabled: canQuery,
  });

  const pendingCount = canQuery && !isError ? data?.pendingCount : undefined;

  if (sessionReady && user && !isRecordsRole(user.role)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg font-medium">Wrong account for Records</p>
        <p className="max-w-md text-sm text-muted-foreground">
          No Records session found. Log in at <strong>/login</strong> with{" "}
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
          <Link to={LOGIN} className="rounded-md border px-4 py-2 text-sm">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <DashboardShell
      portalTitle="Record Admin"
      notificationCount={pendingCount}
      nav={[
        { to: RECORDS_DASHBOARD, label: "Dashboard" },
        { to: RECORDS_PENDING, label: "Pending Forms", badge: pendingCount },
        { to: RECORDS_PUBLISHED, label: "Published Forms" },
        { to: RECORDS_ACTIVITY, label: "Activity Logs" },
      ]}
    >
      <Outlet />
    </DashboardShell>
  );
}

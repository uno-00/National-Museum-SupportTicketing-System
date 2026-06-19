import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ClipboardCheck, FilePenLine, FileStack, RotateCcw } from "lucide-react";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import {
  ActionLink,
  DashboardAlert,
  DashboardHero,
  DataPanel,
  EmptyState,
  ListRow,
  StatCard,
  StatusBadge,
} from "@/components/layout/workspace-ui";
import { ADMIN_APPROVALS, ADMIN_FORMS, ADMIN_MY_FORMS } from "@/lib/navigation";
import { useAdminSession } from "@/lib/use-portal-session";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboardPage,
});

function formatToday() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function AdminDashboardPage() {
  const { user } = useAuth();
  const { canQuery } = useAdminSession();
  const { data: forms, isLoading: formsLoading } = useQuery({
    queryKey: ["my-forms"],
    queryFn: () => api.myForms(),
  });
  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ["admin-tickets-dashboard"],
    queryFn: () => api.listTickets({ status: "pending_approval", limit: "8" }, "admin"),
    enabled: canQuery,
  });

  const items = forms?.items ?? [];
  const pendingForms = items.filter((f) => f.status === "pending_review").length;
  const draftForms = items.filter((f) => f.status === "draft").length;
  const publishedForms = items.filter((f) => f.status === "published").length;
  const disapprovedForms = items.filter((f) => f.status === "disapproved");
  const pendingTickets = tickets?.items ?? [];
  const firstName = user?.name?.split(" ")[0];

  return (
    <div className="page-shell">
      <DashboardHero
        eyebrow="Admin portal"
        title={firstName ? `Good day, ${firstName}` : "Admin Dashboard"}
        description="Build TA forms, route them through Records, and approve incoming client requests."
        meta={<p className="text-xs text-muted-foreground">{formatToday()}</p>}
      />

      {disapprovedForms.length > 0 ? (
        <DashboardAlert
          tone="danger"
          title={`${disapprovedForms.length} form${disapprovedForms.length === 1 ? "" : "s"} need revision`}
          action={
            <ActionLink to={ADMIN_MY_FORMS} variant="outline">
              Open My Forms
            </ActionLink>
          }
        >
          <ul className="space-y-2">
            {disapprovedForms.slice(0, 3).map((f) => (
              <li key={f._id} className="flex gap-2 text-sm">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <span>
                  <span className="font-medium text-foreground">{f.title}</span>
                  <span className="text-muted-foreground"> — {f.reviewRemarks?.trim() || "No remarks provided"}</span>
                </span>
              </li>
            ))}
          </ul>
          {disapprovedForms.length > 3 ? (
            <p className="mt-2 text-xs">+{disapprovedForms.length - 3} more in My Forms</p>
          ) : null}
        </DashboardAlert>
      ) : (
        <DashboardAlert tone="info" title="Form workflow reminder">
          Submit new forms to Records for review. Once published, clients can use them to file requests.
        </DashboardAlert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Draft forms"
          value={draftForms}
          hint="Not yet sent to Records"
          to={ADMIN_MY_FORMS}
          icon={FilePenLine}
          loading={formsLoading}
        />
        <StatCard
          label="Pending review"
          value={pendingForms}
          hint="Waiting on Records"
          to={ADMIN_MY_FORMS}
          icon={FileStack}
          accent="warning"
          loading={formsLoading}
        />
        <StatCard
          label="Needs revision"
          value={disapprovedForms.length}
          hint="Returned with remarks"
          to={ADMIN_MY_FORMS}
          icon={RotateCcw}
          accent="danger"
          loading={formsLoading}
        />
        <StatCard
          label="Requests to approve"
          value={tickets?.pendingCount ?? pendingTickets.length}
          hint="Client submissions"
          to={ADMIN_APPROVALS}
          icon={ClipboardCheck}
          accent="info"
          loading={ticketsLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard
          label="Published forms"
          value={publishedForms}
          hint="Live for client use"
          to={ADMIN_MY_FORMS}
          accent="success"
          loading={formsLoading}
        />
        <div className="dashboard-alert lg:col-span-2">
          <p className="text-sm font-medium text-foreground">Quick paths</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ActionLink to={ADMIN_FORMS}>Form Builder</ActionLink>
            <ActionLink to={ADMIN_MY_FORMS} variant="outline">
              My Forms
            </ActionLink>
            <ActionLink to={ADMIN_APPROVALS} variant="outline">
              Approvals
            </ActionLink>
          </div>
        </div>
      </div>

      <DataPanel
        title="Pending client requests"
        action={
          pendingTickets.length > 0 ? (
            <ActionLink to={ADMIN_APPROVALS} variant="outline">
              View all
            </ActionLink>
          ) : undefined
        }
      >
        {ticketsLoading ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">Loading requests…</p>
        ) : pendingTickets.length === 0 ? (
          <EmptyState
            title="No pending approvals"
            description="New client requests will appear here when submitted against published forms."
          />
        ) : (
          <ul className="divide-y divide-border/80">
            {pendingTickets.map((t) => (
              <ListRow
                key={t._id}
                title={t.formTitle}
                subtitle={`${t.ticketNumber} · ${t.creatorName}${t.division ? ` · ${t.division}` : ""}`}
                trailing={<StatusBadge status={t.status} />}
                action={
                  <Link
                    to="/admin/requests/$ticketId"
                    params={{ ticketId: t._id }}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shadow-sm")}
                  >
                    Review
                  </Link>
                }
              />
            ))}
          </ul>
        )}
      </DataPanel>
    </div>
  );
}

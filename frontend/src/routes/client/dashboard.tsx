import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock3, FilePlus2, Inbox, ListChecks } from "lucide-react";
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
import { CLIENT_REQUESTS, CLIENT_SUBMIT } from "@/lib/navigation";
import { cn, formatAssignedPersonnel } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export const Route = createFileRoute("/client/dashboard")({
  component: ClientDashboardPage,
});

function formatToday() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function ClientDashboardPage() {
  const { user } = useAuth();
  const { data: tickets, isLoading } = useQuery({
    queryKey: ["my-tickets"],
    queryFn: () => api.myTickets(),
  });

  const items = tickets?.items ?? [];
  const active = items.filter((t) => !["closed", "rejected"].includes(t.status)).length;
  const pending = items.filter((t) => t.status === "pending_approval").length;
  const completed = items.filter((t) => ["closed", "resolved"].includes(t.status)).length;
  const needsAction = items.filter((t) => ["resolved", "rejected"].includes(t.status)).length;
  const recent = [...items]
    .sort((a, b) => new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime())
    .slice(0, 6);
  const firstName = user?.name?.split(" ")[0];

  return (
    <div className="page-shell">
      <DashboardHero
        eyebrow="Client portal"
        title={firstName ? `Welcome back, ${firstName}` : "Your dashboard"}
        description="Track your technical assistance requests and submit new ones when you need support."
        meta={
          <p className="text-xs text-muted-foreground">
            {formatToday()}
            {user?.division ? ` · ${user.division}` : ""}
          </p>
        }
      />

      {needsAction > 0 ? (
        <DashboardAlert tone="warning" title="Action needed on your requests">
          Some requests need confirmation or follow-up. Open My Requests to review the latest status.
          <div className="mt-3">
            <ActionLink to={CLIENT_REQUESTS} variant="outline">
              Go to My Requests
            </ActionLink>
          </div>
        </DashboardAlert>
      ) : items.length === 0 ? (
        <DashboardAlert tone="info" title="Get started">
          Submit a request using a published TA form. You can track progress here once it is filed.
          <div className="mt-3">
            <ActionLink to={CLIENT_SUBMIT}>Submit a request</ActionLink>
          </div>
        </DashboardAlert>
      ) : (
        <DashboardAlert tone="info" title="Your workspace">
          Active requests update automatically. Check back here or open My Requests for full details.
        </DashboardAlert>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Active requests"
          value={active}
          hint="In progress or pending"
          to={CLIENT_REQUESTS}
          icon={ListChecks}
          accent="info"
          loading={isLoading}
        />
        <StatCard
          label="Pending approval"
          value={pending}
          hint="Waiting for admin"
          to={CLIENT_REQUESTS}
          icon={Clock3}
          accent="warning"
          loading={isLoading}
        />
        <StatCard
          label="Completed"
          value={completed}
          hint="Resolved or closed"
          to={CLIENT_REQUESTS}
          icon={CheckCircle2}
          accent="success"
          loading={isLoading}
        />
      </div>

      <div className="dashboard-alert">
        <p className="text-sm font-medium text-foreground">Need something new?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a published form and submit your technical assistance request in a few steps.
        </p>
        <div className="mt-3">
          <ActionLink to={CLIENT_SUBMIT}>
            <span className="inline-flex items-center gap-2">
              <FilePlus2 className="h-4 w-4" />
              New request
            </span>
          </ActionLink>
        </div>
      </div>

      <DataPanel
        title="Recent requests"
        action={
          items.length > 0 ? (
            <ActionLink to={CLIENT_REQUESTS} variant="outline">
              View all
            </ActionLink>
          ) : undefined
        }
      >
        {isLoading ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">Loading your requests…</p>
        ) : recent.length === 0 ? (
          <EmptyState
            title="No requests yet"
            description="When you submit a technical assistance request, it will appear here with live status updates."
            action={
              <ActionLink to={CLIENT_SUBMIT}>
                <span className="inline-flex items-center gap-2">
                  <Inbox className="h-4 w-4" />
                  Submit your first request
                </span>
              </ActionLink>
            }
          />
        ) : (
          <ul className="divide-y divide-border/80">
            {recent.map((t) => (
              <ListRow
                key={t._id}
                title={t.formTitle}
                subtitle={`${t.ticketNumber} · ${formatAssignedPersonnel(t.assignedTo, "Unassigned")} · ${new Date(t.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}`}
                trailing={<StatusBadge status={t.status} />}
                action={
                  <Link
                    to="/client/requests/$ticketId"
                    params={{ ticketId: t._id }}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shadow-sm")}
                  >
                    View
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

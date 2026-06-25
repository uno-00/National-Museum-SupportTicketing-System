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
  PanelLoading,
  StatCard,
  StatusBadge,
} from "@/components/layout/workspace-ui";
import { CLIENT_FEEDBACK, CLIENT_REQUESTS, CLIENT_SUBMIT } from "@/lib/navigation";
import { countTicketsNeedingFeedback, ticketCanMarkComplete, ticketNeedsFeedback, ticketReadyToClose } from "@/lib/ticket-workflow";
import { getClientFeedbackUrl } from "@/lib/feedback-config";
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
  const completed = items.filter((t) => t.status === "closed").length;
  const needsFeedback = countTicketsNeedingFeedback(items);
  const canMarkComplete = items.filter(ticketCanMarkComplete).length;
  const feedbackTickets = items.filter(ticketNeedsFeedback);
  const firstFeedbackTicket = feedbackTickets[0];
  const feedbackUrl = firstFeedbackTicket ? getClientFeedbackUrl(firstFeedbackTicket) : null;
  const needsClose = items.filter(ticketReadyToClose).length;
  const needsAction =
    needsFeedback + needsClose + canMarkComplete + items.filter((t) => t.status === "rejected").length;
  const recent = [...items]
    .sort(
      (a, b) =>
        new Date(b.updatedAt ?? b.createdAt).getTime() -
        new Date(a.updatedAt ?? a.createdAt).getTime(),
    )
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

      {needsFeedback > 0 ? (
        <DashboardAlert tone="warning" title="Service complete — submit feedback">
          {needsFeedback} request{needsFeedback === 1 ? "" : "s"} need your feedback after you marked
          the service complete.
          {feedbackUrl ? (
            <a
              href={feedbackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block break-all text-sm font-medium text-maroon hover:underline"
            >
              {feedbackUrl}
            </a>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {firstFeedbackTicket ? (
              <Link
                to="/client/requests/$ticketId"
                params={{ ticketId: firstFeedbackTicket._id }}
                className={cn(buttonVariants({ size: "sm" }), "shadow-sm")}
              >
                Open request & submit feedback
              </Link>
            ) : null}
            <ActionLink to={CLIENT_FEEDBACK} variant="outline">
              All feedback requests
            </ActionLink>
          </div>
        </DashboardAlert>
      ) : canMarkComplete > 0 ? (
        <DashboardAlert tone="info" title="Mark service complete">
          {canMarkComplete} request{canMarkComplete === 1 ? "" : "s"} may be ready to mark complete.
          Open the request when ICT work is finished, then submit feedback and close the ticket.
          <div className="mt-3">
            <ActionLink to={CLIENT_REQUESTS}>Open my requests</ActionLink>
          </div>
        </DashboardAlert>
      ) : needsAction > 0 ? (
        <DashboardAlert tone="warning" title="Action needed on your requests">
          Some requests need follow-up. Open My Requests or Service Feedback to continue.
          <div className="mt-3 flex flex-wrap gap-2">
            <ActionLink to={CLIENT_REQUESTS} variant="outline">
              My Requests
            </ActionLink>
            {needsClose > 0 ? (
              <ActionLink to={CLIENT_REQUESTS} variant="outline">
                Close completed requests
              </ActionLink>
            ) : null}
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
          Active requests update automatically. Check back here or open My Requests for full
          details.
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
          hint="Closed requests"
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
          <PanelLoading label="Loading your requests…" />
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
                subtitle={`${t.ticketNumber} · ${formatAssignedPersonnel(t.assignedTo, "Unassigned")} · ${new Date(
                  t.createdAt,
                ).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}`}
                trailing={<StatusBadge status={t.status} />}
                action={
                  ticketNeedsFeedback(t) ? (
                    <Link
                      to="/client/requests/$ticketId"
                      params={{ ticketId: t._id }}
                      className={cn(buttonVariants({ size: "sm" }), "shadow-sm")}
                    >
                      Submit feedback
                    </Link>
                  ) : (
                    <Link
                      to="/client/requests/$ticketId"
                      params={{ ticketId: t._id }}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shadow-sm")}
                    >
                      View
                    </Link>
                  )
                }
              />
            ))}
          </ul>
        )}
      </DataPanel>
    </div>
  );
}

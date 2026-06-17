import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock3, FilePlus2, ListChecks } from "lucide-react";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import {
  ActionLink,
  DataPanel,
  EmptyState,
  StatCard,
  StatusBadge,
  WorkspacePageHeader,
} from "@/components/layout/workspace-ui";
import { CLIENT_REQUESTS, CLIENT_SUBMIT } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export const Route = createFileRoute("/client/dashboard")({
  component: ClientDashboardPage,
});

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
  const recent = [...items]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="page-shell">
      <WorkspacePageHeader
        title={`Welcome${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`}
        description="Your personal workspace — track active requests, submit new ones, and follow progress in one place."
        actions={
          <>
            <ActionLink to={CLIENT_SUBMIT}>New request</ActionLink>
            <ActionLink to={CLIENT_REQUESTS} variant="outline">
              My requests
            </ActionLink>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active requests" value={active} icon={ListChecks} loading={isLoading} />
        <StatCard label="Pending approval" value={pending} icon={Clock3} loading={isLoading} />
        <StatCard label="Completed" value={completed} icon={CheckCircle2} loading={isLoading} />
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
                  <FilePlus2 className="h-4 w-4" />
                  Submit your first request
                </span>
              </ActionLink>
            }
          />
        ) : (
          <ul className="divide-y divide-border/80">
            {recent.map((t) => (
              <li
                key={t._id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{t.formTitle}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t.ticketNumber} · {new Date(t.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={t.status} />
                  <Link
                    to="/client/requests/$ticketId"
                    params={{ ticketId: t._id }}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shadow-sm")}
                  >
                    View
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DataPanel>
    </div>
  );
}

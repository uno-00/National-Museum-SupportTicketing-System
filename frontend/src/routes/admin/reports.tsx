import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, CheckCircle2, MessageSquare, Ticket } from "lucide-react";
import { StatCard, WorkspacePageHeader } from "@/components/layout/workspace-ui";
import { api } from "@/lib/api/client";
import { useAdminSession } from "@/lib/use-portal-session";

export const Route = createFileRoute("/admin/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const { canQuery } = useAdminSession();
  const { data: tickets, isLoading } = useQuery({
    queryKey: ["report-tickets"],
    queryFn: () => api.listTickets({ limit: "100" }, "admin"),
    enabled: canQuery,
  });

  const items = tickets?.items ?? [];
  const closed = items.filter((t) => t.status === "closed").length;
  const withFeedback = items.filter((t) => t.feedbackSubmitted).length;
  const pending = items.filter((t) => t.status === "pending_approval").length;

  return (
    <div className="page-shell">
      <WorkspacePageHeader
        title="Reports & Analytics"
        description="Overview of request volume, completion, and client feedback across the TARF workflow."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total requests"
          value={tickets?.total ?? 0}
          hint="All client submissions"
          icon={Ticket}
          loading={isLoading}
        />
        <StatCard
          label="Pending approval"
          value={pending}
          hint="Awaiting admin review"
          icon={BarChart3}
          loading={isLoading}
        />
        <StatCard
          label="Closed"
          value={closed}
          hint="Fully resolved requests"
          icon={CheckCircle2}
          loading={isLoading}
        />
        <StatCard
          label="With feedback"
          value={withFeedback}
          hint="Clients who rated service"
          icon={MessageSquare}
          loading={isLoading}
        />
      </div>
    </div>
  );
}

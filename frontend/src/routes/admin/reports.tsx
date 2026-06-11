import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export const Route = createFileRoute("/admin/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const { data: tickets } = useQuery({ queryKey: ["report-tickets"], queryFn: () => api.listTickets({ limit: "100" }) });
  const closed = tickets?.items.filter((t) => t.status === "closed").length ?? 0;
  const withFeedback = tickets?.items.filter((t) => t.feedbackSubmitted).length ?? 0;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Reports & Analytics</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border p-5"><p className="text-sm text-muted-foreground">Total requests</p><p className="text-3xl font-semibold">{tickets?.total ?? 0}</p></div>
        <div className="rounded-lg border p-5"><p className="text-sm text-muted-foreground">Closed</p><p className="text-3xl font-semibold">{closed}</p></div>
        <div className="rounded-lg border p-5"><p className="text-sm text-muted-foreground">With feedback</p><p className="text-3xl font-semibold">{withFeedback}</p></div>
      </div>
    </div>
  );
}

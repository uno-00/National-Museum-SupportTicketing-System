import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { CLIENT_FORMS, CLIENT_REQUESTS, CLIENT_SUBMIT } from "@/lib/navigation";

export const Route = createFileRoute("/client/dashboard")({
  component: ClientDashboardPage,
});

function ClientDashboardPage() {
  const { data: forms } = useQuery({ queryKey: ["published-forms"], queryFn: () => api.publishedForms() });
  const { data: tickets } = useQuery({ queryKey: ["my-tickets"], queryFn: () => api.myTickets() });

  const open = tickets?.items.filter((t) => !["closed", "rejected"].includes(t.status)).length ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link to={CLIENT_FORMS} className="rounded-lg border p-5 hover:border-maroon/40">
          <p className="text-sm text-muted-foreground">Available forms</p>
          <p className="text-3xl font-semibold">{forms?.items.length ?? 0}</p>
        </Link>
        <Link to={CLIENT_REQUESTS} className="rounded-lg border p-5 hover:border-maroon/40">
          <p className="text-sm text-muted-foreground">Active requests</p>
          <p className="text-3xl font-semibold">{open}</p>
        </Link>
      </div>
      <Link to={CLIENT_SUBMIT} className="inline-block rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
        Submit a request
      </Link>
    </div>
  );
}

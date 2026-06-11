import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { ADMIN_APPROVALS, ADMIN_FORMS, ADMIN_MY_FORMS } from "@/lib/navigation";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const { data: forms } = useQuery({ queryKey: ["my-forms"], queryFn: () => api.myForms() });
  const { data: tickets } = useQuery({ queryKey: ["admin-tickets"], queryFn: () => api.listTickets({ limit: "5" }) });

  const pendingForms = forms?.items.filter((f) => f.status === "pending_review").length ?? 0;
  const draftForms = forms?.items.filter((f) => f.status === "draft").length ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        After you <strong>Submit to Records</strong>, open the Records portal (new tab) as{" "}
        <strong>records@nmp.gov.ph</strong> → Pending Forms. Admin stays signed in.
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Draft forms" value={draftForms} to={ADMIN_MY_FORMS} />
        <StatCard label="Pending review" value={pendingForms} to={ADMIN_MY_FORMS} />
        <StatCard label="Requests to approve" value={tickets?.pendingCount ?? 0} to={ADMIN_APPROVALS} />
      </div>
      <div className="rounded-lg border bg-card p-4">
        <h2 className="font-medium">Quick actions</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to={ADMIN_FORMS} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
            Create new form
          </Link>
          <Link to={ADMIN_APPROVALS} className="rounded-md border px-4 py-2 text-sm">
            Review client requests
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, to }: { label: string; value: number; to: string }) {
  return (
    <Link to={to} className="rounded-lg border bg-card p-5 transition hover:border-maroon/40">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
    </Link>
  );
}

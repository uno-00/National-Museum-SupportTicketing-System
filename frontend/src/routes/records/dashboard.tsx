import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { api } from "@/lib/api/client";
import type { FormStatus } from "@/lib/api/types";
import { RECORDS_PENDING, RECORDS_PUBLISHED } from "@/lib/navigation";
import { useRecordsSession } from "@/lib/use-portal-session";

export const Route = createFileRoute("/records/dashboard")({
  component: RecordsDashboardPage,
});

const STATUS: Record<FormStatus, string> = {
  draft: "Draft",
  pending_review: "For Review",
  published: "Published",
  disapproved: "Disapproved",
};

function RecordsDashboardPage() {
  const { canQuery } = useRecordsSession();
  const { data, isLoading } = useQuery({
    queryKey: ["records-dashboard"],
    queryFn: () => api.recordsDashboard(),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 15_000,
    staleTime: 0,
    enabled: canQuery,
  });

  const pending = data?.recentPending ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link to={RECORDS_PENDING} className="rounded-lg border p-5 hover:border-maroon/40">
          <p className="text-sm text-muted-foreground">Pending review</p>
          <p className="text-3xl font-semibold">{data?.pendingCount ?? 0}</p>
        </Link>
        <Link to={RECORDS_PUBLISHED} className="rounded-lg border p-5 hover:border-maroon/40">
          <p className="text-sm text-muted-foreground">Published forms</p>
          <p className="text-3xl font-semibold">{data?.publishedCount ?? 0}</p>
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <div className="border-b bg-muted/40 px-4 py-3 text-sm font-medium">Recent pending forms</div>
        {isLoading ? (
          <p className="px-4 py-8 text-center text-muted-foreground">Loading…</p>
        ) : pending.length === 0 ? (
          <p className="px-4 py-8 text-center text-muted-foreground">No forms awaiting review.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">No.</th>
                <th className="px-4 py-3">Form Description</th>
                <th className="px-4 py-3">Division / Section</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((row, i) => (
                <tr key={row._id} className="border-t">
                  <td className="px-4 py-3">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">{row.title}</td>
                  <td className="px-4 py-3">{row.department ?? row.createdBy?.division ?? "—"}</td>
                  <td className="px-4 py-3">{STATUS[row.status]}</td>
                  <td className="px-4 py-3">
                    <Link
                      to="/records/forms/$formId"
                      params={{ formId: row._id }}
                      className="inline-flex rounded-md p-2 text-maroon hover:bg-maroon/10"
                    >
                      <FileText className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

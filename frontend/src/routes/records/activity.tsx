import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useRecordsSession } from "@/lib/use-portal-session";

export const Route = createFileRoute("/records/activity")({
  component: ActivityLogsPage,
});

function ActivityLogsPage() {
  const { canQuery } = useRecordsSession();
  const { data, isLoading } = useQuery({
    queryKey: ["records-activity"],
    queryFn: () => api.recordsActivity(),
    enabled: canQuery,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Activity Logs</h1>
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Summary</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center">Loading…</td></tr>
            ) : (data?.items ?? []).length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No activity yet.</td></tr>
            ) : (
              data?.items.map((a) => (
                <tr key={a._id} className="border-t">
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(a.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">{a.actorName}</td>
                  <td className="px-4 py-3 capitalize">{a.action.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3">{a.summary}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

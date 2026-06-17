import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  DataPanel,
  EmptyState,
  LoadingRows,
  WorkspacePageHeader,
} from "@/components/layout/workspace-ui";
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

  const items = data?.items ?? [];

  return (
    <div className="page-shell">
      <WorkspacePageHeader
        title="Activity Logs"
        description="Audit trail of form reviews, publications, and other Records actions."
      />

      <DataPanel title={`${items.length} recent event${items.length === 1 ? "" : "s"}`}>
        <div className="overflow-x-auto">
          <table className="data-table w-full text-sm">
            <thead className="text-left">
              <tr>
                <th className="px-4 py-3 sm:px-5">When</th>
                <th className="px-4 py-3 sm:px-5">Actor</th>
                <th className="px-4 py-3 sm:px-5">Action</th>
                <th className="px-4 py-3 sm:px-5">Summary</th>
              </tr>
            </thead>
            <tbody>
              {!canQuery || isLoading ? (
                <LoadingRows cols={4} />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <EmptyState title="No activity yet" description="Actions will be logged here as they occur." />
                  </td>
                </tr>
              ) : (
                items.map((a) => (
                  <tr key={a._id} className="border-t border-border/70">
                    <td className="px-4 py-3.5 sm:px-5 text-muted-foreground">
                      {new Date(a.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 sm:px-5">{a.actorName}</td>
                    <td className="px-4 py-3.5 sm:px-5 capitalize">{a.action.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3.5 sm:px-5">{a.summary}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DataPanel>
    </div>
  );
}

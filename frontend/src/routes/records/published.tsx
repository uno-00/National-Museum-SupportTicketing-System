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

export const Route = createFileRoute("/records/published")({
  component: PublishedFormsPage,
});

function PublishedFormsPage() {
  const { canQuery } = useRecordsSession();
  const { data, isLoading } = useQuery({
    queryKey: ["records-published"],
    queryFn: () => api.recordsForms({ status: "published" }),
    enabled: canQuery,
  });

  const items = data?.items ?? [];

  return (
    <div className="page-shell">
      <WorkspacePageHeader
        title="Published Forms"
        description="Live TA forms available for clients to submit requests."
      />

      <DataPanel title={`${items.length} published form${items.length === 1 ? "" : "s"}`}>
        <div className="overflow-x-auto">
          <table className="data-table w-full text-sm">
            <thead className="text-left">
              <tr>
                <th className="px-4 py-3 sm:px-5">Form</th>
                <th className="px-4 py-3 sm:px-5">Ref</th>
                <th className="px-4 py-3 sm:px-5">Effectivity</th>
                <th className="px-4 py-3 sm:px-5">Version</th>
              </tr>
            </thead>
            <tbody>
              {!canQuery || isLoading ? (
                <LoadingRows cols={4} />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <EmptyState
                      title="No published forms"
                      description="Approved forms from Pending Forms will appear here once published."
                    />
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row._id} className="border-t border-border/70">
                    <td className="px-4 py-3.5 sm:px-5 font-medium">{row.title}</td>
                    <td className="px-4 py-3.5 sm:px-5 font-mono text-xs text-muted-foreground">
                      {row.refNumber}
                    </td>
                    <td className="px-4 py-3.5 sm:px-5">{row.effectivity}</td>
                    <td className="px-4 py-3.5 sm:px-5 text-muted-foreground">{row.version}</td>
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

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  DataPanel,
  EmptyState,
  LoadingRows,
  StatusBadge,
  WorkspacePageHeader,
} from "@/components/layout/workspace-ui";
import { api } from "@/lib/api/client";
import { useAdminSession } from "@/lib/use-portal-session";

export const Route = createFileRoute("/admin/assigned/")({
  component: AssignedRequestsPage,
});

function AssignedRequestsPage() {
  const { canQuery } = useAdminSession();
  const { data, isLoading } = useQuery({
    queryKey: ["assigned-tickets"],
    queryFn: () => api.listAssignedTickets("admin"),
    enabled: canQuery,
    refetchOnMount: "always",
    staleTime: 0,
  });

  const items = data?.items ?? [];

  return (
    <div className="page-shell">
      <WorkspacePageHeader
        title="My Assigned Requests"
        description="Requests assigned to you. When ICT work is finished, the client marks the service complete, submits feedback, and closes the request."
      />

      <DataPanel title={`${items.length} active assignment${items.length === 1 ? "" : "s"}`}>
        <div className="overflow-x-auto">
          <table className="data-table w-full text-sm">
            <thead className="text-left">
              <tr>
                <th className="px-4 py-3 sm:px-5">Ticket</th>
                <th className="px-4 py-3 sm:px-5">Client</th>
                <th className="px-4 py-3 sm:px-5">Status</th>
                <th className="px-4 py-3 sm:px-5">Action</th>
              </tr>
            </thead>
            <tbody>
              {!canQuery || isLoading ? (
                <LoadingRows cols={4} />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <EmptyState
                      title="No assigned requests"
                      description="When an admin assigns you to a request, it will appear here as In Progress."
                    />
                  </td>
                </tr>
              ) : (
                items.map((t) => (
                  <tr key={t._id} className="border-t border-border/70">
                    <td className="px-4 py-3.5 sm:px-5">
                      <Link
                        to="/admin/requests/$ticketId"
                        params={{ ticketId: t._id }}
                        className="font-medium text-maroon hover:underline"
                      >
                        {t.ticketNumber}
                      </Link>
                      <p className="text-xs text-muted-foreground">{t.formTitle}</p>
                    </td>
                    <td className="px-4 py-3.5 sm:px-5">{t.creatorName}</td>
                    <td className="px-4 py-3.5 sm:px-5">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3.5 sm:px-5">
                      <Link
                        to="/admin/requests/$ticketId"
                        params={{ ticketId: t._id }}
                        className="text-sm font-medium text-maroon hover:underline"
                      >
                        Open →
                      </Link>
                    </td>
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

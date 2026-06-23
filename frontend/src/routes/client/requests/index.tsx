import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import {
  ActionLink,
  DataPanel,
  EmptyState,
  LoadingRows,
  StatusBadge,
  WorkspacePageHeader,
} from "@/components/layout/workspace-ui";
import { CLIENT_DASHBOARD, CLIENT_SUBMIT } from "@/lib/navigation";
import { cn, formatAssignedPersonnel } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export const Route = createFileRoute("/client/requests/")({
  component: MyRequestsPage,
});

function MyRequestsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-tickets"],
    queryFn: () => api.myTickets(),
  });

  const items = data?.items ?? [];

  return (
    <div className="page-shell">
      <WorkspacePageHeader
        title="My Requests"
        description="All tickets linked to your account. Only you can view and manage these submissions."
        actions={<ActionLink to={CLIENT_SUBMIT}>New request</ActionLink>}
      />

      <DataPanel title={`${items.length} request${items.length === 1 ? "" : "s"}`}>
        <div className="overflow-x-auto">
          <table className="data-table w-full text-sm">
            <thead className="text-left">
              <tr>
                <th className="px-4 py-3 sm:px-5">Ticket</th>
                <th className="px-4 py-3 sm:px-5">Form</th>
                <th className="px-4 py-3 sm:px-5">Status</th>
                <th className="px-4 py-3 sm:px-5">Assigned to</th>
                <th className="px-4 py-3 sm:px-5">Submitted</th>
                <th className="px-4 py-3 sm:px-5">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <LoadingRows />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      title="No requests yet"
                      description="Start by choosing a published form and submitting your technical assistance request."
                      action={
                        <div className="flex flex-wrap justify-center gap-2">
                          <ActionLink to={CLIENT_SUBMIT}>Submit request</ActionLink>
                          <ActionLink to={CLIENT_DASHBOARD} variant="outline">
                            Back to dashboard
                          </ActionLink>
                        </div>
                      }
                    />
                  </td>
                </tr>
              ) : (
                items.map((t) => (
                  <tr key={t._id} className="border-t border-border/70">
                    <td className="px-4 py-3.5 font-mono text-xs sm:px-5">{t.ticketNumber}</td>
                    <td className="px-4 py-3.5 font-medium sm:px-5">{t.formTitle}</td>
                    <td className="px-4 py-3.5 sm:px-5">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3.5 text-sm text-muted-foreground sm:px-5">
                      {formatAssignedPersonnel(t.assignedTo)}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground sm:px-5">
                      {new Date(t.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3.5 sm:px-5">
                      <Link
                        to="/client/requests/$ticketId"
                        params={{ ticketId: t._id }}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "shadow-sm",
                        )}
                      >
                        View details
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

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText, FolderOpen } from "lucide-react";
import { api } from "@/lib/api/client";
import type { FormStatus } from "@/lib/api/types";
import {
  ActionLink,
  DataPanel,
  EmptyState,
  StatCard,
  WorkspacePageHeader,
} from "@/components/layout/workspace-ui";
import { RECORDS_PENDING, RECORDS_PUBLISHED } from "@/lib/navigation";
import { useRecordsSession } from "@/lib/use-portal-session";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

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
    <div className="page-shell">
      <WorkspacePageHeader
        title="Records Dashboard"
        description="Review admin-submitted forms and publish approved TA forms for client use."
        actions={
          <>
            <ActionLink to={RECORDS_PENDING}>Pending forms</ActionLink>
            <ActionLink to={RECORDS_PUBLISHED} variant="outline">
              Published forms
            </ActionLink>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Pending review"
          value={data?.pendingCount ?? 0}
          to={RECORDS_PENDING}
          icon={FileText}
          loading={isLoading}
        />
        <StatCard
          label="Published forms"
          value={data?.publishedCount ?? 0}
          to={RECORDS_PUBLISHED}
          icon={FolderOpen}
          loading={isLoading}
        />
      </div>

      <DataPanel
        title="Recent pending forms"
        action={
          pending.length > 0 ? (
            <ActionLink to={RECORDS_PENDING} variant="outline">
              View all
            </ActionLink>
          ) : undefined
        }
      >
        {isLoading ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">Loading forms…</p>
        ) : pending.length === 0 ? (
          <EmptyState
            title="No forms awaiting review"
            description="When admins submit forms for review, they will appear here for approval or disapproval."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead className="text-left">
                <tr>
                  <th className="px-4 py-3 sm:px-5">No.</th>
                  <th className="px-4 py-3 sm:px-5">Form description</th>
                  <th className="px-4 py-3 sm:px-5">Division / section</th>
                  <th className="px-4 py-3 sm:px-5">Status</th>
                  <th className="px-4 py-3 sm:px-5">Action</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((row, i) => (
                  <tr key={row._id} className="border-t border-border/70">
                    <td className="px-4 py-3.5 sm:px-5">{i + 1}</td>
                    <td className="px-4 py-3.5 font-medium sm:px-5">{row.title}</td>
                    <td className="px-4 py-3.5 sm:px-5">
                      {row.department ?? row.createdBy?.division ?? "—"}
                    </td>
                    <td className="px-4 py-3.5 sm:px-5">{STATUS[row.status]}</td>
                    <td className="px-4 py-3.5 sm:px-5">
                      <Link
                        to="/records/forms/$formId"
                        params={{ formId: row._id }}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shadow-sm")}
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DataPanel>
    </div>
  );
}

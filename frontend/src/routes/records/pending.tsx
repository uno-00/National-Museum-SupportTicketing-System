import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DataPanel,
  EmptyState,
  LoadingRows,
  WorkspacePageHeader,
} from "@/components/layout/workspace-ui";
import { FormPdfViewerDialog } from "@/components/records/FormPdfViewerDialog";
import { api, ApiError } from "@/lib/api/client";
import { LOGIN } from "@/lib/navigation";
import { useRecordsSession } from "@/lib/use-portal-session";

export const Route = createFileRoute("/records/pending")({
  component: PendingFormsPage,
});

function PendingFormsPage() {
  const { user, logout, canQuery } = useRecordsSession();
  const [search, setSearch] = useState("");
  const [viewForm, setViewForm] = useState<{ id: string; title: string; refNumber: string } | null>(
    null,
  );

  const { data, isLoading, refetch, isFetching, isError, error } = useQuery({
    queryKey: ["records-pending", search],
    queryFn: () => api.recordsForms({ status: "pending_review", ...(search ? { search } : {}) }),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 10_000,
    staleTime: 0,
    enabled: canQuery,
    retry: 1,
  });

  const errorMessage =
    error instanceof ApiError && error.status === 403
      ? user
        ? `Records session missing or expired. Log in at ${LOGIN}.`
        : `Access denied — log in with your Records account at ${LOGIN}.`
      : error instanceof Error
        ? error.message
        : "Could not load pending forms.";

  const items = data?.items ?? [];

  return (
    <div className="page-shell">
      <WorkspacePageHeader
        title="Pending Forms"
        description="Forms submitted by Admin with status Pending Review — approve or disapprove before publishing."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={!canQuery || isFetching}
          >
            {isFetching ? "Refreshing…" : "Refresh"}
          </Button>
        }
      />

      {isError ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p>{errorMessage}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs font-medium">
            <button type="button" onClick={() => logout()} className="underline">
              Sign out
            </button>
            <Link to={LOGIN} className="underline">
              Go to login
            </Link>
          </div>
        </div>
      ) : null}

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search form…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <DataPanel title={`${items.length} pending form${items.length === 1 ? "" : "s"}`}>
        <div className="overflow-x-auto">
          <table className="data-table w-full text-sm">
            <thead className="text-left">
              <tr>
                <th className="px-4 py-3 sm:px-5">Form</th>
                <th className="px-4 py-3 sm:px-5">Submitted by</th>
                <th className="px-4 py-3 sm:px-5">Submitted</th>
                <th className="px-4 py-3 sm:px-5">Ref</th>
                <th className="px-4 py-3 sm:px-5">Action</th>
              </tr>
            </thead>
            <tbody>
              {!canQuery || isLoading ? (
                <LoadingRows cols={5} />
              ) : isError ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      title="Unable to load forms"
                      description="Check your session and try again."
                    />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      title="No pending forms"
                      description='Admin must click "Send to Records" in Form Builder for forms to appear here.'
                    />
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row._id} className="border-t border-border/70">
                    <td className="px-4 py-3.5 sm:px-5 font-medium">{row.title}</td>
                    <td className="px-4 py-3.5 sm:px-5">{row.createdBy?.name ?? "—"}</td>
                    <td className="px-4 py-3.5 sm:px-5 text-muted-foreground">
                      {new Date(row.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3.5 sm:px-5 font-mono text-xs text-muted-foreground">
                      {row.refNumber}
                    </td>
                    <td className="px-4 py-3.5 sm:px-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setViewForm({ id: row._id, title: row.title, refNumber: row.refNumber })
                          }
                        >
                          <FileText className="mr-1.5 h-3.5 w-3.5" />
                          View file
                        </Button>
                        <Link
                          to="/records/forms/$formId"
                          params={{ formId: row._id }}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-maroon hover:underline"
                        >
                          Review
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DataPanel>

      <FormPdfViewerDialog
        formId={viewForm?.id ?? null}
        formTitle={viewForm?.title}
        refNumber={viewForm?.refNumber}
        open={Boolean(viewForm)}
        onOpenChange={(open) => {
          if (!open) setViewForm(null);
        }}
      />
    </div>
  );
}

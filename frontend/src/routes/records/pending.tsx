import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { api, ApiError } from "@/lib/api/client";
import { LOGIN } from "@/lib/navigation";
import { useRecordsSession } from "@/lib/use-portal-session";

export const Route = createFileRoute("/records/pending")({
  component: PendingFormsPage,
});

function PendingFormsPage() {
  const { user, logout, canQuery } = useRecordsSession();
  const [search, setSearch] = useState("");

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
        ? `Records session missing or expired. Log in at /login with records@nmp.gov.ph / records123.`
        : "Access denied — log in with records@nmp.gov.ph at /login."
      : error instanceof Error
        ? error.message
        : "Could not load pending forms.";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Pending Forms</h1>
          <p className="text-sm text-muted-foreground">
            Forms submitted by Admin with status <strong>Pending Review</strong>.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          className="text-sm text-maroon hover:underline"
        >
          {isFetching ? "Refreshing…" : "Refresh"}
        </button>
      </div>

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

      <Input placeholder="Search form…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">No.</th>
              <th className="px-4 py-3">Form Description</th>
              <th className="px-4 py-3">Submitted by</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center">Loading…</td></tr>
            ) : isError ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Unable to load forms.</td></tr>
            ) : (data?.items ?? []).length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No pending forms yet. Admin must click <strong>Submit to Records</strong> in Form Builder.
                </td>
              </tr>
            ) : (
              data?.items.map((row, i) => (
                <tr key={row._id} className="border-t">
                  <td className="px-4 py-3">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">{row.title}</td>
                  <td className="px-4 py-3">{row.createdBy?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Link to="/records/forms/$formId" params={{ formId: row._id }} className="text-maroon hover:underline">
                      <FileText className="inline h-4 w-4" /> Review
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

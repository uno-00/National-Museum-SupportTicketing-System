import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Clock, FileText, FolderOpen } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth";
import {
  ActionLink,
  DashboardAlert,
  DashboardHero,
  DataPanel,
  EmptyState,
  FormStatusBadge,
  ListRow,
  StatCard,
} from "@/components/layout/workspace-ui";
import { FormPdfViewerDialog } from "@/components/records/FormPdfViewerDialog";
import { RECORDS_ACTIVITY, RECORDS_PENDING, RECORDS_PUBLISHED } from "@/lib/navigation";
import { useRecordsSession } from "@/lib/use-portal-session";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";

export const Route = createFileRoute("/records/dashboard")({
  component: RecordsDashboardPage,
});

function formatToday() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function RecordsDashboardPage() {
  const { user } = useAuth();
  const { canQuery } = useRecordsSession();
  const [viewForm, setViewForm] = useState<{ id: string; title: string; refNumber: string } | null>(
    null,
  );
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
  const recentActivity = data?.activities?.slice(0, 4) ?? [];
  const firstName = user?.name?.split(" ")[0];
  const pendingCount = data?.pendingCount ?? 0;

  return (
    <div className="page-shell">
      <DashboardHero
        eyebrow="Records portal"
        title={firstName ? `Welcome, ${firstName}` : "Records Dashboard"}
        description="Review admin-submitted forms and publish approved TA forms for client use."
        meta={<p className="text-xs text-muted-foreground">{formatToday()}</p>}
      />

      {pendingCount > 0 ? (
        <DashboardAlert
          tone="warning"
          title={`${pendingCount} form${pendingCount === 1 ? "" : "s"} awaiting review`}
        >
          Open Pending Forms to approve or return forms to Admin with remarks.
        </DashboardAlert>
      ) : (
        <DashboardAlert tone="info" title="All caught up">
          No forms are waiting for review right now. Published forms remain available to clients.
        </DashboardAlert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Pending review"
          value={pendingCount}
          hint="Needs your decision"
          to={RECORDS_PENDING}
          icon={FileText}
          accent="warning"
          loading={isLoading}
        />
        <StatCard
          label="Published forms"
          value={data?.publishedCount ?? 0}
          hint="Available to clients"
          to={RECORDS_PUBLISHED}
          icon={FolderOpen}
          accent="success"
          loading={isLoading}
        />
        <StatCard
          label="Activity logs"
          value={recentActivity.length > 0 ? "Recent" : "—"}
          hint="Latest review actions"
          to={RECORDS_ACTIVITY}
          icon={BookOpen}
          accent="info"
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
          <ul className="divide-y divide-border/80">
            {pending.map((row) => (
              <ListRow
                key={row._id}
                title={row.title}
                subtitle={`${row.refNumber} · ${row.createdBy?.name ?? "Admin"} · ${row.department ?? row.createdBy?.division ?? "—"}`}
                trailing={<FormStatusBadge status={row.status} />}
                action={
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="shadow-sm"
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
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "shadow-sm",
                      )}
                    >
                      Review
                    </Link>
                  </div>
                }
              />
            ))}
          </ul>
        )}
      </DataPanel>

      {recentActivity.length > 0 ? (
        <DataPanel title="Latest activity">
          <ul className="divide-y divide-border/80">
            {recentActivity.map((a) => (
              <ListRow
                key={a._id}
                title={a.summary}
                subtitle={`${a.actorName} · ${new Date(a.createdAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}`}
                trailing={
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {a.action.replace(/_/g, " ")}
                  </span>
                }
              />
            ))}
          </ul>
        </DataPanel>
      ) : null}

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

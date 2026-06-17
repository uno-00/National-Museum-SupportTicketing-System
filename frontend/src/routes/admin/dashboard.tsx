import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck, FilePenLine, FileStack } from "lucide-react";
import { api } from "@/lib/api/client";
import {
  ActionLink,
  DataPanel,
  StatCard,
  WorkspacePageHeader,
} from "@/components/layout/workspace-ui";
import { ADMIN_APPROVALS, ADMIN_FORMS, ADMIN_MY_FORMS } from "@/lib/navigation";
import { useAdminSession } from "@/lib/use-portal-session";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const { canQuery } = useAdminSession();
  const { data: forms } = useQuery({ queryKey: ["my-forms"], queryFn: () => api.myForms() });
  const { data: tickets } = useQuery({
    queryKey: ["admin-tickets"],
    queryFn: () => api.listTickets({ limit: "5" }, "admin"),
    enabled: canQuery,
  });

  const pendingForms = forms?.items.filter((f) => f.status === "pending_review").length ?? 0;
  const draftForms = forms?.items.filter((f) => f.status === "draft").length ?? 0;

  return (
    <div className="page-shell">
      <WorkspacePageHeader
        title="Admin Dashboard"
        description="Create TA forms, submit them to Records, and manage incoming client requests."
        actions={
          <>
            <ActionLink to={ADMIN_FORMS}>Create form</ActionLink>
            <ActionLink to={ADMIN_APPROVALS} variant="outline">
              Review requests
            </ActionLink>
          </>
        }
      />

      <div className="notice-banner">
        After you <strong>Submit to Records</strong>, open the Records portal in a new tab as{" "}
        <strong>records@nmp.gov.ph</strong> → Pending Forms. Your Admin session stays signed in.
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Draft forms" value={draftForms} to={ADMIN_MY_FORMS} icon={FilePenLine} />
        <StatCard label="Pending review" value={pendingForms} to={ADMIN_MY_FORMS} icon={FileStack} />
        <StatCard
          label="Requests to approve"
          value={tickets?.pendingCount ?? 0}
          to={ADMIN_APPROVALS}
          icon={ClipboardCheck}
        />
      </div>

      <DataPanel title="Quick actions">
        <div className="flex flex-wrap gap-2 px-4 py-4 sm:px-5">
          <ActionLink to={ADMIN_FORMS}>Create new form</ActionLink>
          <ActionLink to={ADMIN_MY_FORMS} variant="outline">
            My forms
          </ActionLink>
          <ActionLink to={ADMIN_APPROVALS} variant="outline">
            Client approvals
          </ActionLink>
        </div>
      </DataPanel>
    </div>
  );
}

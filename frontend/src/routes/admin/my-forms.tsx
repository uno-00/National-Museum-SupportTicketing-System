import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ActionLink,
  DataPanel,
  EmptyState,
  FormStatusBadge,
  LoadingRows,
  WorkspacePageHeader,
} from "@/components/layout/workspace-ui";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import type { FormRecord } from "@/lib/api/types";
import { ensureAdminOnly } from "@/lib/admin-only-guard";
import { ADMIN_FORMS } from "@/lib/navigation";

export const Route = createFileRoute("/admin/my-forms")({
  beforeLoad: () => ensureAdminOnly(),
  component: MyFormsPage,
});

function MyFormsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["my-forms"], queryFn: () => api.myForms() });

  const submit = useMutation({
    mutationFn: (id: string) => api.submitFormForReview(id),
    onSuccess: (res) => {
      toast.success(`"${res.form.title}" sent to Records`);
      void qc.invalidateQueries({ queryKey: ["my-forms"] });
      void qc.invalidateQueries({ queryKey: ["records-dashboard"] });
      void qc.invalidateQueries({ queryKey: ["records-pending"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const items = data?.items ?? [];

  return (
    <div className="page-shell">
      <WorkspacePageHeader
        title="My Forms"
        description="Forms you created in the Form Builder. Send drafts to Records for review before they can be published."
        actions={<ActionLink to={ADMIN_FORMS}>+ New form</ActionLink>}
      />

      <div className="notice-banner">
        Only forms with status <strong>Pending Review</strong> appear in Records → Pending Forms.
      </div>

      <DataPanel title={`${items.length} form${items.length === 1 ? "" : "s"}`}>
        <div className="overflow-x-auto">
          <table className="data-table w-full text-sm">
            <thead className="text-left">
              <tr>
                <th className="px-4 py-3 sm:px-5">Title</th>
                <th className="px-4 py-3 sm:px-5">Ref</th>
                <th className="px-4 py-3 sm:px-5">Status</th>
                <th className="px-4 py-3 sm:px-5">Updated</th>
                <th className="px-4 py-3 sm:px-5">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <LoadingRows cols={5} />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      title="No forms yet"
                      description="Create a new TA form in the Form Builder to get started."
                      action={<ActionLink to={ADMIN_FORMS}>Open Form Builder</ActionLink>}
                    />
                  </td>
                </tr>
              ) : (
                items.map((f) => (
                  <FormRow
                    key={f._id}
                    form={f}
                    onSubmit={() => submit.mutate(f._id)}
                    submitting={submit.isPending}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </DataPanel>
    </div>
  );
}

function FormRow({
  form: f,
  onSubmit,
  submitting,
}: {
  form: FormRecord;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const canSubmit = f.status === "draft" || f.status === "disapproved";

  return (
    <tr className="border-t border-border/70">
      <td className="px-4 py-3.5 sm:px-5 font-medium">{f.title}</td>
      <td className="px-4 py-3.5 sm:px-5 font-mono text-xs text-muted-foreground">{f.refNumber}</td>
      <td className="px-4 py-3.5 sm:px-5">
        <FormStatusBadge status={f.status} />
      </td>
      <td className="px-4 py-3.5 sm:px-5 text-muted-foreground">
        {new Date(f.updatedAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3.5 sm:px-5">
        {canSubmit ? (
          <Button size="sm" onClick={onSubmit} disabled={submitting}>
            Send to Records
          </Button>
        ) : f.status === "pending_review" ? (
          <span className="text-xs text-muted-foreground">Awaiting Records</span>
        ) : null}
      </td>
    </tr>
  );
}

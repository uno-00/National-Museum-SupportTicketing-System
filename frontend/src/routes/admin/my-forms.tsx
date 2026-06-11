import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import type { FormRecord, FormStatus } from "@/lib/api/types";
import { ensureAdminOnly } from "@/lib/admin-only-guard";
import { ADMIN_FORMS } from "@/lib/navigation";

export const Route = createFileRoute("/admin/my-forms")({
  beforeLoad: () => ensureAdminOnly(),
  component: MyFormsPage,
});

const STATUS_LABEL: Record<FormStatus, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  published: "Published",
  disapproved: "Disapproved",
};

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Forms</h1>
        <Link to={ADMIN_FORMS} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
          + New form
        </Link>
      </div>
      <p className="text-sm text-muted-foreground">
        Only forms with status <strong>Pending Review</strong> appear in Records → Pending Forms.
      </p>
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Ref</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
            ) : (data?.items ?? []).length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No forms yet.</td></tr>
            ) : (
              data?.items.map((f) => (
                <FormRow key={f._id} form={f} onSubmit={() => submit.mutate(f._id)} submitting={submit.isPending} />
              ))
            )}
          </tbody>
        </table>
      </div>
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
    <tr className="border-t">
      <td className="px-4 py-3 font-medium">{f.title}</td>
      <td className="px-4 py-3 font-mono text-xs">{f.refNumber}</td>
      <td className="px-4 py-3">
        <span
          className={
            f.status === "pending_review"
              ? "font-medium text-amber-700"
              : f.status === "published"
                ? "text-green-700"
                : f.status === "disapproved"
                  ? "text-destructive"
                  : ""
          }
        >
          {STATUS_LABEL[f.status]}
        </span>
      </td>
      <td className="px-4 py-3 text-muted-foreground">{new Date(f.updatedAt).toLocaleDateString()}</td>
      <td className="px-4 py-3">
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

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  BackLink,
  DataPanel,
  FormStatusBadge,
  WorkspacePageHeader,
} from "@/components/layout/workspace-ui";
import { FormFieldsSummary } from "@/components/records/FormFieldsSummary";
import { FormUploadedFileViewer } from "@/components/records/FormUploadedFileViewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import type { FormReviewDecision } from "@/lib/api/types";
import { RECORDS_PENDING, RECORDS_PUBLISHED } from "@/lib/navigation";
import { useRecordsSession } from "@/lib/use-portal-session";

export const Route = createFileRoute("/records/forms/$formId")({
  component: FormReviewPage,
});

function FormReviewPage() {
  const { formId } = Route.useParams();
  const navigate = useNavigate();
  const { canQuery } = useRecordsSession();
  const qc = useQueryClient();
  const [decision, setDecision] = useState<FormReviewDecision>("approved");
  const [remarks, setRemarks] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["form-review", formId],
    queryFn: () => api.getRecordsForm(formId),
    enabled: canQuery,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const review = useMutation({
    mutationFn: () => api.reviewForm(formId, { decision, remarks: remarks.trim() || undefined }),
    onSuccess: (res) => {
      const outcome = res.form.status === "published" ? "published" : "returned to admin";
      toast.success(`Form ${outcome}`);
      void qc.invalidateQueries({ queryKey: ["form-review", formId] });
      void qc.invalidateQueries({ queryKey: ["records-dashboard"] });
      void qc.invalidateQueries({ queryKey: ["records-pending"] });
      void qc.invalidateQueries({ queryKey: ["records-published"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const form = data?.form;
  const canReview = form?.status === "pending_review";

  useEffect(() => {
    if (!review.isSuccess) return;
    const timer = window.setTimeout(() => {
      void navigate({ to: RECORDS_PENDING });
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [review.isSuccess, navigate]);

  if (isLoading) {
    return (
      <p className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading form review…
      </p>
    );
  }

  if (!form) {
    return <p className="py-12 text-center text-muted-foreground">Form not found.</p>;
  }

  return (
    <div className="page-shell space-y-6">
      <BackLink to={RECORDS_PENDING} label="Back to pending forms" />

      <WorkspacePageHeader
        bordered={false}
        title={form.title}
        description={`${form.refNumber} · ${form.version} · Submitted by ${form.createdBy?.name ?? "Admin"}`}
        meta={<FormStatusBadge status={form.status} />}
      />

      {!canReview ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {form.status === "published" ? (
            <>
              This form was already approved and published.{" "}
              <Link to={RECORDS_PUBLISHED} className="font-medium underline">
                View published forms
              </Link>
            </>
          ) : form.status === "disapproved" ? (
            <>This form was already returned to Admin for revision.</>
          ) : (
            <>This form is not awaiting review.</>
          )}{" "}
          <button type="button" onClick={() => void refetch()} className="ml-1 underline">
            Refresh
          </button>
        </div>
      ) : null}

      <DataPanel title="Uploaded file">
        <p className="border-b border-border/80 px-4 py-3 text-sm text-muted-foreground sm:px-5">
          Form template uploaded by Admin. Zoom and scroll to review. View only.
        </p>
        <FormUploadedFileViewer form={form} />
      </DataPanel>

      <FormFieldsSummary form={form} />

      {canReview ? (
        <div className="form-panel">
          <div className="flex items-start gap-2">
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-sm text-muted-foreground">
              After reviewing the uploaded file above, choose Approve & publish or Disapprove with
              remarks.
            </p>
          </div>

          <h2 className="mt-4 font-medium">Recommendation</h2>
          <div className="mt-3 flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="decision"
                checked={decision === "approved"}
                onChange={() => setDecision("approved")}
              />
              Approve & publish
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="decision"
                checked={decision === "disapproved"}
                onChange={() => setDecision("disapproved")}
              />
              Disapprove
            </label>
          </div>
          {decision === "disapproved" ? (
            <Input
              className="mt-3"
              placeholder="Remarks (e.g. Please add required fields)"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          ) : null}
          <Button
            className="mt-4"
            disabled={
              review.isPending ||
              review.isSuccess ||
              (decision === "disapproved" && !remarks.trim())
            }
            onClick={() => {
              if (review.isPending || review.isSuccess) return;
              review.mutate();
            }}
          >
            {review.isPending
              ? "Submitting…"
              : review.isSuccess
                ? "Submitted — redirecting…"
                : "Submit recommendation"}
          </Button>
          {review.isSuccess ? (
            <p className="mt-3 text-sm text-green-700">
              Done.{" "}
              <Link to={RECORDS_PENDING} className="underline">
                Back to pending list
              </Link>
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

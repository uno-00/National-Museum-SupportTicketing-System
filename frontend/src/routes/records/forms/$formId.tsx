import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { FormReviewPreview } from "@/components/records/FormReviewPreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import type { FormReviewDecision, FormStatus } from "@/lib/api/types";
import { RECORDS_PENDING, RECORDS_PUBLISHED } from "@/lib/navigation";
import { useRecordsSession } from "@/lib/use-portal-session";

const STATUS_LABEL: Record<FormStatus, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  published: "Published",
  disapproved: "Disapproved",
};

export const Route = createFileRoute("/records/forms/$formId")({
  component: FormReviewPage,
});

function FormReviewPage() {
  const { formId } = Route.useParams();
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

  if (isLoading) return <p className="py-12 text-center text-muted-foreground">Loading form…</p>;
  if (!form) return <p className="py-12 text-center text-muted-foreground">Form not found.</p>;

  return (
    <div className="space-y-6">
      <Link to={RECORDS_PENDING} className="text-sm text-muted-foreground hover:underline">
        ← Back to Pending Forms
      </Link>

      <div>
        <h1 className="text-xl font-semibold">{form.title}</h1>
        <p className="text-sm text-muted-foreground">
          {form.refNumber} · {form.version} · Submitted by {form.createdBy?.name ?? "Admin"}
        </p>
        <p className="mt-2 text-sm">
          Status:{" "}
          <strong
            className={
              form.status === "pending_review"
                ? "text-amber-700"
                : form.status === "published"
                  ? "text-green-700"
                  : form.status === "disapproved"
                    ? "text-destructive"
                    : ""
            }
          >
            {STATUS_LABEL[form.status]}
          </strong>
        </p>
      </div>

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
            <>This form is not awaiting review ({STATUS_LABEL[form.status]}).</>
          )}{" "}
          <button type="button" onClick={() => void refetch()} className="ml-1 underline">
            Refresh
          </button>
        </div>
      ) : null}

      <FormReviewPreview form={form} />

      {canReview ? (
        <div className="rounded-lg border bg-card p-4">
          <h2 className="font-medium">Recommendation</h2>
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
            {review.isPending ? "Submitting…" : review.isSuccess ? "Submitted" : "Submit recommendation"}
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

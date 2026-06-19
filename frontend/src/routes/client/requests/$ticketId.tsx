import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, MessageSquare, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { BackLink, DataPanel, StatusBadge, WorkspacePageHeader } from "@/components/layout/workspace-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api/client";
import { CLIENT_REQUESTS } from "@/lib/navigation";
import { formatAssignedPersonnel } from "@/lib/utils";

export const Route = createFileRoute("/client/requests/$ticketId")({
  component: TicketTrackPage,
});

function TicketTrackPage() {
  const { ticketId } = Route.useParams();
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["my-ticket", ticketId],
    queryFn: () => api.getTicket(ticketId),
  });

  const confirm = useMutation({
    mutationFn: (satisfied: boolean) => api.confirmTicket(ticketId, satisfied),
    onSuccess: () => {
      toast.success("Response recorded");
      void qc.invalidateQueries({ queryKey: ["my-ticket", ticketId] });
      void qc.invalidateQueries({ queryKey: ["my-tickets"] });
    },
  });

  const feedback = useMutation({
    mutationFn: () => api.submitFeedback(ticketId, { rating, comment: comment.trim() || undefined }),
    onSuccess: () => {
      toast.success("Feedback submitted");
      void qc.invalidateQueries({ queryKey: ["my-ticket", ticketId] });
    },
  });

  const ticket = data?.ticket;

  if (isLoading || !ticket) {
    return (
      <p className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading request details…
      </p>
    );
  }

  return (
    <div className="page-shell">
      <BackLink to={CLIENT_REQUESTS} label="Back to my requests" />

      <WorkspacePageHeader
        title={ticket.ticketNumber}
        description={ticket.title || ticket.formTitle}
        meta={<StatusBadge status={ticket.status} />}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="form-panel lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Request details
          </h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Form</dt>
              <dd className="mt-1 text-sm font-medium">{ticket.formTitle}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Submitted by</dt>
              <dd className="mt-1 text-sm font-medium">{ticket.creatorName}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Division</dt>
              <dd className="mt-1 text-sm">{ticket.division || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Created</dt>
              <dd className="mt-1 text-sm">
                {new Date(ticket.createdAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted-foreground">Assigned personnel</dt>
              <dd className="mt-1 text-sm font-medium">
                {formatAssignedPersonnel(ticket.assignedTo)}
              </dd>
            </div>
          </dl>

          {ticket.description ? (
            <div className="mt-5 rounded-lg border border-border/80 bg-muted/20 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Summary</p>
              <p className="mt-2 text-sm leading-relaxed">{ticket.description}</p>
            </div>
          ) : null}

          {ticket.rejectionReason ? (
            <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <strong>Rejected:</strong> {ticket.rejectionReason}
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <DataPanel title="Assigned personnel">
            <div className="flex items-start gap-3 px-4 py-4 sm:px-5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserRound className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {formatAssignedPersonnel(ticket.assignedTo)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {ticket.assignedTo?.length
                    ? "ICT personnel handling your request."
                    : "An admin will assign personnel after your request is approved."}
                </p>
              </div>
            </div>
          </DataPanel>

          {ticket.status === "resolved" ? (
            <DataPanel title="Confirm resolution">
              <div className="space-y-3 px-4 py-4 sm:px-5">
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Was your issue resolved satisfactorily?
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => confirm.mutate(true)} disabled={confirm.isPending}>
                    Yes, close ticket
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => confirm.mutate(false)}
                    disabled={confirm.isPending}
                  >
                    No, reopen
                  </Button>
                </div>
              </div>
            </DataPanel>
          ) : null}

          {(ticket.status === "closed" || ticket.status === "resolved") && !ticket.feedbackSubmitted ? (
            <DataPanel title="Submit feedback">
              <div className="space-y-4 px-4 py-4 sm:px-5">
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Help us improve by rating this assistance.
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rating">Rating (1–5)</Label>
                  <Input
                    id="rating"
                    type="number"
                    min={1}
                    max={5}
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="max-w-[6rem]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comment">Comments</Label>
                  <Textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Optional feedback"
                    rows={3}
                  />
                </div>
                <Button size="sm" onClick={() => feedback.mutate()} disabled={feedback.isPending}>
                  Submit feedback
                </Button>
              </div>
            </DataPanel>
          ) : null}

          {ticket.feedbackSubmitted ? (
            <div className="form-panel text-sm text-muted-foreground">
              Thank you — your feedback has been recorded
              {ticket.feedbackRating ? ` (${ticket.feedbackRating}/5).` : "."}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

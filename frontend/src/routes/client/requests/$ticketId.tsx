import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { toast } from "sonner";
import { ClientFeedbackPanel } from "@/components/client/ClientFeedbackPanel";
import {
  BackLink,
  ActionPanel,
  DataPanel,
  FlowNotice,
  PageLoader,
  StatusBadge,
  WorkspacePageHeader,
} from "@/components/layout/workspace-ui";
import { TicketRequestDetails } from "@/components/tickets/TicketRequestDetails";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { CLIENT_FEEDBACK, CLIENT_REQUESTS } from "@/lib/navigation";
import { getClientFeedbackUrl } from "@/lib/feedback-config";
import {
  ticketCanMarkComplete,
  ticketNeedsFeedback,
  ticketReadyToClose,
} from "@/lib/ticket-workflow";
import { formatAssignedPersonnel } from "@/lib/utils";

export const Route = createFileRoute("/client/requests/$ticketId")({
  component: TicketTrackPage,
});

function TicketTrackPage() {
  const { ticketId } = Route.useParams();
  const qc = useQueryClient();
  const [comment, setComment] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["my-ticket", ticketId],
    queryFn: () => api.getTicket(ticketId),
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      const status = query.state.data?.ticket?.status;
      if (status === "in_progress" || status === "open" || status === "pending") {
        return 10_000;
      }
      return false;
    },
  });

  const confirm = useMutation({
    mutationFn: (satisfied: boolean) => api.confirmTicket(ticketId, satisfied),
    onSuccess: (_data, satisfied) => {
      toast.success(satisfied ? "Ticket closed" : "Request reopened");
      void qc.invalidateQueries({ queryKey: ["my-ticket", ticketId] });
      void qc.invalidateQueries({ queryKey: ["my-tickets"] });
    },
    onError: (err: Error) => toast.error(err.message || "Could not update request"),
  });

  const completeService = useMutation({
    mutationFn: () => api.completeTicketService(ticketId),
    onSuccess: (result) => {
      const feedbackUrl = getClientFeedbackUrl(result.ticket);
      if (feedbackUrl) {
        window.open(feedbackUrl, "_blank", "noopener,noreferrer");
      }
      toast.success("Service marked complete — submit feedback using the link below");
      void qc.invalidateQueries({ queryKey: ["my-ticket", ticketId] });
      void qc.invalidateQueries({ queryKey: ["my-tickets"] });
    },
    onError: (err: Error) => toast.error(err.message || "Could not mark service complete"),
  });

  const feedback = useMutation({
    mutationFn: () => api.submitFeedback(ticketId, { comment: comment.trim() || undefined }),
    onSuccess: () => {
      toast.success("Feedback recorded — you can now close this request");
      void qc.invalidateQueries({ queryKey: ["my-ticket", ticketId] });
      void qc.invalidateQueries({ queryKey: ["my-tickets"] });
    },
    onError: (err: Error) => toast.error(err.message || "Could not record feedback"),
  });

  const ticket = data?.ticket;
  const activeTicket = feedback.data?.ticket ?? completeService.data?.ticket ?? ticket;
  const showFeedbackStep = activeTicket ? ticketNeedsFeedback(activeTicket) : false;
  const showCompleteButton = activeTicket ? ticketCanMarkComplete(activeTicket) && !showFeedbackStep : false;
  const readyToClose = activeTicket ? ticketReadyToClose(activeTicket) : false;
  const showServicePanel = showCompleteButton || showFeedbackStep;

  if (isLoading || !ticket) {
    return <PageLoader label="Loading request details…" />;
  }

  return (
    <div className="page-shell">
      <BackLink to={CLIENT_REQUESTS} label="Back to my requests" />

      <WorkspacePageHeader
        title={ticket.ticketNumber}
        description={ticket.title || ticket.formTitle}
        meta={<StatusBadge status={activeTicket?.status ?? ticket.status} />}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <TicketRequestDetails ticket={ticket} className="lg:col-span-2" showFeedback={false} />

        <div className="space-y-4">
          <DataPanel title="Assigned personnel">
            <div className="flex items-start gap-3 px-4 py-4 sm:px-5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserRound className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">{formatAssignedPersonnel(ticket.assignedTo)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {ticket.status === "in_progress"
                    ? "Your request is being handled by assigned ICT personnel."
                    : ticket.assignedTo?.length
                      ? "ICT personnel assigned to your request."
                      : "An admin will assign personnel after your request is approved."}
                </p>
              </div>
            </div>
          </DataPanel>

          {showServicePanel ? (
            <ActionPanel
              title="Complete service"
              description={
                showFeedbackStep
                  ? "Submit the official feedback survey, then confirm below to close this request."
                  : "Mark the service as done when ICT work is finished."
              }
            >
              {showCompleteButton ? (
                <Button
                  size="sm"
                  onClick={() => completeService.mutate()}
                  disabled={completeService.isPending}
                >
                  {completeService.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Mark service complete
                </Button>
              ) : null}

              {showFeedbackStep && activeTicket ? (
                <div className={showCompleteButton ? "feedback-reveal mt-5 border-t border-border/70 pt-5" : "feedback-reveal"}>
                  <FlowNotice tone="success" icon={CheckCircle2} title="Service marked complete">
                    Open the official feedback form using the link below. After you finish the survey,
                    confirm here so you can close this request.
                  </FlowNotice>
                  <div className="mt-4">
                    <ClientFeedbackPanel
                      ticket={activeTicket}
                      comment={comment}
                      onCommentChange={setComment}
                      onConfirm={() => feedback.mutate()}
                      isPending={feedback.isPending}
                    />
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground">
                    All pending feedback requests:{" "}
                    <Link to={CLIENT_FEEDBACK} className="font-medium text-maroon hover:underline">
                      Service Feedback
                    </Link>
                  </p>
                </div>
              ) : null}
            </ActionPanel>
          ) : null}

          {readyToClose ? (
            <ActionPanel
              title="Close request"
              description="Feedback received. Close this request when you are satisfied."
            >
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => confirm.mutate(true)}
                  disabled={confirm.isPending}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Close ticket
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => confirm.mutate(false)}
                  disabled={confirm.isPending}
                >
                  Reopen request
                </Button>
              </div>
            </ActionPanel>
          ) : null}

          {ticket.status === "closed" && ticket.feedbackSubmitted ? (
            <FlowNotice tone="success" icon={CheckCircle2} title="Request closed">
              Thank you for your feedback.
            </FlowNotice>
          ) : null}
        </div>
      </div>
    </div>
  );
}

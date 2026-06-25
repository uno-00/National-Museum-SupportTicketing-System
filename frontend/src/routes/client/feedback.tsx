import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { ClientFeedbackPanel } from "@/components/client/ClientFeedbackPanel";
import {
  ActionLink,
  DataPanel,
  EmptyState,
  LoadingRows,
  StatusBadge,
  WorkspacePageHeader,
} from "@/components/layout/workspace-ui";
import { api } from "@/lib/api/client";
import { getClientFeedbackUrl, isClientFeedbackConfigured } from "@/lib/feedback-config";
import { CLIENT_REQUESTS } from "@/lib/navigation";
import { ticketNeedsFeedback, ticketReadyToClose } from "@/lib/ticket-workflow";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export const Route = createFileRoute("/client/feedback")({
  component: ClientFeedbackPage,
});

function FeedbackTicketRow({ ticketId }: { ticketId: string }) {
  const qc = useQueryClient();
  const [comment, setComment] = useState("");
  const { data } = useQuery({
    queryKey: ["my-ticket", ticketId],
    queryFn: () => api.getTicket(ticketId),
  });
  const ticket = data?.ticket;

  const feedback = useMutation({
    mutationFn: () => api.submitFeedback(ticketId, { comment: comment.trim() || undefined }),
    onSuccess: () => {
      toast.success("Feedback recorded");
      void qc.invalidateQueries({ queryKey: ["my-tickets"] });
      void qc.invalidateQueries({ queryKey: ["my-ticket", ticketId] });
    },
    onError: (err: Error) => toast.error(err.message || "Could not record feedback"),
  });

  if (!ticket || !ticketNeedsFeedback(ticket)) return null;

  return (
    <tr className="border-t border-border/70 align-top">
      <td className="px-4 py-3.5 font-mono text-xs sm:px-5">{ticket.ticketNumber}</td>
      <td className="px-4 py-3.5 font-medium sm:px-5">{ticket.formTitle}</td>
      <td className="px-4 py-3.5 sm:px-5">
        <StatusBadge status={ticket.status} />
      </td>
      <td className="px-4 py-3.5 sm:px-5">
        <ClientFeedbackPanel
          ticket={ticket}
          comment={comment}
          onCommentChange={setComment}
          onConfirm={() => feedback.mutate()}
          isPending={feedback.isPending}
          compact
        />
      </td>
    </tr>
  );
}

function ClientFeedbackPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-tickets"],
    queryFn: () => api.myTickets(),
  });

  const items = data?.items ?? [];
  const awaitingFeedback = items.filter(ticketNeedsFeedback);
  const readyToClose = items.filter(ticketReadyToClose);
  const globalFeedbackUrl = getClientFeedbackUrl();

  return (
    <div className="page-shell">
      <WorkspacePageHeader
        title="Service Feedback"
        description="Complete the official feedback form using the link below, then confirm here so admin can review your comments."
        actions={<ActionLink to={CLIENT_REQUESTS}>My requests</ActionLink>}
      />

      {isClientFeedbackConfigured() && globalFeedbackUrl ? (
        <div className="rounded-lg border border-border/80 bg-muted/20 px-4 py-4 sm:px-5">
          <p className="text-sm font-medium text-foreground">Official feedback form</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Use this link for all service feedback submissions:
          </p>
          <a
            href={globalFeedbackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block break-all text-sm font-medium text-maroon hover:underline"
          >
            {globalFeedbackUrl}
          </a>
        </div>
      ) : (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Set <code className="text-xs">VITE_CLIENT_FEEDBACK_URL</code> in{" "}
          <code className="text-xs">frontend/.env</code> to your feedback form link.
        </div>
      )}

      {awaitingFeedback.length > 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {awaitingFeedback.length} request{awaitingFeedback.length === 1 ? "" : "s"} awaiting
          feedback confirmation after completed service.
        </div>
      ) : null}

      <DataPanel title={`Awaiting feedback (${awaitingFeedback.length})`}>
        <div className="overflow-x-auto">
          <table className="data-table w-full text-sm">
            <thead className="text-left">
              <tr>
                <th className="px-4 py-3 sm:px-5">Ticket</th>
                <th className="px-4 py-3 sm:px-5">Form</th>
                <th className="px-4 py-3 sm:px-5">Status</th>
                <th className="min-w-[280px] px-4 py-3 sm:px-5">Feedback link</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <LoadingRows cols={4} />
              ) : awaitingFeedback.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <EmptyState
                      title="No feedback pending"
                      description="After you mark a service complete, the request will appear here with the feedback link."
                    />
                  </td>
                </tr>
              ) : (
                awaitingFeedback.map((t) => <FeedbackTicketRow key={t._id} ticketId={t._id} />)
              )}
            </tbody>
          </table>
        </div>
      </DataPanel>

      {readyToClose.length > 0 ? (
        <DataPanel title={`Ready to close (${readyToClose.length})`}>
          <p className="border-b border-border/80 px-4 py-3 text-sm text-muted-foreground sm:px-5">
            Feedback confirmed. Open the request and click <strong>Close ticket</strong>.
          </p>
          <ul className="divide-y divide-border/80">
            {readyToClose.map((t) => (
              <li
                key={t._id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5"
              >
                <div>
                  <p className="font-medium">{t.formTitle}</p>
                  <p className="text-xs text-muted-foreground">{t.ticketNumber}</p>
                </div>
                <Link
                  to="/client/requests/$ticketId"
                  params={{ ticketId: t._id }}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shadow-sm")}
                >
                  Close request
                </Link>
              </li>
            ))}
          </ul>
        </DataPanel>
      ) : null}
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { CLIENT_REQUESTS } from "@/lib/navigation";

export const Route = createFileRoute("/client/requests/$ticketId")({
  component: TicketTrackPage,
});

function TicketTrackPage() {
  const { ticketId } = Route.useParams();
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const { data } = useQuery({
    queryKey: ["my-ticket", ticketId],
    queryFn: () => api.getTicket(ticketId),
  });

  const confirm = useMutation({
    mutationFn: (satisfied: boolean) => api.confirmTicket(ticketId, satisfied),
    onSuccess: () => {
      toast.success("Response recorded");
      void qc.invalidateQueries({ queryKey: ["my-ticket", ticketId] });
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
  if (!ticket) return <p>Loading…</p>;

  return (
    <div className="space-y-6">
      <Link to={CLIENT_REQUESTS} className="text-sm text-muted-foreground hover:underline">← Back</Link>
      <div>
        <h1 className="text-xl font-semibold">{ticket.ticketNumber}</h1>
        <p className="text-muted-foreground">{ticket.title}</p>
        <p className="mt-2 text-sm">
          Status: <strong className="capitalize">{ticket.status.replace(/_/g, " ")}</strong>
        </p>
        {ticket.rejectionReason ? (
          <p className="mt-2 text-sm text-destructive">Rejected: {ticket.rejectionReason}</p>
        ) : null}
      </div>

      {ticket.status === "resolved" ? (
        <div className="rounded-lg border p-4">
          <h2 className="font-medium">Confirm resolution</h2>
          <p className="mt-1 text-sm text-muted-foreground">Was your issue resolved satisfactorily?</p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => confirm.mutate(true)}>Yes, close ticket</Button>
            <Button size="sm" variant="outline" onClick={() => confirm.mutate(false)}>No, reopen</Button>
          </div>
        </div>
      ) : null}

      {(ticket.status === "closed" || ticket.status === "resolved") && !ticket.feedbackSubmitted ? (
        <div className="rounded-lg border p-4">
          <h2 className="font-medium">Submit feedback</h2>
          <label className="mt-2 block text-sm">
            Rating (1–5)
            <Input type="number" min={1} max={5} value={rating} onChange={(e) => setRating(Number(e.target.value))} className="mt-1 max-w-[6rem]" />
          </label>
          <label className="mt-3 block text-sm">
            Comments
            <Input value={comment} onChange={(e) => setComment(e.target.value)} className="mt-1" placeholder="Optional" />
          </label>
          <Button className="mt-3" size="sm" onClick={() => feedback.mutate()}>Submit feedback</Button>
        </div>
      ) : null}

      {ticket.feedbackSubmitted ? (
        <p className="text-sm text-muted-foreground">Thank you — feedback submitted.</p>
      ) : null}
    </div>
  );
}

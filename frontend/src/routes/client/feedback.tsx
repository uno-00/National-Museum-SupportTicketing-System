import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export const Route = createFileRoute("/client/feedback")({
  component: FeedbackPage,
});

function FeedbackPage() {
  const { data } = useQuery({ queryKey: ["my-tickets"], queryFn: () => api.myTickets() });
  const closed = (data?.items ?? []).filter((t) => t.status === "closed" || t.feedbackSubmitted);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Feedback</h1>
      <p className="text-sm text-muted-foreground">Rate completed technical assistance requests.</p>
      {closed.length === 0 ? (
        <p className="text-muted-foreground">No completed requests to review yet.</p>
      ) : (
        <ul className="space-y-2">
          {closed.map((t) => (
            <li key={t._id} className="flex items-center justify-between rounded-lg border p-4 text-sm">
              <span>{t.ticketNumber} — {t.formTitle}</span>
              {t.feedbackSubmitted ? (
                <span className="text-muted-foreground">Rated {t.feedbackRating}/5</span>
              ) : (
                <Link to="/client/requests/$ticketId" params={{ ticketId: t._id }} className="text-maroon hover:underline">
                  Leave feedback
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

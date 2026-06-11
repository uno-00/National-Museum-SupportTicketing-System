import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import type { TicketStatus } from "@/lib/api/types";
import { ADMIN_REQUESTS } from "@/lib/navigation";

const STATUSES: TicketStatus[] = ["open", "in_progress", "pending", "resolved", "closed"];

export const Route = createFileRoute("/admin/requests/$ticketId")({
  component: TicketDetailPage,
});

function TicketDetailPage() {
  const { ticketId } = Route.useParams();
  const qc = useQueryClient();
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

  const { data } = useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: () => api.getTicket(ticketId),
  });
  const { data: assigneeData } = useQuery({
    queryKey: ["assignees"],
    queryFn: () => api.listAssignees(),
  });

  const assign = useMutation({
    mutationFn: () => api.assignTicket(ticketId, selectedAssignees),
    onSuccess: () => {
      toast.success("Personnel assigned");
      void qc.invalidateQueries({ queryKey: ["ticket", ticketId] });
    },
  });

  const updateStatus = useMutation({
    mutationFn: (status: TicketStatus) => api.updateTicketStatus(ticketId, status),
    onSuccess: () => {
      toast.success("Status updated");
      void qc.invalidateQueries({ queryKey: ["ticket", ticketId] });
    },
  });

  const ticket = data?.ticket;

  useEffect(() => {
    if (!ticket?.assignedTo?.length) return;
    setSelectedAssignees(ticket.assignedTo.map((u) => u._id));
  }, [ticket?._id, ticket?.assignedTo]);

  if (!ticket) return <p>Loading…</p>;

  return (
    <div className="space-y-6">
      <Link to={ADMIN_REQUESTS} className="text-sm text-muted-foreground hover:underline">← Back</Link>
      <div>
        <h1 className="text-xl font-semibold">{ticket.ticketNumber}</h1>
        <p className="text-muted-foreground">{ticket.title}</p>
        <p className="mt-1 text-sm">Status: <strong className="capitalize">{ticket.status.replace(/_/g, " ")}</strong></p>
      </div>

      {ticket.attachmentUrl ? (
        <iframe src={ticket.attachmentUrl} title="Attachment" className="h-[50vh] w-full rounded border bg-white" />
      ) : null}

      <div className="rounded-lg border p-4">
        <h2 className="font-medium">Assign personnel</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {assigneeData?.users.map((u) => (
            <label key={u._id} className="flex items-center gap-2 rounded border px-3 py-1.5 text-sm">
              <input
                type="checkbox"
                checked={selectedAssignees.includes(u._id)}
                onChange={(e) =>
                  setSelectedAssignees((prev) =>
                    e.target.checked ? [...prev, u._id] : prev.filter((id) => id !== u._id),
                  )
                }
              />
              {u.name}
            </label>
          ))}
        </div>
        <Button className="mt-3" size="sm" onClick={() => assign.mutate()} disabled={selectedAssignees.length === 0}>
          Assign
        </Button>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="font-medium">Update status</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Set to <strong>resolved</strong> when work is done so the client can confirm and submit feedback.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <Button key={s} size="sm" variant="outline" onClick={() => updateStatus.mutate(s)}>
              {s.replace(/_/g, " ")}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

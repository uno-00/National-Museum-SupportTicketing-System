import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BackLink, DataPanel, StatusBadge, WorkspacePageHeader } from "@/components/layout/workspace-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api/client";
import type { TicketStatus } from "@/lib/api/types";
import { ADMIN_APPROVALS, ADMIN_REQUESTS } from "@/lib/navigation";
import { useAdminSession } from "@/lib/use-portal-session";

const STATUSES: TicketStatus[] = ["open", "in_progress", "pending", "resolved", "closed"];

export const Route = createFileRoute("/admin/requests/$ticketId")({
  component: TicketDetailPage,
});

function invalidateAdminTicketQueries(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ["pending-tickets"] });
  void qc.invalidateQueries({ queryKey: ["admin-tickets-pending"] });
  void qc.invalidateQueries({ queryKey: ["all-tickets"] });
}

function TicketDetailPage() {
  const { ticketId } = Route.useParams();
  const qc = useQueryClient();
  const { canQuery } = useAdminSession();
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: () => api.getTicket(ticketId, "admin"),
    enabled: canQuery,
  });
  const { data: assigneeData } = useQuery({
    queryKey: ["assignees"],
    queryFn: () => api.listAssignees(),
    enabled: canQuery,
  });

  const approve = useMutation({
    mutationFn: () => api.approveTicket(ticketId, "admin"),
    onSuccess: () => {
      toast.success("Request approved");
      invalidateAdminTicketQueries(qc);
      void qc.invalidateQueries({ queryKey: ["ticket", ticketId] });
    },
    onError: (err: Error) => {
      toast.error(err instanceof ApiError ? err.message : "Could not approve request.");
    },
  });

  const reject = useMutation({
    mutationFn: (reason: string) => api.rejectTicket(ticketId, reason, "admin"),
    onSuccess: () => {
      toast.success("Request rejected");
      setRejectReason("");
      invalidateAdminTicketQueries(qc);
      void qc.invalidateQueries({ queryKey: ["ticket", ticketId] });
    },
    onError: (err: Error) => {
      toast.error(err instanceof ApiError ? err.message : "Could not reject request.");
    },
  });

  const assign = useMutation({
    mutationFn: () => api.assignTicket(ticketId, selectedAssignees, "admin"),
    onSuccess: () => {
      toast.success("Personnel assigned");
      void qc.invalidateQueries({ queryKey: ["ticket", ticketId] });
    },
    onError: (err: Error) => {
      toast.error(err instanceof ApiError ? err.message : "Could not assign personnel.");
    },
  });

  const updateStatus = useMutation({
    mutationFn: (status: TicketStatus) => api.updateTicketStatus(ticketId, status, "admin"),
    onSuccess: () => {
      toast.success("Status updated");
      void qc.invalidateQueries({ queryKey: ["ticket", ticketId] });
    },
    onError: (err: Error) => {
      toast.error(err instanceof ApiError ? err.message : "Could not update status.");
    },
  });

  const ticket = data?.ticket;

  useEffect(() => {
    if (!ticket?.assignedTo?.length) return;
    setSelectedAssignees(ticket.assignedTo.map((u) => u._id));
  }, [ticket?._id, ticket?.assignedTo]);

  if (!canQuery || isLoading || !ticket) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Loading request…</p>;
  }

  const isPendingApproval = ticket.status === "pending_approval";
  const backTo = isPendingApproval ? ADMIN_APPROVALS : ADMIN_REQUESTS;

  return (
    <div className="page-shell">
      <BackLink to={backTo} label={isPendingApproval ? "Back to approvals" : "Back to requests"} />

      <WorkspacePageHeader
        title={ticket.ticketNumber}
        description={ticket.title}
        meta={
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Status:</span>
            <StatusBadge status={ticket.status} />
            {ticket.creatorName ? (
              <span className="text-muted-foreground">· Client: {ticket.creatorName}</span>
            ) : null}
          </div>
        }
        bordered={false}
      />

      {isPendingApproval ? (
        <div className="form-panel space-y-3">
          <h2 className="font-medium">Approve or reject</h2>
          <p className="text-sm text-muted-foreground">
            This request is waiting for admin approval before it can be assigned and processed.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => approve.mutate()} disabled={approve.isPending || reject.isPending}>
              Approve request
            </Button>
          </div>
          <div className="space-y-2 border-t border-border/70 pt-3">
            <Input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Rejection reason"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => reject.mutate(rejectReason)}
              disabled={!rejectReason.trim() || approve.isPending || reject.isPending}
            >
              Reject request
            </Button>
          </div>
        </div>
      ) : null}

      {ticket.rejectionReason ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Rejected: {ticket.rejectionReason}
        </div>
      ) : null}

      {ticket.attachmentUrl ? (
        <DataPanel title="Attachment">
          <iframe
            src={ticket.attachmentUrl}
            title="Attachment"
            className="h-[50vh] w-full border-0 bg-white"
          />
        </DataPanel>
      ) : null}

      {!isPendingApproval ? (
        <>
          <div className="form-panel">
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
            <Button
              className="mt-3"
              size="sm"
              onClick={() => assign.mutate()}
              disabled={selectedAssignees.length === 0 || assign.isPending}
            >
              Assign
            </Button>
          </div>

          <div className="form-panel">
            <h2 className="font-medium">Update status</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Set to <strong>resolved</strong> when work is done so the client can confirm and submit feedback.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant="outline"
                  onClick={() => updateStatus.mutate(s)}
                  disabled={updateStatus.isPending}
                >
                  {s.replace(/_/g, " ")}
                </Button>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

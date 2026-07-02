import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BackLink, ActionPanel, FlowNotice, PageLoader, StatusBadge, WorkspacePageHeader } from "@/components/layout/workspace-ui";
import { TicketRequestDetails } from "@/components/tickets/TicketRequestDetails";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api/client";
import type { TicketStatus } from "@/lib/api/types";
import { ADMIN_APPROVALS, ADMIN_DASHBOARD, ADMIN_MESSAGES, ADMIN_REQUESTS } from "@/lib/navigation";
import { useAdminSession } from "@/lib/use-portal-session";
import { cn } from "@/lib/utils";

/** Admin may set these manually — client marks complete, feedback, and close. */
const ADMIN_STATUSES: TicketStatus[] = ["in_progress", "pending"];

export const Route = createFileRoute("/admin/requests/$ticketId")({
  component: TicketDetailPage,
});

function invalidateAdminTicketQueries(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ["pending-tickets"] });
  void qc.invalidateQueries({ queryKey: ["admin-tickets-pending"] });
  void qc.invalidateQueries({ queryKey: ["admin-tickets-dashboard"] });
  void qc.invalidateQueries({ queryKey: ["all-tickets"] });
  void qc.invalidateQueries({ queryKey: ["assigned-tickets"] });
}

function TicketDetailPage() {
  const { ticketId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { canQuery } = useAdminSession();
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
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
    mutationFn: () => api.assignTicket(ticketId, selectedAssigneeIds, "admin"),
    onSuccess: () => {
      toast.success("Personnel assigned — status set to In Progress");
      invalidateAdminTicketQueries(qc);
      void navigate({ to: ADMIN_DASHBOARD, replace: true });
    },
    onError: (err: Error) => {
      toast.error(err instanceof ApiError ? err.message : "Could not assign personnel.");
    },
  });

  const updateStatus = useMutation({
    mutationFn: (status: TicketStatus) => api.updateTicketStatus(ticketId, status, "admin"),
    onSuccess: () => {
      toast.success("Status updated");
      invalidateAdminTicketQueries(qc);
      void qc.invalidateQueries({ queryKey: ["ticket", ticketId] });
    },
    onError: (err: Error) => {
      toast.error(err instanceof ApiError ? err.message : "Could not update status.");
    },
  });

  const ticket = data?.ticket;

  useEffect(() => {
    if (!ticket?.assignedTo?.length) {
      setSelectedAssigneeIds([]);
      return;
    }
    setSelectedAssigneeIds(ticket.assignedTo.map((u) => u._id));
  }, [ticket?._id, ticket?.assignedTo]);

  const toggleAssignee = (id: string) => {
    setSelectedAssigneeIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  };

  if (!canQuery || isLoading || !ticket) {
    return <PageLoader label="Loading request…" />;
  }

  const isPendingApproval = ticket.status === "pending_approval";
  const backTo = isPendingApproval ? ADMIN_APPROVALS : ADMIN_REQUESTS;
  const isAwaitingClient = ticket.status === "resolved";
  const canAssign = !isPendingApproval && !isAwaitingClient && ticket.status !== "closed";

  return (
    <div className="page-shell">
      <BackLink to={backTo} label={isPendingApproval ? "Back to approvals" : "Back to requests"} />

      <WorkspacePageHeader
        title={ticket.ticketNumber}
        description={ticket.title}
        actions={
          ticket.status !== "closed" ? (
            <Link to={ADMIN_MESSAGES} search={{ ticket: ticketId }}>
              <Button size="sm" variant="outline" className="gap-1.5">
                <MessageCircle className="h-4 w-4" />
                Request messages
              </Button>
            </Link>
          ) : null
        }
        meta={
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Status:</span>
            <StatusBadge status={ticket.status} />
            {ticket.creatorName ? (
              <span className="text-muted-foreground">· Client: {ticket.creatorName}</span>
            ) : null}
            {ticket.division ? (
              <span className="text-muted-foreground">· Division: {ticket.division}</span>
            ) : null}
          </div>
        }
        bordered={false}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <TicketRequestDetails ticket={ticket} className="lg:col-span-2" />

        <div className="space-y-4">
          {isPendingApproval ? (
            <ActionPanel
              title="Approve or reject"
              description="Review the request details before approving or rejecting."
            >
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => approve.mutate()}
                  disabled={approve.isPending || reject.isPending}
                >
                  Approve request
                </Button>
              </div>
              <div className="mt-4 space-y-2 border-t border-border/70 pt-4">
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
            </ActionPanel>
          ) : null}

          {!isPendingApproval ? (
            <>
              {canAssign ? (
              <ActionPanel
                title="Assign personnel"
                description="Select ICT personnel for this request. The client's division is shown below — ICT handles requests from all NMP offices."
              >
                <FlowNotice tone="info" title="Requestor's division">
                  <span className="font-medium text-foreground">{ticket.division?.trim() || "Not specified"}</span>
                  {ticket.creatorName ? (
                    <span className="text-muted-foreground"> · {ticket.creatorName}</span>
                  ) : null}
                </FlowNotice>
                {ticket.assignedTo?.length ? (
                  <p className="text-sm">
                    Currently assigned:{" "}
                    <span className="font-medium">
                      {ticket.assignedTo.map((u) => u.name).join(", ")}
                    </span>
                  </p>
                ) : null}
                <div className="max-w-md space-y-2">
                  <Label>ICT personnel (all divisions)</Label>
                  <div
                    className={cn(
                      "max-h-48 space-y-1 overflow-y-auto rounded-md border border-input bg-background p-2 shadow-sm",
                    )}
                  >
                    {assigneeData?.users.length ? (
                      assigneeData.users.map((u) => {
                        const checked = selectedAssigneeIds.includes(u._id);
                        return (
                          <label
                            key={u._id}
                            className={cn(
                              "flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted/60",
                              checked && "bg-muted/40",
                            )}
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5"
                              checked={checked}
                              onChange={() => toggleAssignee(u._id)}
                            />
                            <span>
                              <span className="font-medium">{u.name}</span>
                              <span className="block text-xs text-muted-foreground">
                                {u.division}
                              </span>
                            </span>
                          </label>
                        );
                      })
                    ) : (
                      <p className="px-2 py-3 text-sm text-muted-foreground">
                        No ICT personnel available.
                      </p>
                    )}
                  </div>
                  {selectedAssigneeIds.length > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      {selectedAssigneeIds.length} selected
                    </p>
                  ) : null}
                </div>
                <Button
                  size="sm"
                  onClick={() => assign.mutate()}
                  disabled={selectedAssigneeIds.length === 0 || assign.isPending}
                >
                  {assign.isPending ? "Assigning…" : "Assign"}
                </Button>
              </ActionPanel>
              ) : null}

              {isAwaitingClient ? (
                <FlowNotice tone="success" title="Waiting for client">
                  Client marked the service complete. Waiting for feedback submission and ticket
                  closure.
                </FlowNotice>
              ) : null}

              {!isAwaitingClient && ticket.status !== "closed" ? (
                <ActionPanel
                  title="Update status"
                  description="The client marks the service complete when ICT work is done, then submits feedback and closes the request."
                >
                  <div className="flex flex-wrap gap-2">
                    {ADMIN_STATUSES.map((s) => {
                      const isCurrent = ticket.status === s;
                      return (
                        <Button
                          key={s}
                          size="sm"
                          variant={isCurrent ? "default" : "outline"}
                          onClick={() => updateStatus.mutate(s)}
                          disabled={updateStatus.isPending || isCurrent}
                        >
                          {s.replace(/_/g, " ")}
                        </Button>
                      );
                    })}
                  </div>
                </ActionPanel>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

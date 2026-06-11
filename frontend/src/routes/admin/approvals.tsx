import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { ADMIN_REQUESTS } from "@/lib/navigation";

export const Route = createFileRoute("/admin/approvals")({
  component: ApprovalsPage,
});

function ApprovalsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["pending-tickets"],
    queryFn: () => api.listTickets({ status: "pending_approval" }),
  });
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const approve = useMutation({
    mutationFn: (id: string) => api.approveTicket(id),
    onSuccess: () => {
      toast.success("Request approved");
      void qc.invalidateQueries({ queryKey: ["pending-tickets"] });
    },
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.rejectTicket(id, reason),
    onSuccess: () => {
      toast.success("Request rejected");
      setRejectId(null);
      setReason("");
      void qc.invalidateQueries({ queryKey: ["pending-tickets"] });
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Approvals</h1>
      <p className="text-sm text-muted-foreground">Review client technical assistance requests.</p>
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Ticket</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Division</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center">Loading…</td></tr>
            ) : (data?.items ?? []).length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No pending approvals.</td></tr>
            ) : (
              data?.items.map((t) => (
                <tr key={t._id} className="border-t">
                  <td className="px-4 py-3">
                    <Link to="/admin/requests/$ticketId" params={{ ticketId: t._id }} className="font-medium text-maroon hover:underline">
                      {t.ticketNumber}
                    </Link>
                    <p className="text-xs text-muted-foreground">{t.formTitle}</p>
                  </td>
                  <td className="px-4 py-3">{t.creatorName}</td>
                  <td className="px-4 py-3">{t.division}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => approve.mutate(t._id)} disabled={approve.isPending}>Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => setRejectId(t._id)}>Reject</Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {rejectId ? (
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm font-medium">Rejection reason</p>
          <Input className="mt-2" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for rejection" />
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => reject.mutate({ id: rejectId, reason })} disabled={!reason.trim()}>Confirm reject</Button>
            <Button size="sm" variant="outline" onClick={() => setRejectId(null)}>Cancel</Button>
          </div>
        </div>
      ) : null}
      <Link to={ADMIN_REQUESTS} className="text-sm text-maroon hover:underline">View all requests →</Link>
    </div>
  );
}

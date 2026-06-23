import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TicketSubmittedFileViewer } from "@/components/tickets/TicketSubmittedFileViewer";
import { api } from "@/lib/api/client";
import type { PortalSlot } from "@/lib/sessions";

type TicketPdfViewerDialogProps = {
  ticketId: string | null;
  ticketNumber?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slot?: PortalSlot;
};

export function TicketPdfViewerDialog({
  ticketId,
  ticketNumber,
  open,
  onOpenChange,
  slot = "admin",
}: TicketPdfViewerDialogProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["ticket", ticketId, slot],
    queryFn: () => api.getTicket(ticketId!, slot),
    enabled: open && Boolean(ticketId),
  });

  const ticket = data?.ticket;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] max-h-[90vh] w-[95vw] max-w-5xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border/80 px-6 py-4 text-left">
          <DialogTitle>
            {ticketNumber ? `${ticketNumber} — Request file` : "Request file"}
          </DialogTitle>
          <DialogDescription>
            Form with submitted answers on the template. View only.
          </DialogDescription>
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-muted/20">
          {isLoading ? (
            <p className="py-16 text-center text-sm text-muted-foreground">Loading file…</p>
          ) : isError || !ticket ? (
            <p className="py-16 text-center text-sm text-destructive">Could not load file.</p>
          ) : (
            <TicketSubmittedFileViewer
              ticket={ticket}
              enabled={open}
              fillHeight
              className="h-full"
              slot={slot}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

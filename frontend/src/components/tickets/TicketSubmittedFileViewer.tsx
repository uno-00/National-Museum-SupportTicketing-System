import { useMemo } from "react";
import type { TicketRecord } from "@/lib/api/types";
import { buildPlacementOverlay } from "@/components/documents/buildPlacementOverlay";
import { ViewOnlyDocumentViewer } from "@/components/documents/ViewOnlyDocumentViewer";
import { api } from "@/lib/api/client";
import { isImagePath, isPdfPath } from "@/lib/media-url";
import {
  hasFilledAnswers,
  resolveFormPlacementFontSize,
  resolveFormPlacements,
} from "@/lib/placement-values";
import type { PortalSlot } from "@/lib/sessions";

type TicketSubmittedFileViewerProps = {
  ticket: TicketRecord;
  enabled?: boolean;
  className?: string;
  viewportClassName?: string;
  fileLabel?: string;
  fillHeight?: boolean;
  slot?: PortalSlot;
};

function populatedForm(ticket: TicketRecord) {
  return typeof ticket.formId === "object" && ticket.formId !== null ? ticket.formId : null;
}

function resolveFallbackFile(ticket: TicketRecord): string | null {
  const attachment = ticket.attachmentUrl?.trim();
  if (attachment) return attachment;

  const form = populatedForm(ticket);
  return form?.printTemplateImagePath?.trim() || null;
}

/**
 * Shows the form template with the client's actual submitted answers on saved placements.
 * PDF templates use server-merged document (same reliable approach as Records).
 */
export function TicketSubmittedFileViewer({
  ticket,
  enabled = true,
  className,
  viewportClassName,
  fileLabel,
  fillHeight,
  slot,
}: TicketSubmittedFileViewerProps) {
  const form = populatedForm(ticket);
  const templateSrc = form?.printTemplateImagePath?.trim() ?? null;
  const placements = useMemo(() => (form ? resolveFormPlacements(form) : []), [form]);
  const hasPlacements = placements.length > 0;
  const isPdfTemplate = Boolean(templateSrc && isPdfPath(templateSrc));
  const isImageTemplate = Boolean(templateSrc && isImagePath(templateSrc));
  const filled = hasFilledAnswers(ticket.answers);

  /** PDF iframe overlays are unreliable — burn answers into PDF on the server. */
  const useMergedPdf = Boolean(isPdfTemplate && templateSrc && hasPlacements && filled);

  const blobLoader = useMemo(() => {
    if (!useMergedPdf || !enabled) return undefined;
    return () => api.getTicketDocument(ticket._id, slot);
  }, [ticket._id, useMergedPdf, enabled, slot]);

  const overlay = useMemo(() => {
    if (!hasPlacements || !isImageTemplate || !form || !filled) return undefined;
    return buildPlacementOverlay(
      form.fields,
      placements,
      ticket.answers ?? {},
      resolveFormPlacementFontSize(form),
    );
  }, [form, hasPlacements, isImageTemplate, filled, placements, ticket.answers]);

  const src = useMergedPdf ? null : templateSrc ?? resolveFallbackFile(ticket);

  const alt =
    fileLabel?.trim() ||
    ticket.attachmentName?.trim() ||
    ticket.formTitle ||
    ticket.ticketNumber ||
    "Submitted request";

  return (
    <ViewOnlyDocumentViewer
      src={src}
      blobLoader={blobLoader}
      enabled={enabled}
      alt={alt}
      fileLabel={alt}
      overlay={overlay}
      className={className}
      viewportClassName={viewportClassName}
      fillHeight={fillHeight}
      emptyMessage="No uploaded file is attached to this request."
    />
  );
}

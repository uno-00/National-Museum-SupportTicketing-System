import { useMemo } from "react";
import type { FormRecord } from "@/lib/api/types";
import {
  buildPlacementLayoutOverlay,
  buildPlacementOverlay,
} from "@/components/documents/buildPlacementOverlay";
import { EmptyState } from "@/components/layout/workspace-ui";
import { ViewOnlyDocumentViewer } from "@/components/documents/ViewOnlyDocumentViewer";
import { isImagePath, isPdfPath } from "@/lib/media-url";
import {
  hasFilledAnswers,
  resolveFormPlacementFontSize,
  resolveFormPlacements,
} from "@/lib/placement-values";

type FormTemplateFileViewerProps = {
  form: FormRecord;
  enabled?: boolean;
  className?: string;
  viewportClassName?: string;
  fillHeight?: boolean;
  fileLabel?: string;
  emptyMessage?: string;
  /** Live or submitted answers — when filled, shown on template instead of layout labels. */
  answers?: Record<string, unknown>;
  /** Server PDF with layout labels (Records / pre-submit preview without answers). */
  loadMergedPdf?: (formId: string) => Promise<Blob>;
};

/** Shows uploaded template with field placements and optional answer overlay. View only. */
export function FormTemplateFileViewer({
  form,
  enabled = true,
  className,
  viewportClassName,
  fillHeight,
  fileLabel = "Form template",
  emptyMessage = "No form file was uploaded.",
  answers,
  loadMergedPdf,
}: FormTemplateFileViewerProps) {
  const templateSrc = form.printTemplateImagePath?.trim() ?? null;
  const placements = useMemo(() => resolveFormPlacements(form), [form]);
  const hasPlacements = placements.length > 0;
  const isPdfTemplate = Boolean(templateSrc && isPdfPath(templateSrc));
  const isImageTemplate = Boolean(templateSrc && isImagePath(templateSrc));
  const filled = hasFilledAnswers(answers);

  /** Layout-label PDF for Records review, or when no answers yet. */
  const useMergedPdf = hasPlacements && isPdfTemplate && Boolean(loadMergedPdf) && !filled;

  const blobLoader = useMemo(() => {
    if (!useMergedPdf || !enabled || !loadMergedPdf) return undefined;
    return () => loadMergedPdf(form._id);
  }, [form._id, useMergedPdf, enabled, loadMergedPdf]);

  const overlay = useMemo(() => {
    if (!hasPlacements) return undefined;
    if (filled && answers) {
      return buildPlacementOverlay(
        form.fields,
        placements,
        answers,
        resolveFormPlacementFontSize(form),
      );
    }
    if (isImageTemplate) return buildPlacementLayoutOverlay(form);
    return undefined;
  }, [form, hasPlacements, filled, answers, placements, isImageTemplate]);

  if (!templateSrc) {
    return (
      <EmptyState title="No template uploaded" description={emptyMessage} />
    );
  }

  const showAnswerOverlayOnPdf = filled && isPdfTemplate && hasPlacements;

  return (
    <ViewOnlyDocumentViewer
      src={useMergedPdf ? null : templateSrc}
      blobLoader={blobLoader}
      enabled={enabled}
      alt={fileLabel}
      fileLabel={fileLabel}
      overlay={showAnswerOverlayOnPdf ? overlay : isImageTemplate ? overlay : undefined}
      className={className}
      viewportClassName={viewportClassName}
      fillHeight={fillHeight}
      emptyMessage={emptyMessage}
    />
  );
}

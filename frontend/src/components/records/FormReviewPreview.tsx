import { useMemo, useState } from "react";
import { ExternalLink, ZoomIn, ZoomOut } from "lucide-react";
import type { FormRecord } from "@/lib/api/types";
import type { FormField, PrintFieldPlacement } from "@/lib/form-builder-store";
import { DEFAULT_PRINT_PLACEMENT_FONT_SIZE } from "@/lib/form-builder-store";
import { buildSampleSubmissionValues } from "@/lib/print-merge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FormReviewPreviewProps = {
  form: FormRecord;
};

const PREVIEW_WIDTHS = [480, 560, 640, 800] as const;

export function FormReviewPreview({ form }: FormReviewPreviewProps) {
  const placements = form.printPlacements ?? [];
  const fontSize = form.printPlacementFontSize ?? DEFAULT_PRINT_PLACEMENT_FONT_SIZE;
  const fieldTextWidth = Math.round(fontSize * 15);
  const templateSrc = form.printTemplateImagePath || null;
  const procedureSrc = form.workProcedurePath || null;
  const [widthIndex, setWidthIndex] = useState(0);

  const previewWidth = PREVIEW_WIDTHS[widthIndex] ?? PREVIEW_WIDTHS[0];

  const sampleValues = useMemo(
    () => buildSampleSubmissionValues(form.fields as FormField[]),
    [form.fields],
  );

  return (
    <div className="space-y-6">
      {templateSrc ? (
        <section className="data-panel overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 bg-muted/30 px-4 py-3 sm:px-5">
            <div>
              <h2 className="text-sm font-semibold">Uploaded form template</h2>
              <p className="text-xs text-muted-foreground">Sample values shown on the print layout.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border border-border/80 bg-background p-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={widthIndex === 0}
                  onClick={() => setWidthIndex((i) => Math.max(0, i - 1))}
                  aria-label="Zoom out"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="min-w-[3.5rem] text-center text-xs font-medium tabular-nums text-muted-foreground">
                  {previewWidth}px
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={widthIndex >= PREVIEW_WIDTHS.length - 1}
                  onClick={() => setWidthIndex((i) => Math.min(PREVIEW_WIDTHS.length - 1, i + 1))}
                  aria-label="Zoom in"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
              <Button type="button" variant="outline" size="sm" asChild>
                <a href={templateSrc} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  Open full size
                </a>
              </Button>
            </div>
          </div>

          <div className="document-preview-viewport max-h-[min(58vh,520px)] overflow-auto bg-muted/25 p-4 sm:p-6">
            <div className="mx-auto" style={{ width: previewWidth, maxWidth: "100%" }}>
              <div
                className="print-template-canvas relative w-full overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-border/80"
                style={
                  {
                    "--dynamic-text-size": `${fontSize}px`,
                    "--dynamic-text-width": `${fieldTextWidth}px`,
                  } as React.CSSProperties
                }
              >
                <img
                  src={templateSrc}
                  alt="Form template"
                  className="block h-auto w-full select-none"
                  draggable={false}
                />
                {placements.map((p) => (
                  <PlacementLabel key={p.id} placement={p} preview={previewText(p, sampleValues)} />
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="data-panel overflow-hidden">
        <div className="border-b border-border/80 bg-muted/30 px-4 py-3 sm:px-5">
          <h2 className="text-sm font-semibold">Form fields (filled preview)</h2>
        </div>
        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
          {form.fields.map((f) => (
            <div key={f.id} className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                {f.label}
                {f.required ? " *" : ""}
              </label>
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                {sampleValues[f.variable] || "—"}
              </div>
            </div>
          ))}
        </div>
      </section>

      {procedureSrc ? (
        <section className="data-panel overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 bg-muted/30 px-4 py-3 sm:px-5">
            <div>
              <h2 className="text-sm font-semibold">Work procedure</h2>
              <p className="text-xs text-muted-foreground">{form.workProcedureName || "SOP document"}</p>
            </div>
            <Button type="button" variant="outline" size="sm" asChild>
              <a href={procedureSrc} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                Open full size
              </a>
            </Button>
          </div>
          <iframe
            src={procedureSrc}
            title="Work procedure"
            className="h-[min(45vh,420px)] w-full border-0 bg-white"
          />
        </section>
      ) : null}

      {!templateSrc && !procedureSrc ? (
        <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          No template or procedure file was uploaded with this form.
        </p>
      ) : null}
    </div>
  );
}

function previewText(p: PrintFieldPlacement, sampleValues: Record<string, string>) {
  return sampleValues[p.variable]?.replace(/\s*\(sample\)\s*$/i, "").trim() || p.label;
}

function PlacementLabel({ placement: p, preview }: { placement: PrintFieldPlacement; preview: string }) {
  return (
    <span
      className={cn("dynamic-text-anchor pointer-events-none")}
      style={{ left: `${p.xPct}%`, top: `${p.yPct}%` }}
      title={`${p.variable} — ${preview}`}
    >
      <span className="dynamic-text">{preview}</span>
    </span>
  );
}

import { useMemo } from "react";
import type { FormRecord } from "@/lib/api/types";
import type { FormField, PrintFieldPlacement } from "@/lib/form-builder-store";
import { DEFAULT_PRINT_PLACEMENT_FONT_SIZE } from "@/lib/form-builder-store";
import { buildSampleSubmissionValues } from "@/lib/print-merge";
import { cn } from "@/lib/utils";

type FormReviewPreviewProps = {
  form: FormRecord;
};

export function FormReviewPreview({ form }: FormReviewPreviewProps) {
  const placements = form.printPlacements ?? [];
  const fontSize = form.printPlacementFontSize ?? DEFAULT_PRINT_PLACEMENT_FONT_SIZE;
  const fieldTextWidth = Math.round(fontSize * 15);
  const templateSrc = form.printTemplateImagePath || null;
  const procedureSrc = form.workProcedurePath || null;

  const sampleValues = useMemo(
    () => buildSampleSubmissionValues(form.fields as FormField[]),
    [form.fields],
  );

  return (
    <div className="space-y-6">
      {templateSrc ? (
        <section className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3">
            <h2 className="font-medium">Uploaded form template</h2>
            <p className="text-xs text-muted-foreground">Preview with sample field values filled in.</p>
          </div>
          <div className="overflow-auto p-4">
            <div
              className="print-template-canvas relative inline-block overflow-hidden rounded-md bg-white shadow-md ring-1 ring-border"
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
                className="block max-w-full select-none"
              />
              {placements.map((p) => (
                <PlacementLabel key={p.id} placement={p} preview={previewText(p, sampleValues)} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="rounded-lg border bg-card p-4">
        <h2 className="font-medium">Form fields (filled preview)</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
        <section className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3">
            <h2 className="font-medium">Work procedure</h2>
            <p className="text-xs text-muted-foreground">{form.workProcedureName || "SOP document"}</p>
          </div>
          <iframe
            src={procedureSrc}
            title="Work procedure"
            className="h-[60vh] w-full bg-white"
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

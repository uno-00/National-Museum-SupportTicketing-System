import type { CSSProperties, ReactNode } from "react";
import type { FormRecord, LiveFormField } from "@/lib/api/types";
import type { PrintFieldPlacement } from "@/lib/form-builder-store";
import { DEFAULT_PRINT_PLACEMENT_FONT_SIZE } from "@/lib/form-builder-store";
import {
  formatFieldAnswerValue,
  isSignatureImageValue,
  resolveSignatureImageSrc,
} from "@/lib/form-field-values";
import { displayValueForChoicePlacement, PLACEMENT_CHECKMARK } from "@/lib/placement-choice-values";
import {
  displayValueForPlacement,
  resolveAnswerForVariable,
  resolveFormPlacementFontSize,
  resolveFormPlacements,
} from "@/lib/placement-values";
import { cn } from "@/lib/utils";

type BuildPlacementOverlayOptions = {
  /** Show field label at placement when there is no submitted answer (Records layout review). */
  showLabelWhenEmpty?: boolean;
};

function findFieldForPlacement(fields: LiveFormField[], placementVariable: string) {
  const inner = placementVariable.replace(/^\{\{|\}\}$/g, "");
  return (
    fields.find(
      (field) =>
        field.variable === placementVariable ||
        field.variable === inner ||
        field.variable.replace(/^\{\{|\}\}$/g, "") === inner,
    ) ?? null
  );
}

function renderPlacementLayer(
  fields: LiveFormField[],
  placements: PrintFieldPlacement[],
  answers: Record<string, unknown>,
  fontSize: number,
  options?: BuildPlacementOverlayOptions,
) {
  const fieldTextWidth = Math.round(fontSize * 15);
  const cssVars = {
    "--dynamic-text-size": `${fontSize}px`,
    "--dynamic-text-width": `${fieldTextWidth}px`,
  } as CSSProperties;

  const markers = placements
    .map((placement) => {
      const field = findFieldForPlacement(fields, placement.variable);
      const raw = resolveAnswerForVariable(answers, placement.variable);

      if (field?.type === "signature" && isSignatureImageValue(raw)) {
        const src = resolveSignatureImageSrc(raw);
        if (!src) return null;
        return (
          <span
            key={placement.id}
            className="dynamic-text-anchor pointer-events-none"
            style={{ left: `${placement.xPct}%`, top: `${placement.yPct}%` }}
            title={placement.label}
          >
            <img
              src={src}
              alt="Signature"
              className="block max-h-[3em] w-auto object-contain"
              style={{ maxWidth: fieldTextWidth }}
            />
          </span>
        );
      }

      const text = displayValueForPlacement(
        fields,
        placement.variable,
        placement.label,
        answers,
        options?.showLabelWhenEmpty,
      );
      if (!text) return null;

      const isCheckmark = text === PLACEMENT_CHECKMARK;
      const hasAnswer = isCheckmark
        ? Boolean(
            field &&
            displayValueForChoicePlacement(field, placement.label, raw, false) ===
              PLACEMENT_CHECKMARK,
          )
        : Boolean(
            field
              ? formatFieldAnswerValue(field, raw).trim()
              : displayValueForPlacement(
                  fields,
                  placement.variable,
                  placement.label,
                  answers,
                  false,
                ),
          );

      return (
        <span
          key={placement.id}
          className="dynamic-text-anchor pointer-events-none"
          style={{ left: `${placement.xPct}%`, top: `${placement.yPct}%` }}
          title={placement.label}
        >
          <span
            className={cn(
              hasAnswer ? "dynamic-text" : "dynamic-text opacity-80",
              isCheckmark && "placement-checkmark",
            )}
            style={{ color: "#111111", textShadow: "0 0 2px rgba(255,255,255,0.85)" }}
          >
            {text}
          </span>
        </span>
      );
    })
    .filter(Boolean);

  if (markers.length === 0) return null;

  return (
    <div
      className="print-template-canvas pointer-events-none absolute inset-0 overflow-hidden"
      style={cssVars}
    >
      {markers}
    </div>
  );
}

/** Submitted answers placed on the template. */
export function buildPlacementOverlay(
  fields: LiveFormField[],
  placements: PrintFieldPlacement[],
  answers: Record<string, unknown>,
  fontSize = DEFAULT_PRINT_PLACEMENT_FONT_SIZE,
): ReactNode {
  return renderPlacementLayer(fields, placements, answers, fontSize);
}

/** Field labels at saved placements — for Records/Admin layout review before client submit. */
export function buildPlacementLayoutOverlay(form: FormRecord): ReactNode {
  const placements = resolveFormPlacements(form);
  if (!placements.length) return null;
  return renderPlacementLayer(form.fields, placements, {}, resolveFormPlacementFontSize(form), {
    showLabelWhenEmpty: true,
  });
}

export function canShowFilledTemplate(form: FormRecord | null | undefined): form is FormRecord {
  return Boolean(form?.printTemplateImagePath?.trim() && resolveFormPlacements(form).length > 0);
}

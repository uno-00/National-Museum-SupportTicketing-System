import type { FormField } from "@/lib/form-builder-store";
import type { LiveFormField } from "@/lib/api/types";

type ChoiceField = Pick<FormField | LiveFormField, "type" | "label" | "options">;

export const PLACEMENT_CHECKMARK = "✓";

function normalizeOption(value: string): string {
  return value.trim().toLowerCase();
}

export function isChoiceFieldType(type: string): boolean {
  return type === "checkbox" || type === "radio";
}

/** Map a placement label to a field option, when this marker targets one checkbox/radio box. */
export function resolvePlacementOption(field: ChoiceField, placementLabel: string): string | null {
  if (!isChoiceFieldType(field.type)) return null;

  const options = field.options ?? [];
  if (options.length === 0) return null;

  const label = placementLabel.trim();
  if (!label) return null;

  const exact = options.find((option) => option === label);
  if (exact) return exact;

  const caseInsensitive = options.find(
    (option) => normalizeOption(option) === normalizeOption(label),
  );
  if (caseInsensitive) return caseInsensitive;

  // Whole-field marker (legacy) — not tied to a single box.
  if (normalizeOption(label) === normalizeOption(field.label)) return null;

  return null;
}

export function isChoiceOptionSelected(value: unknown, option: string): boolean {
  const target = normalizeOption(option);
  const isOthersOption = /^others?$/.test(target);

  if (Array.isArray(value)) {
    return value.some((item) => {
      const text = String(item);
      if (normalizeOption(text) === target) return true;
      if (isOthersOption && (/^others?\s*:/i.test(text) || /^others?$/i.test(text))) return true;
      return false;
    });
  }

  if (value === true || value === "true") return target === "yes";
  if (value === false || value === "false") return false;

  return normalizeOption(String(value)) === target;
}

/** Checkmark for a specific option placement, empty when unchecked, null = use default text formatting. */
export function displayValueForChoicePlacement(
  field: ChoiceField,
  placementLabel: string,
  value: unknown,
  showMarkerWhenEmpty = false,
): string | null {
  if (!isChoiceFieldType(field.type)) return null;

  const option = resolvePlacementOption(field, placementLabel);
  if (!option) {
    // Never print joined option words on checkbox/radio field markers.
    return "";
  }

  if (isChoiceOptionSelected(value, option)) return PLACEMENT_CHECKMARK;
  if (showMarkerWhenEmpty) return PLACEMENT_CHECKMARK;
  return "";
}

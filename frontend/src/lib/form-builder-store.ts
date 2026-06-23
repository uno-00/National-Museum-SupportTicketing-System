import { format } from "date-fns";

// Form draft types and helpers for the form builder wizard.

export type FieldType =
  | "textbox"
  | "textarea"
  | "dropdown"
  | "checkbox"
  | "radio"
  | "date"
  | "file"
  | "email"
  | "number"
  | "signature";

export interface FormField {
  id: string;
  type: FieldType;
  variable: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  minLength?: number;
  maxLength?: number;
  defaultValue?: string;
}

export interface Signatory {
  id: string;
  division: string;
  name: string;
}

export interface PrintFieldPlacement {
  id: string;
  variable: string;
  label: string;
  /** 0–100, relative to template box */
  xPct: number;
  yPct: number;
}

export interface FormDraft {
  id: string;
  title: string;
  refNumber: string;
  effectivity: string;
  version: string;
  fields: FormField[];
  signatories: Signatory[];
  printTemplate: string;
  /** PNG/JPEG/WebP data URL of the scanned or exported form (optional; can be large). */
  printTemplateImage?: string | null;
  /** Server path to the uploaded template file (PDF or image). */
  printTemplateImagePath?: string | null;
  /** Field variables positioned on the uploaded image. */
  printPlacements?: PrintFieldPlacement[];
  /** Font size (px) for answers placed on the print template preview. */
  printPlacementFontSize?: number;
  workProcedureName?: string;
  workProcedurePath?: string;
  status: "draft" | "published";
  createdAt: number;
}

const VAR_PREFIX: Record<FieldType, string> = {
  textbox: "txt",
  textarea: "txa",
  dropdown: "drp",
  checkbox: "chk",
  radio: "rad",
  date: "dt",
  file: "file",
  email: "eml",
  number: "num",
  signature: "sig",
};

export const DEFAULT_PRINT_PLACEMENT_FONT_SIZE = 10;
export const MIN_PRINT_PLACEMENT_FONT_SIZE = 8;
export const MAX_PRINT_PLACEMENT_FONT_SIZE = 24;

const generateRef = () => {
  const yr = new Date().getFullYear();
  const suffix =
    `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
  return `FRM-${yr}-${suffix}`;
};

export function newDraft(): FormDraft {
  return {
    id: `f${Date.now()}`,
    title: "",
    refNumber: generateRef(),
    effectivity: format(new Date(), "yyyy-MM-dd"),
    version: "v1.0",
    fields: [],
    signatories: [],
    printTemplate: "",
    printPlacements: [],
    printTemplateImage: null,
    printPlacementFontSize: DEFAULT_PRINT_PLACEMENT_FONT_SIZE,
    status: "draft",
    createdAt: Date.now(),
  };
}

export function nextVariable(type: FieldType, fields: FormField[]) {
  const prefix = VAR_PREFIX[type];
  const used = fields.filter((f) => f.variable.startsWith(`{{${prefix}`)).length + 1;
  return `{{${prefix}${String(used).padStart(2, "0")}}}`;
}

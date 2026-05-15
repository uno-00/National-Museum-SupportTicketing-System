// Form list with optional local persistence (browser).

export type FieldType =
  | "textbox" | "textarea" | "dropdown" | "checkbox"
  | "radio" | "date" | "file" | "email" | "number" | "signature";

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
  /** Field variables positioned on the uploaded image. */
  printPlacements?: PrintFieldPlacement[];
  workProcedureName?: string;
  feedbackUrl?: string;
  status: "draft" | "published";
  createdAt: number;
}

const VAR_PREFIX: Record<FieldType, string> = {
  textbox: "txt", textarea: "txa", dropdown: "drp", checkbox: "chk",
  radio: "rad", date: "dt", file: "file", email: "eml", number: "num", signature: "sig",
};

const VALID_DIVISIONS = new Set(["IT", "HR", "Finance", "Operations", "Admin", "Legal"]);
const DEFAULT_DIVISION = "IT";

const STORAGE_KEY = "nmp_forms_v1";

const generateRef = () => {
  const yr = new Date().getFullYear();
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
  return `FRM-${yr}-${suffix}`;
};

function normalizeSignatory(s: Signatory): Signatory {
  const division = VALID_DIVISIONS.has(s.division) ? s.division : DEFAULT_DIVISION;
  return { ...s, division };
}

function normalizeDraft(f: FormDraft): FormDraft {
  return {
    ...f,
    signatories: (f.signatories ?? []).map(normalizeSignatory),
    fields: Array.isArray(f.fields) ? f.fields : [],
    printPlacements: Array.isArray(f.printPlacements) ? f.printPlacements : [],
    printTemplateImage:
      typeof f.printTemplateImage === "string" && f.printTemplateImage.length > 0
        ? f.printTemplateImage
        : null,
  };
}

let state: FormDraft[] = [];
const listeners = new Set<() => void>();
let hydrated = false;

function loadFromStorage(): FormDraft[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed.map((row) => normalizeDraft(row as FormDraft));
  } catch {
    return null;
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  const loaded = loadFromStorage();
  if (loaded) state = loaded;
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    try {
      const light = state.map((row) => ({ ...row, printTemplateImage: null }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(light));
      state = light;
      listeners.forEach((l) => l());
    } catch {
      /* ignore */
    }
  }
}

const emit = () => {
  listeners.forEach((l) => l());
  persist();
};

export const formsStore = {
  subscribe(l: () => void) {
    hydrate();
    listeners.add(l);
    return () => listeners.delete(l);
  },
  get() {
    hydrate();
    return state;
  },
  add(f: FormDraft) {
    hydrate();
    state = [normalizeDraft(f), ...state];
    emit();
  },
  update(id: string, patch: Partial<FormDraft>) {
    hydrate();
    state = state.map((row) => (row.id === id ? normalizeDraft({ ...row, ...patch }) : row));
    emit();
  },
};

export function newDraft(): FormDraft {
  return {
    id: `f${Date.now()}`,
    title: "",
    refNumber: generateRef(),
    effectivity: "",
    version: "v1.0",
    fields: [],
    signatories: [],
    printTemplate: "",
    printPlacements: [],
    printTemplateImage: null,
    status: "draft",
    createdAt: Date.now(),
  };
}

export function nextVariable(type: FieldType, fields: FormField[]) {
  const prefix = VAR_PREFIX[type];
  const used = fields.filter((f) => f.variable.startsWith(`{{${prefix}`)).length + 1;
  return `{{${prefix}${String(used).padStart(2, "0")}}}`;
}

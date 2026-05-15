import { createFileRoute, redirect } from "@tanstack/react-router";
import { getSessionAuthenticated } from "@/lib/auth";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { toast } from "sonner";
import {
  formsStore, newDraft, nextVariable,
  type FieldType, type FormDraft, type FormField, type PrintFieldPlacement, type Signatory,
} from "@/lib/form-builder-store";
import {
  Type, AlignLeft, ChevronDown, CheckSquare, CircleDot,
  Calendar as CalendarIcon, Upload, Mail, Hash, PenLine, Plus, Trash2, GripVertical,
  ArrowLeft, ArrowRight, Save, Link2, FileUp, ExternalLink, Check,
  ZoomIn, ZoomOut, Printer,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buildPrintReadyText, buildSampleSubmissionValues } from "@/lib/print-merge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/forms/new")({
  ssr: false,
  beforeLoad: () => {
    if (!getSessionAuthenticated()) {
      throw redirect({ to: "/", replace: true });
    }
  },
  head: () => ({
    meta: [
      { title: "Technical Assistance Request Form — NMP" },
      { name: "description", content: "Compose a dynamic request form with fields, approval workflow, and printable template." },
    ],
  }),
  component: NewFormWizard,
});

const STEPS = [
  { key: "general", label: "General" },
  { key: "fields", label: "Fields" },
  { key: "workflow", label: "Workflow" },
  { key: "print", label: "Print Template" },
  { key: "procedure", label: "Procedure" },
  { key: "feedback", label: "Feedback" },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

function validateStep(step: StepKey, draft: FormDraft): string | null {
  switch (step) {
    case "general":
      if (!draft.title.trim()) return "Enter a form title before continuing.";
      if (!draft.effectivity) return "Choose a date effectivity before continuing.";
      return null;
    case "fields":
      if (draft.fields.length === 0) return "Add at least one form field before continuing.";
      return null;
    case "workflow":
      if (
        draft.signatories.length === 0 ||
        !draft.signatories.every((s) => s.name.trim() !== "")
      ) {
        return "Select a name for each signatory before continuing.";
      }
      return null;
    case "print":
    case "procedure":
    case "feedback":
      return null;
    default:
      return null;
  }
}

function validateStepsUntil(draft: FormDraft, fromIdx: number, toIdx: number): string | null {
  for (let i = fromIdx; i < toIdx; i++) {
    const err = validateStep(STEPS[i].key, draft);
    if (err) return err;
  }
  return null;
}

const ELEMENTS: { type: FieldType; label: string; icon: React.ElementType }[] = [
  { type: "textbox", label: "Textbox", icon: Type },
  { type: "textarea", label: "Textarea", icon: AlignLeft },
  { type: "dropdown", label: "Dropdown", icon: ChevronDown },
  { type: "checkbox", label: "Checkbox", icon: CheckSquare },
  { type: "radio", label: "Radio", icon: CircleDot },
  { type: "date", label: "Date Picker", icon: CalendarIcon },
  { type: "file", label: "File Upload", icon: Upload },
  { type: "email", label: "Email", icon: Mail },
  { type: "number", label: "Number", icon: Hash },
  { type: "signature", label: "Signature", icon: PenLine },
];

function NewFormWizard() {
  const [draft, setDraft] = useState<FormDraft>(() => newDraft());
  const [step, setStep] = useState<StepKey>("general");
  const [saveError, setSaveError] = useState<string | null>(null);
  const stepIdx = STEPS.findIndex((s) => s.key === step);
  const stepBlockReason = validateStep(step, draft);

  const next = () => {
    if (validateStep(step, draft)) return;
    setSaveError(null);
    setStep(STEPS[Math.min(stepIdx + 1, STEPS.length - 1)].key);
  };
  const prev = () => {
    setSaveError(null);
    setStep(STEPS[Math.max(stepIdx - 1, 0)].key);
  };

  const update = useCallback((patch: Partial<FormDraft>) => {
    setSaveError(null);
    setDraft((d) => ({ ...d, ...patch }));
  }, []);

  const goToStep = useCallback(
    (key: StepKey) => {
      const targetIdx = STEPS.findIndex((s) => s.key === key);
      if (targetIdx > stepIdx && validateStepsUntil(draft, stepIdx, targetIdx)) return;
      setSaveError(null);
      setStep(key);
    },
    [draft, stepIdx],
  );

  const save = () => {
    setSaveError(null);
    const title = draft.title.trim();
    if (!title) {
      setSaveError("Add a form title in General before publishing.");
      goToStep("general");
      return;
    }
    const sigsOk =
      draft.signatories.length > 0 &&
      draft.signatories.every((s) => s.name.trim() !== "");
    if (!sigsOk) {
      setSaveError("Add at least one signatory and choose a name for each, in Workflow.");
      goToStep("workflow");
      return;
    }
    formsStore.add({ ...draft, status: "published" });
    setDraft(newDraft());
    setStep("general");
  };

  return (
    <AppShell>
      <div className="border-b border-border pb-6">
        <h1 className="text-2xl font-semibold">{draft.title || "Untitled form"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {draft.refNumber} · {draft.version}
        </p>
      </div>

      <ol className="wizard-step-track mt-6 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-6">
        {STEPS.map((s, i) => {
          const done = i < stepIdx;
          const active = i === stepIdx;
          return (
            <li key={s.key}>
              <button
                type="button"
                onClick={() => goToStep(s.key)}
                className={`group flex w-full items-center gap-2.5 rounded-lg px-1 py-1 text-left transition-colors ${
                  active ? "opacity-100" : "opacity-75 hover:opacity-100"
                }`}
              >
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs ${active ? "bg-primary text-primary-foreground" : done ? "bg-muted text-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span
                  className={`text-sm font-medium ${active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}
                >
                  {s.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-8">
        {step === "general" && <GeneralStep draft={draft} update={update} />}
        {step === "fields" && <FieldsStep draft={draft} update={update} />}
        {step === "workflow" && (
          <WorkflowStep key={draft.id} draft={draft} update={update} onNext={next} />
        )}
        {step === "print" && <PrintStep draft={draft} update={update} />}
        {step === "procedure" && <ProcedureStep draft={draft} update={update} />}
        {step === "feedback" && <FeedbackStep draft={draft} update={update} />}
      </div>

      {saveError ? (
        <div
          className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {saveError}
        </div>
      ) : null}

      <div className="mt-10 flex flex-col gap-4 border-t border-border/80 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={prev}
          disabled={stepIdx === 0}
          className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        {stepIdx < STEPS.length - 1 ? (
          step === "workflow" ? (
            <span className="text-center text-sm text-muted-foreground sm:text-right">
              Use <strong className="text-foreground">Next</strong> in the Signatories panel above.
            </span>
          ) : (
            <button
              type="button"
              onClick={next}
              disabled={!!stepBlockReason}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          )
        ) : (
          <button
            type="button"
            onClick={save}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            <Save className="h-4 w-4" /> Save & publish
          </button>
        )}
      </div>
    </AppShell>
  );
}

/* ────────────────────────── shared bits ────────────────────────── */

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`wizard-card p-7 ${className}`}>{children}</div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-maroon focus:ring-2 focus:ring-maroon/15";

/* ────────────────────────── 1. General ────────────────────────── */

function GeneralStep({ draft, update }: { draft: FormDraft; update: (p: Partial<FormDraft>) => void }) {
  return (
    <Card>
      <SectionHeader title="General information" subtitle="The opening details that identify this form." />
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <Field label="Form title">
            <input
              className={inputCls}
              placeholder="e.g. Technical Assistance Request"
              value={draft.title}
              onChange={(e) => update({ title: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Reference number" hint="Auto-generated">
          <input className={`${inputCls} font-mono`} value={draft.refNumber} readOnly />
        </Field>
        <Field label="Date effectivity">
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(inputCls, "flex items-center justify-between text-left", !draft.effectivity && "text-muted-foreground")}
              >
                {draft.effectivity ? format(parseISO(draft.effectivity), "PPP") : "Pick a date"}
                <CalendarIcon className="h-4 w-4 opacity-60" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={draft.effectivity ? parseISO(draft.effectivity) : undefined}
                onSelect={(d) => update({ effectivity: d ? format(d, "yyyy-MM-dd") : "" })}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </Field>
        <Field label="Version number">
          <input
            className={inputCls}
            value={draft.version}
            onChange={(e) => update({ version: e.target.value })}
          />
        </Field>
      </div>
    </Card>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      {subtitle && <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

/* ────────────────────────── 2. Fields ────────────────────────── */

function FieldsStep({ draft, update }: { draft: FormDraft; update: (p: Partial<FormDraft>) => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = draft.fields.find((f) => f.id === selectedId) || null;

  const addField = (type: FieldType) => {
    const id = `fld_${Date.now()}`;
    const variable = nextVariable(type, draft.fields);
    const labelMap: Partial<Record<FieldType, string>> = {
      textbox: "Untitled text", textarea: "Long text", dropdown: "Select option",
      checkbox: "Choices", radio: "Choose one", date: "Date", file: "Attachment",
      email: "Email", number: "Number", signature: "Signature",
    };
    const f: FormField = {
      id, type, variable,
      label: labelMap[type] ?? "Field",
      required: false,
      ...(type === "dropdown" || type === "radio" || type === "checkbox"
        ? { options: ["Option 1", "Option 2"] } : {}),
    };
    update({ fields: [...draft.fields, f] });
    setSelectedId(id);
  };

  const updateField = (id: string, patch: Partial<FormField>) =>
    update({ fields: draft.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)) });

  const removeField = (id: string) => {
    update({ fields: draft.fields.filter((f) => f.id !== id) });
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[260px_1fr_300px]">
      {/* Left: elements */}
      <Card className="p-5">
        <div className="text-sm text-muted-foreground">Form elements</div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {ELEMENTS.map((el) => {
            const Icon = el.icon;
            return (
              <button
                key={el.type}
                onClick={() => addField(el.type)}
                className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-background p-3 text-xs text-muted-foreground hover:border-maroon/40 hover:bg-maroon/5 hover:text-foreground"
              >
                <Icon className="h-4 w-4 text-maroon" />
                {el.label}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Middle: preview */}
      <Card>
        <SectionHeader title="Live preview" subtitle="What employees will see when filling this form." />
        <div className="mt-6 rounded-lg border border-dashed border-border bg-paper p-6">
          {draft.fields.length === 0 ? (
            <div className="grid place-items-center py-16 text-center text-sm text-muted-foreground">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-maroon/10 text-maroon">
                <Plus className="h-5 w-5" />
              </div>
              <p className="mt-3">Click any element on the left to drop it here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {draft.fields.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedId(f.id)}
                  className={`group block w-full rounded-lg border p-4 text-left transition-all ${
                    selectedId === f.id
                      ? "border-maroon bg-maroon/5"
                      : "border-transparent bg-background hover:border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">
                          {f.label} {f.required && <span className="text-maroon">*</span>}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">{f.variable}</span>
                      </div>
                      <div className="mt-2">
                        <FieldPreview field={f} />
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeField(f.id); }}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Right: settings */}
      <Card className="p-5">
        <div className="text-sm text-muted-foreground">Field settings</div>
        {!selected ? (
          <p className="mt-4 text-sm text-muted-foreground">Select a field to edit its attributes.</p>
        ) : (
          <div className="mt-4 space-y-4">
            <Field label="Label">
              <input className={inputCls} value={selected.label}
                onChange={(e) => updateField(selected.id, { label: e.target.value })} />
            </Field>
            <Field label="Placeholder">
              <input className={inputCls} value={selected.placeholder ?? ""}
                onChange={(e) => updateField(selected.id, { placeholder: e.target.value })} />
            </Field>
            {(selected.type === "dropdown" || selected.type === "radio" || selected.type === "checkbox") && (
              <Field label="Options" hint="comma-separated">
                <input className={inputCls} value={(selected.options ?? []).join(", ")}
                  onChange={(e) => updateField(selected.id, {
                    options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  })} />
              </Field>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Min length">
                <input type="number" className={inputCls} value={selected.minLength ?? ""}
                  onChange={(e) => updateField(selected.id, { minLength: Number(e.target.value) || undefined })} />
              </Field>
              <Field label="Max length">
                <input type="number" className={inputCls} value={selected.maxLength ?? ""}
                  onChange={(e) => updateField(selected.id, { maxLength: Number(e.target.value) || undefined })} />
              </Field>
            </div>
            <label className="flex cursor-pointer items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm">
              <span>Required field</span>
              <input type="checkbox" checked={selected.required ?? false}
                onChange={(e) => updateField(selected.id, { required: e.target.checked })}
                className="h-4 w-4 accent-maroon" />
            </label>
            <div className="rounded-md bg-muted px-3 py-2">
              <div className="text-xs text-muted-foreground">Variable</div>
              <div className="mt-0.5 font-mono text-xs text-maroon">{selected.variable}</div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function FieldPreview({ field }: { field: FormField }) {
  const cls = "w-full rounded-md border border-border bg-paper px-3 py-1.5 text-sm";
  switch (field.type) {
    case "textarea":
      return <div className={`${cls} h-16 text-muted-foreground`}>{field.placeholder || ""}</div>;
    case "dropdown":
      return (
        <div className={`${cls} flex items-center justify-between text-muted-foreground`}>
          <span>{field.options?.[0] ?? "Select…"}</span><ChevronDown className="h-3.5 w-3.5" />
        </div>
      );
    case "radio":
    case "checkbox":
      return (
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          {(field.options ?? []).map((o) => (
            <span key={o} className="inline-flex items-center gap-1.5">
              <span className={`h-3.5 w-3.5 ${field.type === "radio" ? "rounded-full" : "rounded-sm"} border border-border`} />
              {o}
            </span>
          ))}
        </div>
      );
    case "date":
      return <div className={`${cls} text-muted-foreground`}>YYYY-MM-DD</div>;
    case "file":
      return <div className={`${cls} flex items-center gap-2 text-muted-foreground`}><Upload className="h-3.5 w-3.5" /> Choose file…</div>;
    case "signature":
      return <div className="h-16 rounded-md border border-dashed border-border bg-paper" />;
    default:
      return <div className={`${cls} text-muted-foreground`}>{field.placeholder || ""}</div>;
  }
}

/* ────────────────────────── 3. Workflow ────────────────────────── */

const DIVISIONS = ["IT", "HR", "Finance", "Operations", "Admin", "Legal"] as const;

const NAMES_BY_DIVISION: Record<(typeof DIVISIONS)[number], string[]> = {
  IT: ["Ysa Victorio", "Marco Reyes", "Liane Cruz"],
  HR: ["Patrick Tan", "Aila Mendoza", "Jomar Dela Peña"],
  Finance: ["Aila Mendoza", "Marco Reyes", "Ysa Victorio"],
  Operations: ["Patrick Tan", "Liane Cruz", "Jomar Dela Peña"],
  Admin: ["Ysa Victorio", "Patrick Tan"],
  Legal: ["Marco Reyes", "Aila Mendoza"],
};

function namesForDivision(division: string): string[] {
  const key = division as (typeof DIVISIONS)[number];
  const list = NAMES_BY_DIVISION[key];
  if (list?.length) return list;
  const merged = [...new Set(Object.values(NAMES_BY_DIVISION).flat())];
  return merged.sort();
}

function WorkflowStep({
  draft,
  update,
  onNext,
}: {
  draft: FormDraft;
  update: (p: Partial<FormDraft>) => void;
  onNext: () => void;
}) {
  const didSeedFirst = useRef(false);

  useEffect(() => {
    didSeedFirst.current = false;
  }, [draft.id]);

  useEffect(() => {
    if (draft.signatories.length > 0) return;
    if (didSeedFirst.current) return;
    didSeedFirst.current = true;
    update({
      signatories: [
        { id: `sig_${Date.now()}`, division: DIVISIONS[0], name: "" },
      ],
    });
  }, [draft.id, draft.signatories.length, update]);

  const add = () =>
    update({
      signatories: [
        ...draft.signatories,
        { id: `sig_${Date.now()}`, division: DIVISIONS[0], name: "" },
      ],
    });

  const set = (id: string, patch: Partial<Signatory>) => {
    update({
      signatories: draft.signatories.map((s) => {
        if (s.id !== id) return s;
        let next = { ...s, ...patch };
        if (patch.division !== undefined) {
          const opts = namesForDivision(patch.division);
          if (next.name && !opts.includes(next.name)) next = { ...next, name: "" };
        }
        return next;
      }),
    });
  };

  const remove = (id: string) => {
    if (draft.signatories.length <= 1) return;
    update({ signatories: draft.signatories.filter((s) => s.id !== id) });
  };

  const canContinue =
    draft.signatories.length > 0 && draft.signatories.every((s) => s.name.trim() !== "");

  return (
    <Card>
      <SectionHeader
        title="Signatories"
        subtitle="Choose division and approver for each step. Add another level with Add +1, then continue."
      />

      <div className="mt-6 space-y-5">
        {draft.signatories.map((s, i) => {
          const nameOptions = namesForDivision(s.division);
          return (
            <div
              key={s.id}
              className="rounded-xl border border-border bg-background p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-foreground">Signatory {i + 1}</h3>
                {draft.signatories.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => remove(s.id)}
                    aria-label={`Remove signatory ${i + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`sig-${s.id}-division`}>Division</Label>
                  <select
                    id={`sig-${s.id}-division`}
                    className={inputCls}
                    value={s.division}
                    onChange={(e) => set(s.id, { division: e.target.value })}
                  >
                    {DIVISIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`sig-${s.id}-name`}>Name</Label>
                  <select
                    id={`sig-${s.id}-name`}
                    className={inputCls}
                    value={s.name}
                    onChange={(e) => set(s.id, { name: e.target.value })}
                  >
                    <option value="">Select name…</option>
                    {nameOptions.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <Button type="button" variant="outline" onClick={add} className="w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Add +1
        </Button>
        <Button
          type="button"
          onClick={onNext}
          disabled={!canContinue}
          className="w-full sm:w-auto"
        >
          Next
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {!canContinue && draft.signatories.length > 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Select a name for each signatory before continuing.
        </p>
      ) : null}

      {draft.signatories.length > 0 && canContinue ? (
        <div className="mt-8 rounded-xl border border-border bg-paper p-5">
          <div className="text-sm text-muted-foreground">
            Routing preview
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <Pill>Employee</Pill>
            {draft.signatories.map((s) => (
              <span key={s.id} className="flex items-center gap-2">
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                <Pill>
                  {s.name} · {s.division}
                </Pill>
              </span>
            ))}
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            <Pill tone="dark">Completed</Pill>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function Pill({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "dark" }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        tone === "dark"
          ? "bg-ink text-paper shadow-sm"
          : "bg-maroon/8 text-maroon ring-1 ring-maroon/15"
      }`}
    >
      {children}
    </span>
  );
}

/* ────────────────────────── 4. Print Template ────────────────────────── */

const MAX_TEMPLATE_IMAGE_BYTES = 4 * 1024 * 1024;

function clampPct(n: number): number {
  return Math.min(100, Math.max(0, n));
}

function PrintStep({ draft, update }: { draft: FormDraft; update: (p: Partial<FormDraft>) => void }) {
  const placements = draft.printPlacements ?? [];
  const image = draft.printTemplateImage ?? null;
  const canvasRef = useRef<HTMLDivElement>(null);
  const placementsRef = useRef(placements);
  placementsRef.current = placements;

  const [zoom, setZoom] = useState(1);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mergedPrintPreview = useMemo(
    () => buildPrintReadyText(draft.printTemplate ?? "", buildSampleSubmissionValues(draft.fields)),
    [draft.printTemplate, draft.fields],
  );

  const variables = useMemo(
    () => draft.fields.map((f) => ({ variable: f.variable, label: f.label })),
    [draft.fields],
  );

  const setPlacements = (next: PrintFieldPlacement[]) => update({ printPlacements: next });

  const addPlacement = (variable: string, label: string, xPct: number, yPct: number) => {
    const id = `pl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setPlacements([
      ...placementsRef.current,
      { id, variable, label, xPct: clampPct(xPct), yPct: clampPct(yPct) },
    ]);
  };

  const removePlacement = (id: string) => {
    setPlacements(placementsRef.current.filter((p) => p.id !== id));
  };

  const clearPlacements = () => {
    setPlacements([]);
    toast.info("All field markers removed from the template.");
  };

  const onUploadImage = (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/i.test(file.type)) {
      toast.error("Please upload a PNG, JPG, or WebP image of your form.");
      return;
    }
    if (file.size > MAX_TEMPLATE_IMAGE_BYTES) {
      toast.error("Image is too large (max 4 MB). Try compressing or a smaller scan.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      update({ printTemplateImage: reader.result as string });
      toast.success("Template image loaded. Drag fields from the left onto the form.");
    };
    reader.onerror = () => toast.error("Could not read that file.");
    reader.readAsDataURL(file);
  };

  const replaceTemplate = () => {
    fileInputRef.current?.click();
  };

  const saveTemplateLayout = () => {
    const lines = (draft.printPlacements ?? []).map(
      (p) => `${p.variable}\t${p.xPct.toFixed(2)}\t${p.yPct.toFixed(2)}\t${p.label}`,
    );
    const block = ["[NMP placements]", ...lines, "[/NMP placements]"].join("\n");
    update({ printTemplate: block });
    toast.success("Layout saved. Placement data is stored with your form.");
  };

  useEffect(() => {
    if (!draggingId) return;
    const onMove = (e: PointerEvent) => {
      const el = canvasRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const xPct = clampPct(((e.clientX - rect.left) / rect.width) * 100);
      const yPct = clampPct(((e.clientY - rect.top) / rect.height) * 100);
      update({
        printPlacements: placementsRef.current.map((p) =>
          p.id === draggingId ? { ...p, xPct, yPct } : p,
        ),
      });
    };
    const onUp = () => setDraggingId(null);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { capture: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp, { capture: true });
    };
  }, [draggingId, update]);

  const openPrintPreview = () => setPrintPreviewOpen(true);

  const copyMergedPreview = async () => {
    try {
      await navigator.clipboard.writeText(mergedPrintPreview);
      toast.success("Copied merged text (no placeholders).");
    } catch {
      toast.error("Could not copy to clipboard.");
    }
  };

  const printMergedPreview = () => {
    const w = window.open("", "_blank");
    if (!w) {
      toast.error("Pop-up blocked. Allow pop-ups to print.");
      return;
    }
    const safe = mergedPrintPreview
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    w.document.open();
    w.document.write(
      `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>Print preview — NMP</title>` +
        `<style>body{font-family:system-ui,-apple-system,sans-serif;padding:1.25in;max-width:8in;margin:0 auto;white-space:pre-wrap;font-size:12pt;line-height:1.45;color:#111}</style></head>` +
        `<body><pre style="white-space:pre-wrap;font-family:inherit;margin:0">${safe}</pre></body></html>`,
    );
    w.document.close();
    w.focus();
    requestAnimationFrame(() => {
      try {
        w.print();
      } catch {
        /* noop */
      }
    });
  };

  const onDropOnCanvas = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = canvasRef.current;
    if (!el) return;
    let data: { variable: string; label: string };
    try {
      data = JSON.parse(e.dataTransfer.getData("application/json"));
      if (!data?.variable) return;
    } catch {
      return;
    }
    const rect = el.getBoundingClientRect();
    const xPct = clampPct(((e.clientX - rect.left) / rect.width) * 100);
    const yPct = clampPct(((e.clientY - rect.top) / rect.height) * 100);
    addPlacement(data.variable, data.label, xPct, yPct);
  };

  return (
    <>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,240px)_1fr_minmax(0,260px)]">
      <Card className="p-5">
        <SectionHeader
          title="Available fields"
          subtitle="Drag a field onto the template. Add fields in the Fields step first."
        />
        <div className="mt-4 max-h-[min(70vh,560px)] space-y-2 overflow-y-auto pr-1">
          {variables.length === 0 ? (
            <p className="text-sm text-muted-foreground">No fields yet — go back to Fields and add elements.</p>
          ) : (
            variables.map((v) => (
              <div
                key={v.variable}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/json", JSON.stringify(v));
                  e.dataTransfer.effectAllowed = "copy";
                }}
                className="flex cursor-grab items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-left text-xs shadow-sm active:cursor-grabbing hover:border-maroon/40 hover:bg-maroon/5"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate font-medium text-foreground">{v.label}</span>
                </span>
                <span className="shrink-0 font-mono text-[10px] text-maroon">{v.variable}</span>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="min-w-0 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <SectionHeader
            title="Print template"
            subtitle="Upload a scan or export of your paper form (image), then drop fields where answers should print."
          />
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => onUploadImage(e.target.files)}
            />
            <Button type="button" variant="outline" size="sm" onClick={replaceTemplate}>
              <FileUp className="h-4 w-4" />
              Upload template
            </Button>
            <Button type="button" variant="default" size="sm" onClick={saveTemplateLayout}>
              <Check className="h-4 w-4" />
              Save layout
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={openPrintPreview}>
              Preview merged print
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-b border-border pb-4">
          <span className="text-xs text-muted-foreground">Zoom</span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setZoom((z) => Math.max(0.5, Math.round((z - 0.1) * 10) / 10))}
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="min-w-[3rem] text-center text-xs tabular-nums">{Math.round(zoom * 100)}%</span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setZoom((z) => Math.min(2, Math.round((z + 0.1) * 10) / 10))}
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-4 max-h-[min(75vh,720px)] overflow-auto rounded-lg border border-border bg-muted/20 p-4">
          <div className="mx-auto origin-top" style={{ transform: `scale(${zoom})` }}>
            <div
              ref={canvasRef}
              className="relative inline-block max-w-full overflow-hidden rounded-md bg-paper shadow-sm ring-1 ring-border"
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "copy";
              }}
              onDrop={onDropOnCanvas}
            >
              {image ? (
                <img src={image} alt="Form template" className="block max-h-[none] w-full max-w-full select-none" draggable={false} />
              ) : (
                <div className="flex min-h-[420px] w-full min-w-[280px] max-w-3xl flex-col items-center justify-center gap-2 bg-muted/30 px-6 text-center sm:min-w-[480px]">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">Upload your form image</p>
                  <p className="max-w-sm text-xs text-muted-foreground">
                    Use a PNG or JPG scan of the blank form. Then drag fields from the left and drop them where each
                    answer should appear.
                  </p>
                  <Button type="button" variant="secondary" size="sm" className="mt-2" onClick={() => fileInputRef.current?.click()}>
                    Choose image…
                  </Button>
                </div>
              )}

              {placements.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={cn(
                    "absolute z-10 max-w-[min(140px,40vw)] -translate-x-1/2 -translate-y-1/2 cursor-grab rounded border-2 border-dashed border-sky-600 bg-sky-500/15 px-2 py-1 text-left text-[10px] font-mono text-sky-900 shadow-sm active:cursor-grabbing dark:border-sky-400 dark:bg-sky-950/40 dark:text-sky-100",
                    draggingId === p.id && "ring-2 ring-sky-500",
                  )}
                  style={{ left: `${p.xPct}%`, top: `${p.yPct}%` }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
                    setDraggingId(p.id);
                  }}
                  onPointerUp={(e) => {
                    try {
                      (e.currentTarget as HTMLButtonElement).releasePointerCapture(e.pointerId);
                    } catch {
                      /* noop */
                    }
                    setDraggingId(null);
                  }}
                >
                  <span className="line-clamp-2 block text-[9px] font-sans font-medium normal-case text-foreground">
                    {p.label}
                  </span>
                  <span className="text-[9px] text-sky-800 dark:text-sky-200">{p.variable}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

      </Card>

      <Card className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-sm text-muted-foreground">Placed fields</div>
            <p className="mt-1 text-xs text-muted-foreground">{placements.length} on template</p>
          </div>
          {placements.length > 0 ? (
            <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={clearPlacements}>
              Clear all
            </Button>
          ) : null}
        </div>
        <ul className="mt-4 max-h-[min(70vh,560px)] space-y-2 overflow-y-auto">
          {placements.length === 0 ? (
            <li className="text-sm text-muted-foreground">No fields placed yet.</li>
          ) : (
            placements.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
                  <span className="min-w-0 truncate">
                    <span className="font-medium text-foreground">{p.label}</span>
                    <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">{p.variable}</span>
                  </span>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removePlacement(p.id)}
                  aria-label={`Remove ${p.label}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))
          )}
        </ul>
      </Card>
    </div>

      <Dialog open={printPreviewOpen} onOpenChange={setPrintPreviewOpen}>
        <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col gap-0 p-0 sm:max-w-2xl">
          <DialogHeader className="border-b border-border px-6 py-4 text-left">
            <DialogTitle>Final print preview</DialogTitle>
            <DialogDescription>
              Answers shown are samples only. With a real submission, the employee&apos;s data is merged in. This text contains no{" "}
              <span className="font-mono">{"{{}}"}</span> placeholders.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <pre className="whitespace-pre-wrap break-words rounded-md border border-border bg-paper p-4 font-sans text-sm leading-relaxed text-ink">
              {mergedPrintPreview ||
                "(Nothing to preview yet — add fields, place them on the template, then click Save layout.)"}
            </pre>
          </div>
          <DialogFooter className="border-t border-border px-6 py-4 sm:justify-between">
            <Button type="button" variant="outline" onClick={() => setPrintPreviewOpen(false)}>
              Close
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={copyMergedPreview}>
                Copy
              </Button>
              <Button type="button" onClick={printMergedPreview}>
                <Printer className="h-4 w-4" />
                Print (merged only)
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ────────────────────────── 5. Procedure ────────────────────────── */

function ProcedureStep({ draft, update }: { draft: FormDraft; update: (p: Partial<FormDraft>) => void }) {
  return (
    <Card>
      <SectionHeader title="Work procedure" subtitle="Upload the SOP that accompanies this form (PDF only)." />
      <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-paper p-12 text-center transition-colors hover:border-maroon/40 hover:bg-maroon/5">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-maroon/10 text-maroon">
          <Upload className="h-5 w-5" />
        </div>
        <div className="mt-3 text-sm font-medium text-foreground">
          {draft.workProcedureName || "Drop a PDF or click to browse"}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">PDF only · max 20 MB</div>
        <input type="file" accept="application/pdf" className="hidden"
          onChange={(e) => update({ workProcedureName: e.target.files?.[0]?.name })} />
      </label>
    </Card>
  );
}

/* ────────────────────────── 6. Feedback ────────────────────────── */

function FeedbackStep({ draft, update }: { draft: FormDraft; update: (p: Partial<FormDraft>) => void }) {
  const [open, setOpen] = useState(false);
  const valid = !draft.feedbackUrl || /^https?:\/\//i.test(draft.feedbackUrl);

  return (
    <Card>
      <SectionHeader title="Feedback link" subtitle="Add a survey URL employees see after completion." />
      <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto]">
        <Field label="Feedback URL">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            <input
              className={inputCls}
              placeholder="https://forms.google.com/feedback"
              value={draft.feedbackUrl ?? ""}
              onChange={(e) => update({ feedbackUrl: e.target.value })}
            />
          </div>
          {!valid && <p className="mt-1 text-xs text-destructive">URL must start with http:// or https://</p>}
        </Field>
        <div className="flex items-end">
          <button
            onClick={() => setOpen(true)}
            disabled={!draft.feedbackUrl || !valid}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ExternalLink className="h-4 w-4" /> Preview
          </button>
        </div>
      </div>

      {open && draft.feedbackUrl && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-3xl overflow-hidden rounded-lg border border-border bg-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-maroon" />
                <span className="truncate text-sm">{draft.feedbackUrl}</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-sm text-muted-foreground hover:text-foreground">Close</button>
            </div>
            <iframe src={draft.feedbackUrl} title="Feedback preview" className="h-[60vh] w-full bg-paper" />
          </div>
        </div>
      )}
    </Card>
  );
}

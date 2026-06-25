import { useEffect, useState } from "react";
import { ChevronDown, GripVertical, Plus, Trash2, Upload } from "lucide-react";
import {
  nextVariable,
  type FieldType,
  type FormDraft,
  type FormField,
} from "@/lib/form-builder-store";
import {
  TA_SERVICE_TYPE_OPTIONS,
  normalizeChoiceFieldOptions,
  taServiceTypesPlaceholder,
} from "@/lib/form-builder/ta-service-types";
import { FIELD_ELEMENTS } from "@/lib/form-builder/constants";
import { inputCls, SectionHeader, WizardCard, WizardField } from "../shared";

type FieldsStepProps = {
  draft: FormDraft;
  update: (patch: Partial<FormDraft>) => void;
};

function isOptionField(type: FormField["type"]) {
  return type === "dropdown" || type === "radio" || type === "checkbox";
}

function parseFieldOptions(text: string): string[] {
  return text
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function formatFieldOptions(options: string[] | undefined) {
  return normalizeChoiceFieldOptions(options).join(", ");
}

export function FieldsStep({ draft, update }: FieldsStepProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragFieldId, setDragFieldId] = useState<string | null>(null);
  const [optionsDraft, setOptionsDraft] = useState("");
  const selected = draft.fields.find((f) => f.id === selectedId) || null;

  const updateField = (id: string, patch: Partial<FormField>) =>
    update({ fields: draft.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)) });

  const commitOptionsDraft = (fieldId: string, draftText = optionsDraft) => {
    const field = draft.fields.find((f) => f.id === fieldId);
    if (!field || !isOptionField(field.type)) return;
    updateField(fieldId, { options: parseFieldOptions(draftText) });
  };

  const selectField = (id: string) => {
    if (selectedId && selectedId !== id) commitOptionsDraft(selectedId);
    setSelectedId(id);
  };

  useEffect(() => {
    if (!selected || !isOptionField(selected.type)) {
      setOptionsDraft("");
      return;
    }
    setOptionsDraft(formatFieldOptions(selected.options));
  }, [selected?.id]);

  const reorderFields = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const fromIdx = draft.fields.findIndex((f) => f.id === fromId);
    const toIdx = draft.fields.findIndex((f) => f.id === toId);
    if (fromIdx < 0 || toIdx < 0) return;
    const next = [...draft.fields];
    const [item] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, item);
    update({ fields: next });
  };

  const addField = (type: FieldType) => {
    const id = `fld_${Date.now()}`;
    const variable = nextVariable(type, draft.fields);
    const labelMap: Partial<Record<FieldType, string>> = {
      textbox: "Untitled text",
      textarea: "Long text",
      dropdown: "Select option",
      checkbox: "Type",
      radio: "Choose one",
      date: "Date",
      file: "Attachment",
      email: "Email",
      number: "Number",
      signature: "Signature",
    };
    const f: FormField = {
      id,
      type,
      variable,
      label: labelMap[type] ?? "Field",
      required: false,
      ...(type === "dropdown" || type === "radio" || type === "checkbox"
        ? {
            options:
              type === "checkbox"
                ? [...TA_SERVICE_TYPE_OPTIONS]
                : ["Option 1", "Option 2"],
          }
        : {}),
    };
    update({ fields: [...draft.fields, f] });
    selectField(id);
  };

  const removeField = (id: string) => {
    update({ fields: draft.fields.filter((f) => f.id !== id) });
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[260px_1fr_300px]">
      <WizardCard className="p-5">
        <div className="text-sm text-muted-foreground">Form elements</div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {FIELD_ELEMENTS.map((el) => {
            const Icon = el.icon;
            return (
              <button
                key={el.type}
                type="button"
                onClick={() => addField(el.type)}
                className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-background p-3 text-xs text-muted-foreground hover:border-maroon/40 hover:bg-maroon/5 hover:text-foreground"
              >
                <Icon className="h-4 w-4 text-maroon" />
                {el.label}
              </button>
            );
          })}
        </div>
      </WizardCard>

      <WizardCard>
        <SectionHeader
          title="Live preview"
          subtitle="What employees will see when filling this form. Drag rows to reorder."
        />
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
                  type="button"
                  draggable
                  onClick={() => selectField(f.id)}
                  onDragStart={(e) => {
                    setDragFieldId(f.id);
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", f.id);
                  }}
                  onDragEnd={() => setDragFieldId(null)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const fromId = e.dataTransfer.getData("text/plain") || dragFieldId;
                    if (fromId) reorderFields(fromId, f.id);
                    setDragFieldId(null);
                  }}
                  className={`group block w-full rounded-lg border p-4 text-left transition-all ${
                    selectedId === f.id
                      ? "border-maroon bg-maroon/5"
                      : dragFieldId === f.id
                        ? "border-dashed border-maroon/50 opacity-60"
                        : "border-transparent bg-background hover:border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-3.5 w-3.5 cursor-grab text-muted-foreground active:cursor-grabbing" />
                        <span className="text-sm font-medium text-foreground">
                          {f.label} {f.required ? <span className="text-maroon">*</span> : null}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {f.variable}
                        </span>
                      </div>
                      <div className="mt-2">
                        <FieldPreview field={f} />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeField(f.id);
                      }}
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
      </WizardCard>

      <WizardCard className="p-5">
        <div className="text-sm text-muted-foreground">Field settings</div>
        {!selected ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Select a field to edit its attributes.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            <WizardField label="Label">
              <input
                className={inputCls}
                value={selected.label}
                onChange={(e) => updateField(selected.id, { label: e.target.value })}
              />
            </WizardField>
            <WizardField label="Placeholder">
              <input
                className={inputCls}
                value={selected.placeholder ?? ""}
                onChange={(e) => updateField(selected.id, { placeholder: e.target.value })}
              />
            </WizardField>
            {isOptionField(selected.type) && (
              <WizardField label="Options" hint="comma-separated">
                <input
                  className={inputCls}
                  value={optionsDraft}
                  placeholder={taServiceTypesPlaceholder()}
                  onChange={(e) => setOptionsDraft(e.target.value)}
                  onBlur={() => commitOptionsDraft(selected.id)}
                />
                {selected.type === "checkbox" ? (
                  <button
                    type="button"
                    className="mt-2 text-xs font-medium text-maroon hover:underline"
                    onClick={() => {
                      const text = taServiceTypesPlaceholder();
                      setOptionsDraft(text);
                      commitOptionsDraft(selected.id, text);
                    }}
                  >
                    Use TA service types (6 options)
                  </button>
                ) : null}
                <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                  Separate each choice with a comma. Client can check all services that apply.
                </p>
              </WizardField>
            )}
            <div className="grid grid-cols-2 gap-3">
              <WizardField label="Min length">
                <input
                  type="number"
                  className={inputCls}
                  value={selected.minLength ?? ""}
                  onChange={(e) =>
                    updateField(selected.id, { minLength: Number(e.target.value) || undefined })
                  }
                />
              </WizardField>
              <WizardField label="Max length">
                <input
                  type="number"
                  className={inputCls}
                  value={selected.maxLength ?? ""}
                  onChange={(e) =>
                    updateField(selected.id, { maxLength: Number(e.target.value) || undefined })
                  }
                />
              </WizardField>
            </div>
            <label className="flex cursor-pointer items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm">
              <span>Required field</span>
              <input
                type="checkbox"
                checked={selected.required ?? false}
                onChange={(e) => updateField(selected.id, { required: e.target.checked })}
                className="h-4 w-4 accent-maroon"
              />
            </label>
            <div className="rounded-md bg-muted px-3 py-2">
              <div className="text-xs text-muted-foreground">Variable</div>
              <div className="mt-0.5 font-mono text-xs text-maroon">{selected.variable}</div>
            </div>
          </div>
        )}
      </WizardCard>
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
          <span>{field.options?.[0] ?? "Select…"}</span>
          <ChevronDown className="h-3.5 w-3.5" />
        </div>
      );
    case "radio":
      return (
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          {normalizeChoiceFieldOptions(field.options).map((o) => (
            <span key={o} className="inline-flex items-center gap-1.5">
              <span className="h-3.5 w-3.5 rounded-full border border-border" />
              {o}
            </span>
          ))}
        </div>
      );
    case "checkbox":
      return (
        <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          {normalizeChoiceFieldOptions(field.options).map((o) => {
            const isOthers = /^others?$/i.test(o.trim());
            return (
              <span key={o} className="inline-flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 shrink-0 rounded-sm border border-border" />
                <span className="min-w-0">{o}</span>
                {isOthers ? (
                  <span className="ml-1 h-4 min-w-[5rem] flex-1 border-b border-border/80" />
                ) : null}
              </span>
            );
          })}
        </div>
      );
    case "date":
      return <div className={`${cls} text-muted-foreground`}>YYYY-MM-DD</div>;
    case "file":
      return (
        <div className={`${cls} flex items-center gap-2 text-muted-foreground`}>
          <Upload className="h-3.5 w-3.5" /> Choose file…
        </div>
      );
    case "signature":
      return <div className="h-16 rounded-md border border-dashed border-border bg-paper" />;
    default:
      return <div className={`${cls} text-muted-foreground`}>{field.placeholder || ""}</div>;
  }
}

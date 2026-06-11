import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { FormDraft } from "@/lib/form-builder-store";
import { cn } from "@/lib/utils";
import { inputCls, SectionHeader, WizardCard, WizardField } from "../shared";

type GeneralStepProps = {
  draft: FormDraft;
  update: (patch: Partial<FormDraft>) => void;
};

export function GeneralStep({ draft, update }: GeneralStepProps) {
  return (
    <WizardCard>
      <SectionHeader
        title="General information"
        subtitle="The opening details that identify this form."
      />
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <WizardField label="Form title">
            <input
              className={inputCls}
              placeholder="e.g. Technical Assistance Request"
              value={draft.title}
              onChange={(e) => update({ title: e.target.value })}
            />
          </WizardField>
        </div>
        <WizardField label="Reference number" hint="Auto-generated">
          <input className={`${inputCls} font-mono`} value={draft.refNumber} readOnly />
        </WizardField>
        <WizardField label="Date effectivity" hint="Required before submit">
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  inputCls,
                  "flex items-center justify-between text-left",
                  !draft.effectivity && "text-muted-foreground",
                )}
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
                className={cn("pointer-events-auto p-3")}
              />
            </PopoverContent>
          </Popover>
        </WizardField>
        <WizardField label="Version number">
          <input
            className={inputCls}
            value={draft.version}
            onChange={(e) => update({ version: e.target.value })}
          />
        </WizardField>
      </div>
    </WizardCard>
  );
}

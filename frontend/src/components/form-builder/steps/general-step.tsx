import { EffectivityDatePicker } from "@/components/form-builder/EffectivityDatePicker";
import type { FormDraft } from "@/lib/form-builder-store";
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
        <WizardField label="Date effectivity" hint="Pick any date">
          <EffectivityDatePicker
            value={draft.effectivity}
            onChange={(effectivity) => update({ effectivity })}
          />
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

import type { FormRecord } from "@/lib/api/types";
import type { LiveFormField } from "@/lib/api/types";
import { DataPanel } from "@/components/layout/workspace-ui";

type FormFieldsSummaryProps = {
  form: FormRecord;
};

export function FormFieldsSummary({ form }: FormFieldsSummaryProps) {
  if (!form.fields?.length) return null;

  return (
    <DataPanel title={`Form fields (${form.fields.length})`}>
      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
        {form.fields.map((field: LiveFormField) => (
          <div
            key={field.id}
            className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2.5"
          >
            <p className="text-sm font-medium">
              {field.label}
              {field.required ? <span className="text-destructive"> *</span> : null}
            </p>
            <p className="mt-0.5 text-xs capitalize text-muted-foreground">{field.type}</p>
          </div>
        ))}
      </div>
    </DataPanel>
  );
}

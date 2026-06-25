import { Loader2, Upload } from "lucide-react";
import { SignaturePad } from "@/components/client/SignaturePad";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { LiveFormField } from "@/lib/api/types";
import { normalizeChoiceOptionsForField } from "@/lib/form-field-normalize";
import { cn } from "@/lib/utils";

type ClientFieldInputProps = {
  field: LiveFormField;
  value: unknown;
  onChange: (value: unknown) => void;
  onFile?: (file: File) => void;
  uploading?: boolean;
};

export function ClientFieldInput({
  field,
  value,
  onChange,
  onFile,
  uploading = false,
}: ClientFieldInputProps) {
  const id = `field-${field.variable}`;
  const label = (
    <Label htmlFor={id}>
      {field.label}
      {field.required ? <span className="text-destructive"> *</span> : null}
    </Label>
  );

  switch (field.type) {
    case "textarea":
      return (
        <div className="space-y-2">
          {label}
          <Textarea
            id={id}
            value={String(value ?? "")}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
          />
        </div>
      );

    case "dropdown":
      return (
        <div className="space-y-2">
          {label}
          <select
            id={id}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm"
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
          >
            <option value="">Select…</option>
            {normalizeChoiceOptionsForField(field).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      );

    case "radio":
      return (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium leading-none">
            {field.label}
            {field.required ? <span className="text-destructive"> *</span> : null}
          </legend>
          <div className="space-y-2">
            {normalizeChoiceOptionsForField(field).map((option) => (
              <label key={option} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={field.variable}
                  checked={value === option}
                  onChange={() => onChange(option)}
                  required={field.required}
                />
                {option}
              </label>
            ))}
          </div>
        </fieldset>
      );

    case "checkbox": {
      const options = normalizeChoiceOptionsForField(field);
      const selected = Array.isArray(value) ? value.map(String) : [];
      const isOthersOption = (option: string) => /^others?$/i.test(option.trim());
      const othersEntry = selected.find((item) => /^others?\s*:/i.test(item));
      const othersText = othersEntry?.replace(/^others?\s*:\s*/i, "") ?? "";
      const isOptionChecked = (option: string) =>
        selected.includes(option) ||
        (isOthersOption(option) &&
          selected.some((item) => isOthersOption(item) || /^others?\s*:/i.test(item)));

      if (options.length === 0) {
        return (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => onChange(e.target.checked)}
            />
            {field.label}
            {field.required ? <span className="text-destructive"> *</span> : null}
          </label>
        );
      }

      return (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium leading-none">
            {field.label}
            {field.required ? <span className="text-destructive"> *</span> : null}
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {options.map((option) => {
              const checked = isOptionChecked(option);
              const showOthersInput = isOthersOption(option) && checked;
              return (
                <div key={option} className={showOthersInput ? "sm:col-span-2" : undefined}>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        let next = selected.filter(
                          (item) => item !== option && !/^others?\s*:/i.test(item),
                        );
                        if (e.target.checked) {
                          next = [...next, option];
                        }
                        onChange(next);
                      }}
                    />
                    {option}
                  </label>
                  {showOthersInput ? (
                    <Input
                      className="mt-2"
                      value={othersText}
                      placeholder="Please specify"
                      onChange={(e) => {
                        const detail = e.target.value;
                        let next = selected.filter(
                          (item) => item !== option && !/^others?\s*:/i.test(item),
                        );
                        next = [...next, detail.trim() ? `Others: ${detail.trim()}` : option];
                        onChange(next);
                      }}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </fieldset>
      );
    }

    case "date":
      return (
        <div className="space-y-2">
          {label}
          <Input
            id={id}
            type="date"
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
          />
        </div>
      );

    case "email":
      return (
        <div className="space-y-2">
          {label}
          <Input
            id={id}
            type="email"
            value={String(value ?? "")}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
          />
        </div>
      );

    case "number":
      return (
        <div className="space-y-2">
          {label}
          <Input
            id={id}
            type="number"
            value={String(value ?? "")}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
          />
        </div>
      );

    case "signature":
      return (
        <div className="space-y-2">
          {label}
          <SignaturePad
            value={typeof value === "string" ? value : null}
            onChange={(dataUrl) => onChange(dataUrl)}
          />
        </div>
      );

    case "file":
      return (
        <div className="space-y-2">
          {label}
          <label
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted",
              uploading && "pointer-events-none opacity-60",
            )}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 shrink-0" />
            )}
            <span className="min-w-0 truncate">
              {uploading
                ? "Uploading…"
                : typeof value === "string" && value
                  ? "File uploaded"
                  : "Choose PDF file"}
            </span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && onFile) void onFile(file);
                e.target.value = "";
              }}
            />
          </label>
          {typeof value === "string" && value ? (
            <p className="text-xs text-green-700">✓ File ready to submit</p>
          ) : (
            <p className="text-xs text-muted-foreground">PDF only.</p>
          )}
        </div>
      );

    default:
      return (
        <div className="space-y-2">
          {label}
          <Input
            id={id}
            value={String(value ?? "")}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
          />
        </div>
      );
  }
}

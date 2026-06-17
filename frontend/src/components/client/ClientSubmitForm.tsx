import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api/client";
import type { FormRecord, LiveFormField } from "@/lib/api/types";
import { useAuth } from "@/lib/auth";
import { CLIENT_REQUESTS } from "@/lib/navigation";

type ClientSubmitFormProps = {
  initialFormId?: string;
};

export function ClientSubmitForm({ initialFormId }: ClientSubmitFormProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedFormId, setSelectedFormId] = useState(initialFormId ?? "");
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [uploading, setUploading] = useState(false);

  const { data: formsData, isLoading: formsLoading } = useQuery({
    queryKey: ["published-forms"],
    queryFn: () => api.publishedForms(),
  });

  const { data: formData, isLoading: formLoading } = useQuery({
    queryKey: ["published-form", selectedFormId],
    queryFn: () => api.getPublishedForm(selectedFormId),
    enabled: Boolean(selectedFormId),
  });

  useEffect(() => {
    if (initialFormId) setSelectedFormId(initialFormId);
  }, [initialFormId]);

  const form = formData?.form;

  const submitMutation = useMutation({
    mutationFn: (f: FormRecord) => {
      const attachment = answers.__attachment as
        | { url: string; originalName: string; mimeType: string }
        | undefined;
      const { __attachment: _, ...fieldAnswers } = answers;
      return api.createTicket({
        formId: f._id,
        answers: fieldAnswers,
        attachmentUrl: attachment?.url,
        attachmentName: attachment?.originalName,
        attachmentMimeType: attachment?.mimeType,
      });
    },
    onSuccess: (res) => {
      toast.success("Request submitted", {
        description: `Ticket ${res.ticket.ticketNumber} is pending admin approval.`,
      });
      setAnswers({});
      void queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
      void navigate({ to: CLIENT_REQUESTS });
    },
    onError: (err: Error) => toast.error(err.message || "Submission failed"),
  });

  const setField = (variable: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [variable]: value }));
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const { file: uploaded } = await api.uploadFile(file);
      setAnswers((prev) => ({
        ...prev,
        __attachment: {
          url: uploaded.url,
          originalName: uploaded.originalName,
          mimeType: uploaded.mimeType,
        },
      }));
      toast.success("File uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (formsLoading) {
    return (
      <div className="form-panel flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading available forms…
      </div>
    );
  }

  const forms = formsData?.items ?? [];
  if (forms.length === 0) {
    return (
      <div className="form-panel py-12 text-center text-sm text-muted-foreground">
        No published forms are available yet. Please check back later or contact your administrator.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="page-hero">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Submit Request</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Submitting as <strong className="text-foreground">{user?.name ?? user?.email ?? "your account"}</strong>.
          This request will appear in your list only.
        </p>
      </div>

      <div className="form-panel space-y-5">
        <div className="space-y-2">
          <Label>Select form</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm"
          value={selectedFormId}
          onChange={(e) => {
            setSelectedFormId(e.target.value);
            setAnswers({});
          }}
        >
          <option value="">Select a form…</option>
          {forms.map((f) => (
            <option key={f._id} value={f._id}>{f.title}</option>
          ))}
        </select>
      </div>

      {selectedFormId && formLoading ? (
        <p className="text-sm text-muted-foreground">Loading form fields…</p>
      ) : form ? (
        <form
          className="space-y-5 border-t border-border/70 pt-5"
          onSubmit={(e) => {
            e.preventDefault();
            submitMutation.mutate(form);
          }}
        >
          {form.fields.map((field) => (
            <FieldInput
              key={field.id}
              field={field}
              value={answers[field.variable]}
              onChange={(v) => setField(field.variable, v)}
              onFile={handleFileUpload}
              uploading={uploading}
            />
          ))}
          <Button type="submit" disabled={submitMutation.isPending} className="shadow-sm">
            {submitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit request"}
          </Button>
        </form>
      ) : null}
      </div>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
  onFile,
  uploading,
}: {
  field: LiveFormField;
  value: unknown;
  onChange: (v: unknown) => void;
  onFile: (f: File) => void;
  uploading: boolean;
}) {
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
          <Textarea id={id} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} required={field.required} />
        </div>
      );
    case "dropdown":
      return (
        <div className="space-y-2">
          {label}
          <select
            id={id}
            className="flex h-10 w-full rounded-md border px-3 text-sm"
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
          >
            <option value="">Select…</option>
            {(field.options ?? []).map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
      );
    case "checkbox":
      return (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
          {field.label}
        </label>
      );
    case "date":
      return (
        <div className="space-y-2">
          {label}
          <Input id={id} type="date" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} required={field.required} />
        </div>
      );
    case "file":
      return (
        <div className="space-y-2">
          {label}
          <label className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted">
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading…" : "Choose file"}
            <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          </label>
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

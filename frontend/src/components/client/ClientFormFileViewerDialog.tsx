import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormTemplateFileViewer } from "@/components/documents/FormTemplateFileViewer";
import { api } from "@/lib/api/client";

type ClientFormFileViewerDialogProps = {
  formId: string | null;
  formTitle?: string;
  refNumber?: string;
  answers?: Record<string, unknown>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ClientFormFileViewerDialog({
  formId,
  formTitle,
  refNumber,
  answers,
  open,
  onOpenChange,
}: ClientFormFileViewerDialogProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["published-form", formId],
    queryFn: () => api.getPublishedForm(formId!),
    enabled: open && Boolean(formId),
  });

  const form = data?.form;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] max-h-[90vh] w-[95vw] max-w-5xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border/80 px-6 py-4 text-left">
          <DialogTitle>
            {formTitle ? `${formTitle}${refNumber ? ` (${refNumber})` : ""}` : "Form file"}
          </DialogTitle>
          <DialogDescription>
            {answers
              ? "Preview how your answers will appear on the form. View only."
              : "Review the TA form before submitting your request. View only."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-muted/20">
          {isLoading ? (
            <p className="py-16 text-center text-sm text-muted-foreground">Loading form file…</p>
          ) : isError || !form ? (
            <p className="py-16 text-center text-sm text-destructive">Could not load form file.</p>
          ) : (
            <FormTemplateFileViewer
              form={form}
              enabled={open}
              fillHeight
              className="h-full"
              answers={answers}
              loadMergedPdf={api.getPublishedFormDocument}
              emptyMessage="This form has no uploaded file."
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

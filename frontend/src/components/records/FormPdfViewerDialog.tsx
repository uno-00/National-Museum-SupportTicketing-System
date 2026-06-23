import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormUploadedFileViewer } from "@/components/records/FormUploadedFileViewer";
import { api } from "@/lib/api/client";

type FormPdfViewerDialogProps = {
  formId: string | null;
  formTitle?: string;
  refNumber?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function FormPdfViewerDialog({
  formId,
  formTitle,
  refNumber,
  open,
  onOpenChange,
}: FormPdfViewerDialogProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["form-review", formId],
    queryFn: () => api.getRecordsForm(formId!),
    enabled: open && Boolean(formId),
  });

  const form = data?.form;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] max-h-[90vh] w-[95vw] max-w-5xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border/80 px-6 py-4 text-left">
          <DialogTitle>
            {formTitle ? `${formTitle}${refNumber ? ` (${refNumber})` : ""}` : "Uploaded file"}
          </DialogTitle>
          <DialogDescription>Uploaded form template. View only.</DialogDescription>
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-muted/20">
          {isLoading ? (
            <p className="py-16 text-center text-sm text-muted-foreground">Loading file…</p>
          ) : isError || !form ? (
            <p className="py-16 text-center text-sm text-destructive">Could not load file.</p>
          ) : (
            <FormUploadedFileViewer form={form} enabled={open} fillHeight className="h-full" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

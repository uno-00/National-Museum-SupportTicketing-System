import type { FormRecord } from "@/lib/api/types";
import { FormTemplateFileViewer } from "@/components/documents/FormTemplateFileViewer";
import { api } from "@/lib/api/client";

type FormUploadedFileViewerProps = {
  form: FormRecord;
  enabled?: boolean;
  className?: string;
  viewportClassName?: string;
  fillHeight?: boolean;
};

/** Records review — uploaded template with field placements visible. */
export function FormUploadedFileViewer(props: FormUploadedFileViewerProps) {
  return (
    <FormTemplateFileViewer
      {...props}
      loadMergedPdf={api.getRecordsFormDocument}
      emptyMessage="No form file was uploaded with this submission."
    />
  );
}

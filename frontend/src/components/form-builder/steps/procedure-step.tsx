import { useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import type { FormDraft } from "@/lib/form-builder-store";
import { SectionHeader, WizardCard } from "../shared";

type ProcedureStepProps = {
  draft: FormDraft;
  update: (patch: Partial<FormDraft>) => void;
};

export function ProcedureStep({ draft, update }: ProcedureStepProps) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please upload a PDF file.");
      return;
    }
    setUploading(true);
    try {
      const { file: uploaded } = await api.uploadFile(file);
      update({
        workProcedureName: uploaded.originalName,
        workProcedurePath: uploaded.url,
      });
      toast.success("Procedure document uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <WizardCard>
      <SectionHeader
        title="Work procedure"
        subtitle="Upload the SOP that accompanies this form (PDF only)."
      />
      <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-paper p-12 text-center transition-colors hover:border-maroon/40 hover:bg-maroon/5">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-maroon/10 text-maroon">
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
        </div>
        <div className="mt-3 text-sm font-medium text-foreground">
          {draft.workProcedureName || "Drop a PDF or click to browse"}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">PDF only · max 15 MB</div>
        <input
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          disabled={uploading}
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
      </label>
      {draft.workProcedurePath ? (
        <p className="mt-2 text-center text-xs text-green-700">✓ Document ready for Records review</p>
      ) : null}
    </WizardCard>
  );
}

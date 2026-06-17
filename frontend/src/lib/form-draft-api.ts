import { api } from "@/lib/api/client";
import type { FormDraft } from "@/lib/form-builder-store";
import { dataUrlToFile } from "@/lib/upload-data-url";

/** Map local form builder draft to API create/update body (omit huge blobs). */
export function draftToApiBody(draft: FormDraft) {
  return {
    title: draft.title.trim(),
    refNumber: draft.refNumber,
    effectivity: draft.effectivity,
    version: draft.version,
    fields: draft.fields,
    signatories: draft.signatories,
    printTemplate: draft.printTemplate,
    printPlacements: draft.printPlacements ?? [],
    printPlacementFontSize: draft.printPlacementFontSize ?? 10,
    workProcedureName: draft.workProcedureName ?? "",
    workProcedurePath: draft.workProcedurePath ?? "",
  };
}

/** Upload template image if still a data URL, then return API body. */
export async function draftToApiBodyWithUploads(draft: FormDraft) {
  const body = draftToApiBody(draft) as Record<string, unknown>;

  if (draft.printTemplateImage?.startsWith("data:")) {
    try {
      const file = await dataUrlToFile(draft.printTemplateImage, `template-${draft.refNumber}`);
      const { file: uploaded } = await api.uploadFile(file);
      body.printTemplateImagePath = uploaded.url;
    } catch {
      /* proceed without image if upload fails */
    }
  }

  return body;
}

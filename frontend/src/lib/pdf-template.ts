import * as pdfjs from "pdfjs-dist";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

/** Total rendered height (px) when the PDF is scaled to `displayWidth`. */
export async function getPdfDisplayHeight(blob: Blob, displayWidth: number): Promise<number> {
  const data = new Uint8Array(await blob.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  let totalHeight = 0;

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum += 1) {
    const page = await doc.getPage(pageNum);
    const base = page.getViewport({ scale: 1 });
    const scale = displayWidth / base.width;
    totalHeight += base.height * scale;
  }

  return Math.ceil(totalHeight);
}

/** Renders the first page of a PDF to a PNG data URL for the print canvas. */
export async function pdfFirstPageToDataUrl(
  file: File,
  options?: { maxWidth?: number },
): Promise<{ dataUrl: string; pageCount: number }> {
  const maxWidth = options?.maxWidth ?? 1600;
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const page = await doc.getPage(1);
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = Math.min(2, maxWidth / baseViewport.width);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas for PDF rendering.");

  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
  return { dataUrl: canvas.toDataURL("image/png"), pageCount: doc.numPages };
}

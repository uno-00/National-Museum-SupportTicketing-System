import { isPlacementCheckmark } from "../utils/placementChoiceValues.js";
import { placementValueKey } from "../utils/placementValues.js";
import fs from "node:fs";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { config } from "../config.js";

export type Placement = {
  variable: string;
  label: string;
  xPct: number;
  yPct: number;
};

/** Matches `.dynamic-text-anchor { transform: translateY(-fontSize) }` in the form builder. */
const FONT_ASCENDER_RATIO = 0.72;

function resolveLocalUploadPath(urlPath: string) {
  const filename = path.basename(urlPath);
  return path.join(config.uploadDir, filename);
}

function placementBaselineFromTop(pageHeight: number, yPct: number, fontSize: number) {
  const anchorTop = (yPct / 100) * pageHeight;
  return anchorTop - fontSize * (1 - FONT_ASCENDER_RATIO);
}

/** Vector checkmark for checkbox placements (Helvetica cannot render ✓ reliably). */
function drawPlacementCheckmark(
  page: PDFPage,
  anchorX: number,
  baselineFromTop: number,
  pageHeight: number,
  fontSize: number,
) {
  const size = fontSize * 0.95;
  const thickness = Math.max(0.8, fontSize * 0.11);
  const color = rgb(0.1, 0.1, 0.1);
  const baselineY = pageHeight - baselineFromTop;

  const start = { x: anchorX, y: baselineY - size * 0.12 };
  const mid = { x: anchorX + size * 0.38, y: baselineY - size * 0.52 };
  const end = { x: anchorX + size * 0.95, y: baselineY + size * 0.18 };

  page.drawLine({ start, end: mid, thickness, color });
  page.drawLine({ start: mid, end, thickness, color });
}

async function drawPlacementImage(
  page: PDFPage,
  pdfDoc: PDFDocument,
  imagePath: string,
  placement: Placement,
  fontSize: number,
) {
  if (!fs.existsSync(imagePath)) return false;

  const bytes = fs.readFileSync(imagePath);
  const lower = imagePath.toLowerCase();
  let image;
  if (lower.endsWith(".png")) {
    image = await pdfDoc.embedPng(bytes);
  } else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
    image = await pdfDoc.embedJpg(bytes);
  } else {
    return false;
  }

  const { width, height } = page.getSize();
  const imgWidth = fontSize * 8;
  const imgHeight = fontSize * 3;
  const x = (placement.xPct / 100) * width;
  const top = (placement.yPct / 100) * height;
  const y = height - top - imgHeight;

  page.drawImage(image, { x, y, width: imgWidth, height: imgHeight });
  return true;
}

async function drawPlacementsOnPage(
  page: PDFPage,
  pdfDoc: PDFDocument,
  placements: Placement[],
  values: Record<string, string>,
  imageValues: Record<string, string>,
  fontSize: number,
  font: PDFFont,
  emptyFallbackToLabel: boolean,
) {
  const { width, height } = page.getSize();

  for (const placement of placements) {
    const imageUrl = imageValues[placement.variable]?.trim();
    if (imageUrl) {
      const imagePath = resolveLocalUploadPath(imageUrl);
      const drawn = await drawPlacementImage(page, pdfDoc, imagePath, placement, fontSize);
      if (drawn) continue;
    }

    const answered = values[placementValueKey(placement)]?.trim() || "";
    const text = answered || (emptyFallbackToLabel ? placement.label : "");
    if (!text) continue;

    const x = (placement.xPct / 100) * width;
    const baselineFromTop = placementBaselineFromTop(height, placement.yPct, fontSize);
    const y = height - baselineFromTop;
    const isCheck = isPlacementCheckmark(text);

    if (isCheck) {
      drawPlacementCheckmark(page, x, baselineFromTop, height, fontSize);
      continue;
    }

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0.1, 0.1, 0.1),
      maxWidth: fontSize * 15,
    });
  }
}

/** Embeds uploaded template (PDF or image) with field values drawn at saved placements. */
export async function embedTemplateWithPlacements(
  pdfDoc: PDFDocument,
  templatePath: string,
  placements: Placement[],
  values: Record<string, string>,
  fontSize: number,
  options?: { emptyFallbackToLabel?: boolean; imageValues?: Record<string, string> },
): Promise<boolean> {
  if (!fs.existsSync(templatePath)) return false;

  const bytes = fs.readFileSync(templatePath);
  const lower = templatePath.toLowerCase();
  const emptyFallbackToLabel = options?.emptyFallbackToLabel ?? false;
  const imageValues = options?.imageValues ?? {};
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  if (lower.endsWith(".pdf")) {
    const templatePdf = await PDFDocument.load(bytes);
    const pages = await pdfDoc.copyPages(templatePdf, templatePdf.getPageIndices());

    for (let i = 0; i < pages.length; i += 1) {
      const page = pages[i];
      pdfDoc.addPage(page);
      if (i === 0 && placements.length > 0) {
        await drawPlacementsOnPage(
          page,
          pdfDoc,
          placements,
          values,
          imageValues,
          fontSize,
          font,
          emptyFallbackToLabel,
        );
      }
    }

    return pages.length > 0;
  }

  let image;
  if (lower.endsWith(".png")) {
    image = await pdfDoc.embedPng(bytes);
  } else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
    image = await pdfDoc.embedJpg(bytes);
  } else {
    return false;
  }

  const page = pdfDoc.addPage([image.width, image.height]);
  page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });

  if (placements.length > 0) {
    await drawPlacementsOnPage(
      page,
      pdfDoc,
      placements,
      values,
      imageValues,
      fontSize,
      font,
      emptyFallbackToLabel,
    );
  }

  return true;
}

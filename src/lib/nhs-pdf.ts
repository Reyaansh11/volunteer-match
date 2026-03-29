import { promises as fs } from "fs";
import path from "path";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export type NHSFormInput = {
  supervisorName: string;
  supervisorTitle: string | null;
  supervisorContact: string;
  sponsoringGroup: string;
  contribution: string;
  signatureDataUrl: string;
  signatureDate: Date;
};

const DEFAULT_TEMPLATE = path.join(process.cwd(), "assets/templates/nhs-service-activity-form.pdf");

function sanitizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function dataUrlToBytes(dataUrl: string) {
  const match = dataUrl.match(/^data:image\/(png|jpeg);base64,(.+)$/);
  if (!match) return null;
  return Buffer.from(match[2], "base64");
}

export async function generateNhsPdf(input: NHSFormInput) {
  const templatePath = process.env.NHS_PDF_TEMPLATE_PATH || DEFAULT_TEMPLATE;
  const pdfBytes = await fs.readFile(templatePath);

  const pdfDoc = await PDFDocument.load(pdfBytes);
  const page = pdfDoc.getPages()[0];
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const baseFontSize = 18;
  const minFontSize = 12;
  const textColor = rgb(0, 0, 0);
  const lineEnd = 1680;

  const fromTop = (offset: number) => height - offset;
  const baselineOffset = 6;

  const fitText = (text: string, maxWidth: number, size = baseFontSize) => {
    const clean = sanitizeText(text);
    let fontSize = size;
    let width = font.widthOfTextAtSize(clean, fontSize);
    while (width > maxWidth && fontSize > minFontSize) {
      fontSize -= 1;
      width = font.widthOfTextAtSize(clean, fontSize);
    }
    if (width <= maxWidth) {
      return { text: clean, size: fontSize };
    }
    let truncated = clean;
    while (truncated.length > 0) {
      truncated = truncated.slice(0, -1);
      const candidate = `${truncated}...`;
      if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
        return { text: candidate, size: fontSize };
      }
    }
    return { text: clean, size: fontSize };
  };

  const drawOnLine = (text: string, x: number, topOffset: number, maxWidth: number, size = baseFontSize) => {
    const { text: fittedText, size: fittedSize } = fitText(text, maxWidth, size);
    page.drawText(fittedText, {
      x,
      y: fromTop(topOffset) + baselineOffset,
      size: fittedSize,
      font,
      color: textColor
    });
  };

  drawOnLine(input.supervisorName, 740, 1558, lineEnd - 740);
  drawOnLine(input.supervisorTitle || "Supervisor", 910, 1626, lineEnd - 910);
  drawOnLine(input.supervisorContact, 500, 1706, lineEnd - 500);
  drawOnLine(input.sponsoringGroup, 710, 1784, lineEnd - 710);
  drawOnLine(input.contribution, 880, 1876, lineEnd - 880);

  const signatureBytes = dataUrlToBytes(input.signatureDataUrl);
  if (signatureBytes) {
    const image = await pdfDoc.embedPng(signatureBytes);
    const sigX = 820;
    const sigLineY = fromTop(2010);
    const sigWidth = Math.min(360, lineEnd - sigX - 10);
    const sigHeight = 54;
    page.drawImage(image, {
      x: sigX,
      y: sigLineY - 12,
      width: sigWidth,
      height: sigHeight
    });
    page.drawText("Verified by ServeConnect", {
      x: Math.min(sigX + sigWidth + 12, lineEnd - 220),
      y: sigLineY - 28,
      size: 8,
      font,
      color: textColor
    });
  }

  const dateText = input.signatureDate.toLocaleDateString("en-US");
  drawOnLine(dateText, 260, 2158, 900 - 260);

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

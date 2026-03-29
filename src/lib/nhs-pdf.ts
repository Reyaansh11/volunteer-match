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
  const fontSize = 10;
  const textColor = rgb(0, 0, 0);

  const line = (text: string, x: number, y: number, size = fontSize) => {
    page.drawText(sanitizeText(text), {
      x,
      y,
      size,
      font,
      color: textColor
    });
  };

  // Coordinates calibrated for the provided scanned form (US Letter).
  const fromTop = (offset: number) => height - offset;

  line(input.supervisorName, 210, fromTop(512));
  line(input.supervisorTitle || "Supervisor", 210, fromTop(540));
  line(input.supervisorContact, 210, fromTop(568));
  line(input.sponsoringGroup, 210, fromTop(596));

  // Contribution line (wrap crudely across two lines if long).
  const contribution = sanitizeText(input.contribution);
  const splitIndex = contribution.length > 80 ? contribution.lastIndexOf(" ", 80) : -1;
  const firstLine = splitIndex > 0 ? contribution.slice(0, splitIndex) : contribution;
  const secondLine = splitIndex > 0 ? contribution.slice(splitIndex + 1) : "";
  line(firstLine, 210, fromTop(624));
  if (secondLine) {
    line(secondLine, 210, fromTop(652));
  }

  const signatureBytes = dataUrlToBytes(input.signatureDataUrl);
  if (signatureBytes) {
    const image = await pdfDoc.embedPng(signatureBytes);
    page.drawImage(image, {
      x: 200,
      y: fromTop(692),
      width: 180,
      height: 48
    });
    line("Verified by ServeConnect", 400, fromTop(712), 8);
  }

  const dateText = input.signatureDate.toLocaleDateString("en-US");
  line(dateText, 210, fromTop(726));

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

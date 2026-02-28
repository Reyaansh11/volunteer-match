import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import AdmZip from "adm-zip";

const DEFAULT_TEMPLATE = path.join(process.cwd(), "assets/templates/2022-NHS-Service-Hours-Tracking-Template.docx");

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function safe(value: string | null | undefined, fallback = "N/A") {
  const normalized = (value || "").trim();
  return escapeXml(normalized || fallback);
}

export type ServiceHourDocInput = {
  studentFirstName: string;
  studentLastName: string;
  studentFullName: string;
  studentEmail: string;
  orgName: string;
  orgEmail: string;
  supervisorName: string;
  opportunityTitle: string;
  hoursCompleted: number | null;
  serviceDate: Date | null;
  activityNotes: string | null;
};

function fillDocumentXml(xml: string, input: ServiceHourDocInput) {
  const serviceDate = input.serviceDate ? input.serviceDate.toISOString().slice(0, 10) : "N/A";
  const hours = input.hoursCompleted != null ? String(input.hoursCompleted) : "N/A";
  const contact = `${input.orgEmail}${input.studentEmail ? ` | Student: ${input.studentEmail}` : ""}`;

  let out = xml;
  out = out.replace("Last Name: ________________________", `Last Name: ${safe(input.studentLastName)}`);
  out = out.replace(" First Name: _____________________________", ` First Name: ${safe(input.studentFirstName)}`);
  out = out.replace("HOURS: _____", `HOURS: ${safe(hours)}`);
  out = out.replace(
    "Supervisor’s name (please print): __________________________________________________",
    `Supervisor’s name (please print): ${safe(input.supervisorName)}`
  );
  out = out.replace(
    "Student’s Name: __________________________ has completed the service described above.",
    `Student’s Name: ${safe(input.studentFullName)} has completed the service described above.`
  );
  out = out.replace(
    "Title or organization: ____________________________________________________________",
    `Title or organization: ${safe(input.orgName)}`
  );
  out = out.replace("Service:_", `Service: ${safe(serviceDate)}`);
  out = out.replace(
    "_____________  Contact phone # or e-mail: ____________________________",
    `  Contact phone # or e-mail: ${safe(contact)}`
  );

  const summaryParagraph =
    `<w:p><w:r><w:t xml:space="preserve">Auto-filled details: Opportunity: ${safe(input.opportunityTitle)}. Description: ${safe(input.activityNotes, "No notes provided")}</w:t></w:r></w:p>`;

  out = out.replace("<w:sectPr", `${summaryParagraph}<w:sectPr`);
  return out;
}

export async function generateServiceHourDocx(input: ServiceHourDocInput) {
  const templatePath = process.env.NHS_TEMPLATE_PATH || DEFAULT_TEMPLATE;
  await fs.access(templatePath);
  const zip = new AdmZip(templatePath);
  const docEntry = zip.getEntry("word/document.xml");
  if (!docEntry) {
    throw new Error("Template missing word/document.xml");
  }

  const originalXml = docEntry.getData().toString("utf8");
  const filledXml = fillDocumentXml(originalXml, input);
  zip.updateFile("word/document.xml", Buffer.from(filledXml, "utf8"));

  const outputPath = path.join("/tmp", `filled-service-hours-${randomUUID()}.docx`);
  zip.writeZip(outputPath);
  const buffer = await fs.readFile(outputPath);
  await fs.rm(outputPath, { force: true });
  return buffer;
}

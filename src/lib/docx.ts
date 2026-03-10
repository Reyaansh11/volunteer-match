import { promises as fs } from "fs";
import path from "path";
import AdmZip from "adm-zip";

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
  orgPhone: string | null;
  orgContactName: string;
  supervisorName: string;
  opportunityTitle: string;
  hoursCompleted: number | null;
  serviceDate: Date | null;
  activityNotes: string | null;
};

function paragraph(text: string) {
  return `<w:p><w:r><w:t xml:space="preserve">${safe(text)}</w:t></w:r></w:p>`;
}

function boldParagraph(text: string) {
  return `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${safe(text)}</w:t></w:r></w:p>`;
}

function logoParagraph() {
  return `
    <w:p>
      <w:r>
        <w:drawing>
          <wp:inline distT="0" distB="0" distL="0" distR="0">
            <wp:extent cx="1371600" cy="1371600"/>
            <wp:docPr id="1" name="ServeConnect Logo"/>
            <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
              <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                  <pic:blipFill>
                    <a:blip r:embed="rId1"/>
                    <a:stretch><a:fillRect/></a:stretch>
                  </pic:blipFill>
                  <pic:spPr>
                    <a:xfrm>
                      <a:off x="0" y="0"/>
                      <a:ext cx="1371600" cy="1371600"/>
                    </a:xfrm>
                    <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                  </pic:spPr>
                </pic:pic>
              </a:graphicData>
            </a:graphic>
          </wp:inline>
        </w:drawing>
      </w:r>
    </w:p>
  `;
}

function buildDocumentXml(input: ServiceHourDocInput, includeLogo: boolean) {
  const serviceDate = input.serviceDate ? input.serviceDate.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
  const hours = input.hoursCompleted != null ? String(input.hoursCompleted) : "N/A";
  const orgContact = `${input.orgContactName} | ${input.orgEmail}${input.orgPhone ? ` | ${input.orgPhone}` : ""}`;
  const description = input.activityNotes || "No description provided.";

  const paragraphs = [
    includeLogo ? logoParagraph() : "",
    boldParagraph("ServeConnect Service Hour Verification"),
    paragraph(`Date: ${serviceDate}`),
    paragraph(`Student Name: ${input.studentFullName}`),
    paragraph(`Student Email: ${input.studentEmail}`),
    paragraph(`Organization: ${input.orgName}`),
    paragraph(`Organization Contact: ${orgContact}`),
    paragraph(`Opportunity: ${input.opportunityTitle}`),
    paragraph(`Description of Work: ${description}`),
    paragraph(`Hours Worked: ${hours}`),
    boldParagraph("Verified by ServeConnect"),
    paragraph("Student Signature: ________________________________"),
    paragraph("Signature Date: _________________________________"),
    paragraph("Organization Verification: Verified by ServeConnect (digital verification)")
  ].join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
    xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
    xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
    xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
    <w:body>
      ${paragraphs}
      <w:sectPr>
        <w:pgSz w:w="12240" w:h="15840"/>
        <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
      </w:sectPr>
    </w:body>
  </w:document>`;
}

function contentTypesXml(includeLogo: boolean) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    ${includeLogo ? '<Default Extension="png" ContentType="image/png"/>' : ""}
    <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
    <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
    <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  </Types>`;
}

function relsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
    <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
    <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
  </Relationships>`;
}

function documentRelsXml(includeLogo: boolean) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    ${includeLogo ? '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/logo.png"/>' : ""}
  </Relationships>`;
}

function coreXml() {
  const now = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:dcterms="http://purl.org/dc/terms/"
    xmlns:dcmitype="http://purl.org/dc/dcmitype/"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <dc:title>ServeConnect Service Hour Verification</dc:title>
    <dc:creator>ServeConnect</dc:creator>
    <cp:lastModifiedBy>ServeConnect</cp:lastModifiedBy>
    <dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>
    <dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>
  </cp:coreProperties>`;
}

function appXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"
    xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
    <Application>ServeConnect</Application>
  </Properties>`;
}

export async function generateServiceHourDocx(input: ServiceHourDocInput) {
  const logoPath = path.join(process.cwd(), "src/app/icon.png");
  let logoBuffer: Buffer | null = null;
  try {
    logoBuffer = await fs.readFile(logoPath);
  } catch {
    logoBuffer = null;
  }

  const includeLogo = Boolean(logoBuffer);
  const zip = new AdmZip();
  zip.addFile("[Content_Types].xml", Buffer.from(contentTypesXml(includeLogo), "utf8"));
  zip.addFile("_rels/.rels", Buffer.from(relsXml(), "utf8"));
  zip.addFile("word/document.xml", Buffer.from(buildDocumentXml(input, includeLogo), "utf8"));
  zip.addFile("word/_rels/document.xml.rels", Buffer.from(documentRelsXml(includeLogo), "utf8"));
  zip.addFile("docProps/core.xml", Buffer.from(coreXml(), "utf8"));
  zip.addFile("docProps/app.xml", Buffer.from(appXml(), "utf8"));
  if (includeLogo && logoBuffer) {
    zip.addFile("word/media/logo.png", logoBuffer);
  }

  return zip.toBuffer();
}

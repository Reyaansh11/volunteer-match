import { NextResponse } from "next/server";
import { generateNhsPdf } from "@/lib/nhs-pdf";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const token = process.env.SAMPLE_FORM_TOKEN;
  const url = new URL(request.url);
  const provided = url.searchParams.get("token");

  if (!token || provided !== token) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const signatureStub =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";

  const pdfBuffer = await generateNhsPdf({
    supervisorName: "Program Lead",
    supervisorTitle: "Supervisor",
    supervisorContact: "program@serveconnect.org | 555-0100",
    sponsoringGroup: "ServeConnect Test Program",
    contribution: "Assisted with volunteer intake and resident engagement activities.",
    signatureDataUrl: signatureStub,
    signatureDate: new Date()
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=\"serveconnect-sample-form.pdf\""
    }
  });
}

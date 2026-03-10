import { NextResponse } from "next/server";
import { generateServiceHourDocx } from "@/lib/docx";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const token = process.env.SAMPLE_FORM_TOKEN;
  const url = new URL(request.url);
  const provided = url.searchParams.get("token");

  if (!token || provided !== token) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const docBuffer = await generateServiceHourDocx({
    studentFirstName: "Reyaansh",
    studentLastName: "Tomar",
    studentFullName: "Reyaansh Tomar",
    studentEmail: "reyaansh@example.com",
    orgName: "ServeConnect Test Program",
    orgEmail: "program@serveconnect.org",
    orgPhone: "555-0100",
    orgContactName: "Program Lead",
    supervisorName: "Program Lead",
    opportunityTitle: "Community Support Session",
    opportunityDescription: "Support residents with light activity facilitation, conversation, and logistics.",
    hoursCompleted: 2.5,
    serviceDate: new Date(),
    activityNotes: "Assisted with volunteer intake and resident engagement activities."
  });

  return new NextResponse(new Uint8Array(docBuffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": "attachment; filename=\"serveconnect-sample-form.docx\""
    }
  });
}

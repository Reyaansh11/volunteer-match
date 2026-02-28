import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateServiceHourDocx } from "@/lib/docx";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return { first: "Student", last: "" };
  }
  if (parts.length === 1) {
    return { first: parts[0], last: "" };
  }
  return {
    first: parts.slice(0, -1).join(" "),
    last: parts[parts.length - 1]
  };
}

export async function GET(_: Request, { params }: { params: Promise<{ formId: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { formId } = await params;
  const id = Number(formId);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid form ID" }, { status: 400 });
  }

  const form = await prisma.serviceHourForm.findUnique({
    where: { id },
    include: {
      matchRequest: {
        include: {
          student: {
            include: {
              user: true
            }
          },
          orgProfile: true,
          opportunity: true
        }
      }
    }
  });

  if (!form) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  const canAccessAsStudent = user.role === UserRole.STUDENT && user.student && user.student.id === form.matchRequest.studentId;
  const canAccessAsOrg = user.role === UserRole.ORG && user.org && user.org.id === form.matchRequest.orgProfileId;

  if (!canAccessAsStudent && !canAccessAsOrg) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const nameParts = splitName(form.studentName);
  const docBuffer = await generateServiceHourDocx({
    studentFirstName: nameParts.first,
    studentLastName: nameParts.last,
    studentFullName: form.studentName,
    studentEmail: form.studentEmail,
    orgName: form.orgName,
    orgEmail: form.orgEmail,
    supervisorName: form.filledByName,
    opportunityTitle: form.opportunity,
    hoursCompleted: form.hoursCompleted,
    serviceDate: form.serviceDate,
    activityNotes: form.activityNotes
  });

  const filename = `service-hours-${form.id}.docx`;
  return new NextResponse(docBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename=\"${filename}\"`
    }
  });
}

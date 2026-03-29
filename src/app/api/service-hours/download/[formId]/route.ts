import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
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

  if (!form.generatedPdf) {
    return NextResponse.json({ error: "PDF not available yet. Please re-submit the service form." }, { status: 409 });
  }

  const filename = `nhs-service-form-${form.id}.pdf`;
  return new NextResponse(new Uint8Array(form.generatedPdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=\"${filename}\"`
    }
  });
}

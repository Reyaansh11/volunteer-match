import { MatchRequestStatus, RequestInitiator, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentUser, requireSameOrigin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function redirectWithNotice(request: Request, redirectTo: string, key: "error" | "success", value: string) {
  const url = new URL(redirectTo, request.url);
  url.searchParams.set(key, value);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  if (!requireSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  const formData = await request.formData();
  const opportunityId = Number(formData.get("opportunityId") || 0);
  const studentIdFromForm = Number(formData.get("studentId") || 0);
  const message = String(formData.get("message") || "").trim();
  const redirectTo = String(formData.get("redirectTo") || "").trim() || "/";

  if (!Number.isFinite(opportunityId) || opportunityId <= 0) {
    return redirectWithNotice(request, redirectTo, "error", "Invalid opportunity");
  }

  const opportunity = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    include: { orgProfile: true }
  });

  if (!opportunity) {
    return redirectWithNotice(request, redirectTo, "error", "Opportunity not found");
  }

  let studentId = studentIdFromForm;
  let initiatedBy: RequestInitiator = RequestInitiator.ORG;

  if (user.role === UserRole.STUDENT) {
    if (!user.student) {
      return NextResponse.redirect(new URL("/register/student", request.url), 303);
    }
    studentId = user.student.id;
    initiatedBy = RequestInitiator.STUDENT;
  } else if (user.role === UserRole.ORG) {
    if (!user.org || user.org.id !== opportunity.orgProfileId) {
      return redirectWithNotice(request, redirectTo, "error", "Unauthorized organization");
    }
    initiatedBy = RequestInitiator.ORG;
  }

  if (!Number.isFinite(studentId) || studentId <= 0) {
    return redirectWithNotice(request, redirectTo, "error", "Invalid student");
  }

  const student = await prisma.studentProfile.findUnique({ where: { id: studentId } });
  if (!student) {
    return redirectWithNotice(request, redirectTo, "error", "Student not found");
  }

  const existing = await prisma.matchRequest.findFirst({
    where: {
      studentId,
      opportunityId,
      status: {
        in: [MatchRequestStatus.PENDING, MatchRequestStatus.ACCEPTED]
      }
    }
  });

  if (existing) {
    return redirectWithNotice(request, redirectTo, "error", "Request already exists");
  }

  await prisma.matchRequest.create({
    data: {
      studentId,
      orgProfileId: opportunity.orgProfileId,
      opportunityId,
      initiatedBy,
      status: MatchRequestStatus.PENDING,
      message: message || null
    }
  });

  return redirectWithNotice(request, redirectTo, "success", "Request sent");
}

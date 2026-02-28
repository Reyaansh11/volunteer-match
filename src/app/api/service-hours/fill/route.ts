import { MatchRequestStatus, UserRole } from "@prisma/client";
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
  if (user.role !== UserRole.ORG || !user.org) {
    return NextResponse.redirect(new URL("/dashboard/student?error=Only+organizations+can+fill+forms", request.url), 303);
  }

  const formData = await request.formData();
  const matchRequestId = Number(formData.get("matchRequestId") || 0);
  const redirectTo = String(formData.get("redirectTo") || "").trim() || "/dashboard/org";
  const hoursCompleted = Number(formData.get("hoursCompleted") || 0);
  const serviceDateRaw = String(formData.get("serviceDate") || "").trim();
  const activityNotes = String(formData.get("activityNotes") || "").trim();

  if (!Number.isFinite(matchRequestId) || matchRequestId <= 0) {
    return redirectWithNotice(request, redirectTo, "error", "Invalid request id");
  }

  const matchRequest = await prisma.matchRequest.findUnique({
    where: { id: matchRequestId },
    include: {
      student: {
        include: {
          user: true
        }
      },
      opportunity: true,
      orgProfile: true,
      serviceHourForm: true
    }
  });

  if (!matchRequest || matchRequest.orgProfileId !== user.org.id) {
    return redirectWithNotice(request, redirectTo, "error", "Request not found");
  }
  if (matchRequest.status !== MatchRequestStatus.ACCEPTED) {
    return redirectWithNotice(request, redirectTo, "error", "Request must be accepted first");
  }
  if (matchRequest.serviceHourForm) {
    return redirectWithNotice(request, redirectTo, "error", "Form already filled");
  }

  const serviceDate = serviceDateRaw ? new Date(serviceDateRaw) : null;
  const generatedText = [
    `Service Hour Verification`,
    `Student: ${matchRequest.student.fullName} (${matchRequest.student.user.email})`,
    `Organization: ${matchRequest.orgProfile.organization} (${matchRequest.orgProfile.contactEmail})`,
    `Opportunity: ${matchRequest.opportunity.title}`,
    `Request Message: ${matchRequest.message || "None provided"}`,
    `Hours Completed: ${Number.isFinite(hoursCompleted) ? hoursCompleted : 0}`,
    `Service Date: ${serviceDate ? serviceDate.toISOString().slice(0, 10) : "Not provided"}`,
    `Activity Notes: ${activityNotes || "Not provided"}`
  ].join("\n");

  await prisma.serviceHourForm.create({
    data: {
      matchRequestId: matchRequest.id,
      serviceDate,
      hoursCompleted: Number.isFinite(hoursCompleted) ? hoursCompleted : null,
      activityNotes: activityNotes || null,
      filledByName: matchRequest.orgProfile.contactName,
      studentName: matchRequest.student.fullName,
      studentEmail: matchRequest.student.user.email,
      orgName: matchRequest.orgProfile.organization,
      orgEmail: matchRequest.orgProfile.contactEmail,
      opportunity: matchRequest.opportunity.title,
      generatedText
    }
  });

  return redirectWithNotice(request, redirectTo, "success", "Service form filled");
}

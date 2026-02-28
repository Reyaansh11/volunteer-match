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
  const requestId = Number(formData.get("requestId") || 0);
  const action = String(formData.get("action") || "").trim().toLowerCase();
  const redirectTo = String(formData.get("redirectTo") || "").trim() || "/";

  if (!Number.isFinite(requestId) || requestId <= 0) {
    return redirectWithNotice(request, redirectTo, "error", "Invalid request");
  }

  const matchRequest = await prisma.matchRequest.findUnique({
    where: { id: requestId },
    include: {
      student: true,
      orgProfile: true
    }
  });

  if (!matchRequest || matchRequest.status !== MatchRequestStatus.PENDING) {
    return redirectWithNotice(request, redirectTo, "error", "Request not available");
  }

  const isStudentRecipient =
    user.role === UserRole.STUDENT &&
    user.student &&
    user.student.id === matchRequest.studentId &&
    matchRequest.initiatedBy === RequestInitiator.ORG;

  const isOrgRecipient =
    user.role === UserRole.ORG &&
    user.org &&
    user.org.id === matchRequest.orgProfileId &&
    matchRequest.initiatedBy === RequestInitiator.STUDENT;

  if (!isStudentRecipient && !isOrgRecipient) {
    return redirectWithNotice(request, redirectTo, "error", "Unauthorized");
  }

  const nextStatus = action === "accept" ? MatchRequestStatus.ACCEPTED : MatchRequestStatus.REJECTED;

  await prisma.matchRequest.update({
    where: { id: requestId },
    data: {
      status: nextStatus,
      respondedAt: new Date()
    }
  });

  return redirectWithNotice(request, redirectTo, "success", "Request updated");
}

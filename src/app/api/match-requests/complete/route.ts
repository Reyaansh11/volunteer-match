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
    return redirectWithNotice(request, "/dashboard/student", "error", "Only organizations can confirm completion");
  }

  const formData = await request.formData();
  const requestId = Number(formData.get("requestId") || 0);
  const redirectTo = String(formData.get("redirectTo") || "").trim() || "/dashboard/org?view=accepted";
  const hoursRaw = String(formData.get("hoursCompleted") || "").trim();
  const completionNotes = String(formData.get("completionNotes") || "").trim();

  if (!Number.isFinite(requestId) || requestId <= 0) {
    return redirectWithNotice(request, redirectTo, "error", "Invalid request");
  }

  const hoursCompleted = Number(hoursRaw);
  if (!Number.isFinite(hoursCompleted) || hoursCompleted <= 0) {
    return redirectWithNotice(request, redirectTo, "error", "Enter completed hours greater than zero");
  }

  const matchRequest = await prisma.matchRequest.findUnique({
    where: { id: requestId }
  });

  if (!matchRequest || matchRequest.orgProfileId !== user.org.id) {
    return redirectWithNotice(request, redirectTo, "error", "Request not found");
  }
  if (matchRequest.status !== MatchRequestStatus.ACCEPTED) {
    return redirectWithNotice(request, redirectTo, "error", "Request must be accepted first");
  }
  if (matchRequest.completedAt) {
    return redirectWithNotice(request, redirectTo, "error", "This task is already marked complete");
  }

  await prisma.matchRequest.update({
    where: { id: requestId },
    data: {
      completedAt: new Date(),
      hoursCompleted,
      completionNotes: completionNotes || null
    }
  });

  return redirectWithNotice(request, redirectTo, "success", "Task marked completed");
}

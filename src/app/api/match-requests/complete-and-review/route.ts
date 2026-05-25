import { MatchRequestStatus, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentUser, requireSameOrigin, safeRedirectTo } from "@/lib/auth";
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
    return redirectWithNotice(request, "/dashboard/org", "error", "Only organizations can submit reviews");
  }

  const formData = await request.formData();
  const requestId = Number(formData.get("requestId") || 0);
  const ratingRaw = Number(formData.get("rating") || 0);
  const hoursRaw = String(formData.get("hoursCompleted") || "").trim();
  const completionNotes = String(formData.get("completionNotes") || "").trim();
  const feedback = String(formData.get("feedback") || "").trim();
  const serviceDateRaw = String(formData.get("serviceDate") || "").trim();
  const redirectTo = safeRedirectTo(
    String(formData.get("redirectTo") || "").trim(),
    "/dashboard/org?view=active-volunteers"
  );

  if (!Number.isFinite(requestId) || requestId <= 0) {
    return redirectWithNotice(request, redirectTo, "error", "Invalid request");
  }
  if (!Number.isFinite(ratingRaw) || ratingRaw < 1 || ratingRaw > 5) {
    return redirectWithNotice(request, redirectTo, "error", "Please select a star rating between 1 and 5");
  }
  const rating = Math.round(ratingRaw);

  const matchRequest = await prisma.matchRequest.findUnique({
    where: { id: requestId },
    include: { opportunity: true, studentReview: true }
  });

  if (!matchRequest || matchRequest.orgProfileId !== user.org.id) {
    return redirectWithNotice(request, redirectTo, "error", "Match request not found");
  }
  if (matchRequest.status !== MatchRequestStatus.ACCEPTED) {
    return redirectWithNotice(request, redirectTo, "error", "This match must be in accepted status");
  }
  if (matchRequest.studentReview) {
    return redirectWithNotice(request, redirectTo, "error", "A review has already been submitted for this match");
  }

  // Completion fields are required only when hours haven't been logged yet.
  // If completedAt is already set (e.g. older record logged before this combined flow),
  // we skip re-writing the completion data and just save the review.
  const needsCompletion = !matchRequest.completedAt;
  let completedAt: Date | null = null;
  let hoursCompleted: number | null = null;
  let serviceDate: Date | null = null;

  if (needsCompletion) {
    const hours = Number(hoursRaw);
    if (!Number.isFinite(hours) || hours <= 0) {
      return redirectWithNotice(request, redirectTo, "error", "Enter completed hours greater than zero");
    }
    if (hours > 24) {
      return redirectWithNotice(request, redirectTo, "error", "Hours cannot exceed 24 per session");
    }
    if (!serviceDateRaw) {
      return redirectWithNotice(request, redirectTo, "error", "Date of service is required");
    }
    const parsedDate = new Date(serviceDateRaw);
    if (isNaN(parsedDate.getTime())) {
      return redirectWithNotice(request, redirectTo, "error", "Invalid date of service");
    }
    completedAt = new Date();
    hoursCompleted = hours;
    serviceDate = parsedDate;
  }

  await prisma.$transaction(async (tx) => {
    if (needsCompletion) {
      await tx.matchRequest.update({
        where: { id: requestId },
        data: {
          completedAt,
          hoursCompleted,
          completionNotes: completionNotes || null,
          serviceDate,
          // Snapshot the title so it persists if the opportunity is later archived
          opportunityTitle: matchRequest.opportunity?.title ?? matchRequest.opportunityTitle ?? null
        }
      });
    }

    await tx.studentReview.create({
      data: {
        matchRequestId: requestId,
        studentId: matchRequest.studentId,
        orgProfileId: matchRequest.orgProfileId,
        rating,
        feedback: feedback || null
      }
    });
  });

  return redirectWithNotice(request, redirectTo, "success", "Service logged and review submitted — this match has moved to Match History");
}

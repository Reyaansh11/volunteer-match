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
  if (!user || user.role !== UserRole.ORG || !user.org) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  const formData = await request.formData();
  const matchRequestId = Number(formData.get("matchRequestId") || 0);
  const rating = Number(formData.get("rating") || 0);
  const feedback = String(formData.get("feedback") || "").trim();
  const redirectTo = String(formData.get("redirectTo") || "").trim() || "/dashboard/org";

  if (!Number.isFinite(matchRequestId) || matchRequestId <= 0) {
    return redirectWithNotice(request, redirectTo, "error", "Invalid match request.");
  }

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return redirectWithNotice(request, redirectTo, "error", "Rating must be between 1 and 5.");
  }

  const matchRequest = await prisma.matchRequest.findUnique({
    where: { id: matchRequestId }
  });

  if (!matchRequest) {
    return redirectWithNotice(request, redirectTo, "error", "Match request not found.");
  }

  if (matchRequest.orgProfileId !== user.org.id) {
    return redirectWithNotice(request, redirectTo, "error", "Unauthorized organization.");
  }

  if (matchRequest.status !== MatchRequestStatus.ACCEPTED) {
    return redirectWithNotice(request, redirectTo, "error", "Reviews can only be added for accepted matches.");
  }

  await prisma.studentReview.upsert({
    where: {
      matchRequestId: matchRequest.id
    },
    update: {
      rating,
      feedback: feedback || null
    },
    create: {
      matchRequestId: matchRequest.id,
      studentId: matchRequest.studentId,
      orgProfileId: matchRequest.orgProfileId,
      rating,
      feedback: feedback || null
    }
  });

  return redirectWithNotice(request, redirectTo, "success", "Student review saved.");
}

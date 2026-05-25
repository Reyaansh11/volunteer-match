import { NextResponse } from "next/server";
import { getCurrentUser, requireSameOrigin, safeRedirectTo } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  if (!requireSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user || user.role !== "ORG" || !user.org) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  const formData = await request.formData();
  const opportunityId = Number(formData.get("opportunityId") || 0);
  const redirectTo = safeRedirectTo(String(formData.get("redirectTo") || ""), "/dashboard/org?view=opportunities");

  if (!Number.isFinite(opportunityId) || opportunityId <= 0) {
    return NextResponse.redirect(new URL(`${redirectTo}&error=Invalid+opportunity`, request.url), 303);
  }

  const opportunity = await prisma.opportunity.findUnique({ where: { id: opportunityId } });

  if (!opportunity || opportunity.orgProfileId !== user.org.id) {
    return NextResponse.redirect(new URL(`${redirectTo}&error=Opportunity+not+found`, request.url), 303);
  }

  await prisma.opportunity.delete({ where: { id: opportunityId } });

  return NextResponse.redirect(new URL("/dashboard/org?view=opportunities&success=Opportunity+removed", request.url), 303);
}

import { NextResponse } from "next/server";
import { OrgStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendOrgYellowFlagEmail } from "@/lib/email";

function isAuthorized(request: Request) {
  const token = request.headers.get("x-admin-token");
  return token === process.env.ADMIN_SECRET;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgs = await prisma.orgProfile.findMany({
    include: { user: { select: { email: true, createdAt: true } } },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(orgs);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { orgId, action, note } = body as { orgId: number; action: string; note?: string };

  if (!orgId || !action) return NextResponse.json({ error: "Missing orgId or action" }, { status: 400 });

  if (action === "approve") {
    await prisma.orgProfile.update({ where: { id: orgId }, data: { status: OrgStatus.APPROVED, adminNote: note ?? null } });
    return NextResponse.json({ ok: true });
  }

  if (action === "yellow") {
    const org = await prisma.orgProfile.update({ where: { id: orgId }, data: { status: OrgStatus.YELLOW, adminNote: note ?? null } });
    if (note) await sendOrgYellowFlagEmail(org.contactEmail, org.organization, note).catch(() => {});
    return NextResponse.json({ ok: true });
  }

  if (action === "reject") {
    const org = await prisma.orgProfile.findUnique({ where: { id: orgId }, include: { user: true } });
    if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.emailBlocklist.upsert({
      where: { email: org.user.email },
      update: {},
      create: { email: org.user.email }
    });
    await prisma.user.delete({ where: { id: org.userId } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

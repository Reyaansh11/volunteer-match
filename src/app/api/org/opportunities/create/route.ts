import { NextResponse } from "next/server";
import { getCurrentUser, parseSkills, requireSameOrigin } from "@/lib/auth";
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
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const requiredCommitment = String(formData.get("requiredCommitment") || "").trim();
  const availability = String(formData.get("availability") || "").trim();
  const radiusKm = Number(formData.get("radiusKm") || 20);
  const contactEmail = String(formData.get("contactEmail") || user.org.contactEmail).trim().toLowerCase();
  const contactPhone = String(formData.get("contactPhone") || user.org.contactPhone || "").trim();
  const skills = parseSkills(String(formData.get("skills") || ""));

  if (!title || !description || !requiredCommitment || !availability || !contactEmail) {
    return NextResponse.redirect(new URL("/dashboard/org?error=Missing+required+fields", request.url), 303);
  }

  const opportunity = await prisma.opportunity.create({
    data: {
      orgProfileId: user.org.id,
      title,
      description,
      requiredCommitment,
      availability,
      radiusKm: Number.isFinite(radiusKm) ? radiusKm : 20,
      contactEmail,
      contactPhone: contactPhone || null
    }
  });

  for (const skillName of skills) {
    const skill = await prisma.skill.upsert({
      where: { name: skillName },
      update: {},
      create: { name: skillName }
    });
    await prisma.opportunitySkill.create({
      data: {
        opportunityId: opportunity.id,
        skillId: skill.id,
        required: true
      }
    });
  }

  return NextResponse.redirect(new URL("/dashboard/org", request.url), 303);
}

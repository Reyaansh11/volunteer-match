import { NextResponse } from "next/server";
import { buildAvailabilityFromForm, getCurrentUser, parseSkillsFromForm, requireSameOrigin, resolveCommitmentFromForm } from "@/lib/auth";
import { normalizeDistanceUnit, normalizeUsTimeZone, toKilometers, fromKilometers } from "@/lib/form-options";
import { sendOpportunityBlastEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  if (!requireSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user || user.role !== "ORG" || !user.org) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }
  if (user.org.status !== "APPROVED") {
    return NextResponse.redirect(new URL("/dashboard/org?error=Your+organization+must+be+approved+before+posting+opportunities", request.url), 303);
  }

  const formData = await request.formData();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const requiredCommitment = resolveCommitmentFromForm(formData, "requiredCommitmentPreset", "requiredCommitmentCustom", "requiredCommitment");
  const availability = buildAvailabilityFromForm(formData, "availability", "availability");
  const radius = Number(formData.get("radius") || 12);
  const radiusUnit = normalizeDistanceUnit(String(formData.get("radiusUnit") || ""));
  const timeZone = normalizeUsTimeZone(String(formData.get("availabilityTimeZone") || ""));
  const oneDayOpportunity = formData.get("oneDayOpportunity") === "on";
  const normalizedCommitment =
    oneDayOpportunity && requiredCommitment ? "One-time event" : requiredCommitment;
  const contactEmail = String(formData.get("contactEmail") || user.org.contactEmail).trim().toLowerCase();
  const contactPhone = String(formData.get("contactPhone") || user.org.contactPhone || "").trim();
  const skills = parseSkillsFromForm(formData, "skills", "skillsCustom");

  if (!title || !description || !normalizedCommitment || !availability || !contactEmail) {
    return NextResponse.redirect(new URL("/dashboard/org?error=Missing+required+fields", request.url), 303);
  }
  if (title.length > 200) return NextResponse.redirect(new URL("/dashboard/org?error=Title+must+be+under+200+characters", request.url), 303);
  if (description.length > 5000) return NextResponse.redirect(new URL("/dashboard/org?error=Description+must+be+under+5000+characters", request.url), 303);
  const filteredSkills = skills.filter((s) => s.length <= 100);

  const opportunity = await prisma.opportunity.create({
    data: {
      orgProfileId: user.org.id,
      title,
      description,
      requiredCommitment: normalizedCommitment,
      availability,
      timeZone,
      radiusKm: Number.isFinite(radius) ? toKilometers(radius, radiusUnit) : toKilometers(12, radiusUnit),
      radiusUnit,
      contactEmail,
      contactPhone: contactPhone || null
    }
  });

  for (const skillName of filteredSkills) {
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

  // Fire-and-forget blast to matching students
  sendOpportunityBlast(opportunity.id, filteredSkills, user.org.organization).catch(() => {});

  return NextResponse.redirect(new URL("/dashboard/org", request.url), 303);
}

async function sendOpportunityBlast(opportunityId: number, skillNames: string[], orgName: string) {
  const opp = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    include: { skills: { include: { skill: true } } }
  });
  if (!opp) return;

  const requiredSkillNames = opp.skills.map((s) => s.skill.name);

  // Find students who have at least one matching skill and haven't unsubscribed
  const students = await prisma.studentProfile.findMany({
    where: {
      emailUnsubscribed: false,
      unsubscribeToken: { not: null },
      skills: { some: { skill: { name: { in: requiredSkillNames } } } }
    },
    include: {
      user: { select: { email: true } },
      skills: { include: { skill: true } }
    }
  });

  for (const student of students) {
    // Basic distance check — skip if student is likely too far
    const distKm = Math.sqrt(
      Math.pow((student.lat - 33.45) * 111, 2) + Math.pow((student.lng - (-112.07)) * 85, 2)
    );
    if (distKm > opp.radiusKm * 2) continue; // generous buffer since lat/lng is estimated

    const studentSkillNames = student.skills.map((s) => s.skill.name);
    const skillsMatched = requiredSkillNames.filter((s) => studentSkillNames.includes(s));

    await sendOpportunityBlastEmail({
      to: student.user.email,
      studentName: student.fullName,
      unsubscribeToken: student.unsubscribeToken!,
      orgName,
      opportunityTitle: opp.title,
      opportunityDescription: opp.description,
      requiredCommitment: opp.requiredCommitment,
      skillsMatched,
      opportunityId: opp.id
    });
  }
}

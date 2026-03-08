import { NextResponse } from "next/server";
import { Prisma, UserRole } from "@prisma/client";
import {
  buildAvailabilityFromForm,
  createSession,
  estimateLatLngFromZip,
  getSessionCookieOptions,
  hashPassword,
  parseSkillsFromForm,
  resolveCommitmentFromForm,
  requireSameOrigin,
  SESSION_COOKIE
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function redirectWithError(request: Request, message: string) {
  const encoded = encodeURIComponent(message);
  return NextResponse.redirect(new URL(`/register/org?error=${encoded}`, request.url), 303);
}

export async function POST(request: Request) {
  if (!requireSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const formData = await request.formData();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const organization = String(formData.get("organization") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const zipCode = String(formData.get("zipCode") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const state = String(formData.get("state") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const contactName = String(formData.get("contactName") || "").trim();
  const contactEmail = String(formData.get("contactEmail") || "").trim().toLowerCase();
  const contactPhone = String(formData.get("contactPhone") || "").trim();
  const websiteUrl = String(formData.get("websiteUrl") || "").trim();
  const volunteerNotes = String(formData.get("volunteerNotes") || "").trim();
  const opportunityTitle = String(formData.get("opportunityTitle") || "").trim();
  const opportunityDescription = String(formData.get("opportunityDescription") || "").trim();
  const requiredCommitment = resolveCommitmentFromForm(formData, "requiredCommitmentPreset", "requiredCommitmentCustom", "requiredCommitment");
  const availability = buildAvailabilityFromForm(formData, "oppAvailability", "availability");
  const opportunitySkills = parseSkillsFromForm(formData, "opportunitySkills", "opportunitySkillsCustom");
  const oneDayOpportunity = formData.get("oneDayOpportunity") === "on";
  const normalizedCommitment =
    oneDayOpportunity && requiredCommitment ? "One-time event" : requiredCommitment;

  if (!email || !password || !organization || !zipCode || !contactName || !contactEmail) {
    return redirectWithError(request, "Please complete all required fields.");
  }
  if (password.length < 8) {
    return redirectWithError(request, "Password must be at least 8 characters.");
  }

  const latLng = estimateLatLngFromZip(zipCode);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
        role: UserRole.ORG,
        org: {
          create: {
            organization,
            category: category || "Senior Home",
            zipCode,
            city: city || null,
            state: state || null,
            lat: latLng.lat,
            lng: latLng.lng,
            description: description || null,
            contactName,
            contactEmail,
            contactPhone: contactPhone || null,
            websiteUrl: websiteUrl || null,
            volunteerNotes: volunteerNotes || null
          }
        }
      },
      include: {
        org: true
      }
    });

    if (!user.org) {
      return redirectWithError(request, "Could not create organization profile.");
    }

    if (opportunityTitle && opportunityDescription && normalizedCommitment && availability) {
      const opportunity = await prisma.opportunity.create({
        data: {
          orgProfileId: user.org.id,
          title: opportunityTitle,
          description: opportunityDescription,
          requiredCommitment: normalizedCommitment,
          availability,
          contactEmail,
          contactPhone: contactPhone || null
        }
      });

      for (const skillName of opportunitySkills) {
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
    }

    const session = await createSession(user.id);
    const response = NextResponse.redirect(new URL("/dashboard/org?onboarding=1", request.url), 303);
    response.cookies.set(SESSION_COOKIE, session.token, getSessionCookieOptions(session.expiresAt));
    return response;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return redirectWithError(request, "That email is already registered.");
    }
    return redirectWithError(request, "Unable to register right now.");
  }
}

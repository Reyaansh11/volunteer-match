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
import { normalizeDistanceUnit, normalizeUsTimeZone, toKilometers } from "@/lib/form-options";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { sendAdminNewOrgEmail } from "@/lib/email";

function redirectWithError(request: Request, message: string) {
  const encoded = encodeURIComponent(message);
  return NextResponse.redirect(new URL(`/register/org?error=${encoded}`, request.url), 303);
}

export async function POST(request: Request) {
  if (!requireSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const ip = getClientIp(request);
  const rl = checkRateLimit(`register:${ip}`, 5, 60 * 60 * 1000); // 5 signups per hour per IP
  if (!rl.allowed) {
    return redirectWithError(request, "Too many registration attempts. Please try again later.");
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
  const contactTitle = String(formData.get("contactTitle") || "").trim();
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
  const opportunityRadius = Number(formData.get("opportunityRadius") || 12);
  const opportunityRadiusUnit = normalizeDistanceUnit(String(formData.get("opportunityRadiusUnit") || ""));
  const opportunityTimeZone = normalizeUsTimeZone(String(formData.get("oppAvailabilityTimeZone") || ""));
  const normalizedCommitment =
    oneDayOpportunity && requiredCommitment ? "One-time event" : requiredCommitment;

  if (!email || !password || !organization || !zipCode || !contactName || !contactTitle || !contactEmail || !websiteUrl) {
    return redirectWithError(request, "Please complete all required fields including your website URL.");
  }
  if (password.length < 8) {
    return redirectWithError(request, "Password must be at least 8 characters.");
  }
  if (!websiteUrl.startsWith("https://")) {
    return redirectWithError(request, "Website URL must start with https://");
  }
  if (email.length > 254) return redirectWithError(request, "Email address is too long.");
  if (organization.length > 150) return redirectWithError(request, "Organization name is too long.");
  if (description.length > 3000) return redirectWithError(request, "Description must be under 3000 characters.");
  if (contactName.length > 100) return redirectWithError(request, "Contact name is too long.");

  // Check email blocklist
  const blocked = await prisma.emailBlocklist.findUnique({ where: { email } });
  if (blocked) {
    return redirectWithError(request, "This email address is not permitted to register.");
  }

  // Reachability check (soft — some sites block server requests)
  let siteReachable = true;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(websiteUrl, { method: "HEAD", signal: controller.signal, redirect: "follow" });
    clearTimeout(timeout);
    siteReachable = res.ok || res.status < 500;
  } catch {
    siteReachable = false;
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
            contactTitle,
            contactEmail,
            contactPhone: contactPhone || null,
            websiteUrl,
            volunteerNotes: volunteerNotes || null,
            status: "PENDING",
            adminNote: siteReachable ? null : "⚠️ Website did not respond during signup check."
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

    // Notify admin — fire and forget
    sendAdminNewOrgEmail({
      id: user.org.id,
      organization: user.org.organization,
      contactName: user.org.contactName,
      contactEmail: user.org.contactEmail,
      websiteUrl: user.org.websiteUrl,
      category: user.org.category,
      city: user.org.city,
      state: user.org.state
    }).catch(() => {});

    if (opportunityTitle && opportunityDescription && normalizedCommitment && availability) {
      const opportunity = await prisma.opportunity.create({
        data: {
          orgProfileId: user.org.id,
          title: opportunityTitle,
          description: opportunityDescription,
          requiredCommitment: normalizedCommitment,
          availability,
          timeZone: opportunityTimeZone,
          contactEmail,
          contactPhone: contactPhone || null,
          radiusKm: Number.isFinite(opportunityRadius) ? toKilometers(opportunityRadius, opportunityRadiusUnit) : toKilometers(12, opportunityRadiusUnit),
          radiusUnit: opportunityRadiusUnit
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

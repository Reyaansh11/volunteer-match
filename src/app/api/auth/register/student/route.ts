import { NextResponse } from "next/server";
import { Prisma, UserRole } from "@prisma/client";
import { randomBytes } from "crypto";
import {
  buildAvailabilityFromForm,
  createSession,
  lookupZipLatLng,
  getSessionCookieOptions,
  hashPassword,
  parseSkillsFromForm,
  requireSameOrigin,
  SESSION_COOKIE
} from "@/lib/auth";
import { normalizeDistanceUnit, normalizeUsTimeZone, toKilometers } from "@/lib/form-options";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

function redirectWithError(request: Request, message: string) {
  const encoded = encodeURIComponent(message);
  return NextResponse.redirect(new URL(`/register/student?error=${encoded}`, request.url), 303);
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
  const fullName = String(formData.get("fullName") || "").trim();
  const school = String(formData.get("school") || "").trim();
  const zipCode = String(formData.get("zipCode") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const state = String(formData.get("state") || "").trim();
  const availability = buildAvailabilityFromForm(formData, "availability", "availability");
  const personalStatement = String(formData.get("personalStatement") || "").trim();
  const letterOfRecUrl = String(formData.get("letterOfRecUrl") || "").trim();
  const programAffiliation = String(formData.get("programAffiliation") || "").trim();
  const maxDistance = Number(formData.get("maxDistance") || 15);
  const distanceUnit = normalizeDistanceUnit(String(formData.get("distanceUnit") || ""));
  const timeZone = normalizeUsTimeZone(String(formData.get("availabilityTimeZone") || ""));
  const phone = String(formData.get("phone") || "").trim();
  const parsedSkills = parseSkillsFromForm(formData, "skills", "skillsCustom");
  const parentConsent = formData.get("parentConsent") === "on";
  const ageConfirmed = formData.get("ageConfirmed") === "on";
  const grade = String(formData.get("grade") || "").trim();

  if (!email || !password || !fullName || !zipCode || !availability || parsedSkills.length === 0 || !grade) {
    return redirectWithError(request, "Please complete all required fields.");
  }
  if (!ageConfirmed) {
    return redirectWithError(request, "You must confirm you are 13 years of age or older to register.");
  }
  if (password.length < 8) return redirectWithError(request, "Password must be at least 8 characters.");
  if (email.length > 254) return redirectWithError(request, "Email address is too long.");
  if (fullName.length > 100) return redirectWithError(request, "Name is too long.");
  if (personalStatement.length > 2000) return redirectWithError(request, "Personal statement must be under 2000 characters.");
  if (school.length > 150) return redirectWithError(request, "School name is too long.");

  const latLng = await lookupZipLatLng(zipCode);
  try {
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
        role: UserRole.STUDENT,
        student: {
          create: {
            fullName,
            school: school || null,
            zipCode,
            city: city || null,
            state: state || null,
            lat: latLng.lat,
            lng: latLng.lng,
            maxDistanceKm: Number.isFinite(maxDistance) ? toKilometers(maxDistance, distanceUnit) : toKilometers(15, distanceUnit),
            distanceUnit,
            timeZone,
            availability,
            personalStatement: personalStatement || null,
            letterOfRecUrl: letterOfRecUrl || null,
            programAffiliation: programAffiliation || null,
            parentConsent,
            phone: phone || null,
            grade: grade || null,
            unsubscribeToken: randomBytes(16).toString("hex")
          }
        }
      },
      include: {
        student: true
      }
    });

    if (!user.student) {
      return redirectWithError(request, "Could not create student profile.");
    }

    for (const skillName of parsedSkills) {
      const skill = await prisma.skill.upsert({
        where: { name: skillName },
        update: {},
        create: { name: skillName }
      });
      await prisma.studentSkill.create({
        data: {
          studentId: user.student.id,
          skillId: skill.id
        }
      });
    }

    const session = await createSession(user.id);
    const response = NextResponse.redirect(new URL("/dashboard/student", request.url), 303);
    response.cookies.set(SESSION_COOKIE, session.token, getSessionCookieOptions(session.expiresAt));
    return response;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return redirectWithError(request, "That email is already registered.");
    }
    return redirectWithError(request, "Unable to register right now.");
  }
}

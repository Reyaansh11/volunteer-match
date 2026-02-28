import { NextResponse } from "next/server";
import { Prisma, UserRole } from "@prisma/client";
import {
  createSession,
  estimateLatLngFromZip,
  getSessionCookieOptions,
  hashPassword,
  parseSkills,
  requireSameOrigin,
  SESSION_COOKIE
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function redirectWithError(request: Request, message: string) {
  const encoded = encodeURIComponent(message);
  return NextResponse.redirect(new URL(`/register/student?error=${encoded}`, request.url), 303);
}

export async function POST(request: Request) {
  if (!requireSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const formData = await request.formData();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("fullName") || "").trim();
  const school = String(formData.get("school") || "").trim();
  const zipCode = String(formData.get("zipCode") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const state = String(formData.get("state") || "").trim();
  const availability = String(formData.get("availability") || "").trim();
  const personalStatement = String(formData.get("personalStatement") || "").trim();
  const letterOfRecUrl = String(formData.get("letterOfRecUrl") || "").trim();
  const programAffiliation = String(formData.get("programAffiliation") || "").trim();
  const maxDistanceKm = Number(formData.get("maxDistanceKm") || 25);
  const phone = String(formData.get("phone") || "").trim();
  const skillsInput = String(formData.get("skills") || "").trim();
  const parentConsent = formData.get("parentConsent") === "on";

  if (!email || !password || !fullName || !zipCode || !availability || !skillsInput) {
    return redirectWithError(request, "Please complete all required fields.");
  }
  if (password.length < 8) {
    return redirectWithError(request, "Password must be at least 8 characters.");
  }

  const latLng = estimateLatLngFromZip(zipCode);
  const parsedSkills = parseSkills(skillsInput);

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
            maxDistanceKm: Number.isFinite(maxDistanceKm) ? maxDistanceKm : 25,
            availability,
            personalStatement: personalStatement || null,
            letterOfRecUrl: letterOfRecUrl || null,
            programAffiliation: programAffiliation || null,
            parentConsent,
            phone: phone || null
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

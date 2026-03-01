import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import {
  estimateLatLngFromZip,
  getCurrentUser,
  parseSkillsFromForm,
  requireSameOrigin
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function redirectWithNotice(request: Request, key: "error" | "success", value: string) {
  const url = new URL("/dashboard/student", request.url);
  url.searchParams.set(key, value);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  if (!requireSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT" || !user.student) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  const formData = await request.formData();
  const fullName = String(formData.get("fullName") || "").trim();
  const school = String(formData.get("school") || "").trim();
  const zipCode = String(formData.get("zipCode") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const state = String(formData.get("state") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const programAffiliation = String(formData.get("programAffiliation") || "").trim();
  const personalStatement = String(formData.get("personalStatement") || "").trim();
  const letterOfRecUrl = String(formData.get("letterOfRecUrl") || "").trim();
  const availability = String(formData.get("availability") || "").trim();
  const maxDistanceKm = Number(formData.get("maxDistanceKm") || 25);
  const parentConsent = formData.get("parentConsent") === "on";
  const parsedSkills = parseSkillsFromForm(formData, "skills", "skillsCustom");

  if (!fullName || !zipCode || !availability || parsedSkills.length === 0) {
    return redirectWithNotice(request, "error", "Please complete all required fields.");
  }

  const studentId = user.student.id;
  const latLng = estimateLatLngFromZip(zipCode);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.studentProfile.update({
        where: { id: studentId },
        data: {
          fullName,
          school: school || null,
          zipCode,
          city: city || null,
          state: state || null,
          phone: phone || null,
          programAffiliation: programAffiliation || null,
          personalStatement: personalStatement || null,
          letterOfRecUrl: letterOfRecUrl || null,
          availability,
          parentConsent,
          maxDistanceKm: Number.isFinite(maxDistanceKm) ? maxDistanceKm : 25,
          lat: latLng.lat,
          lng: latLng.lng
        }
      });

      await tx.studentSkill.deleteMany({
        where: { studentId }
      });

      for (const skillName of parsedSkills) {
        const skill = await tx.skill.upsert({
          where: { name: skillName },
          update: {},
          create: { name: skillName }
        });

        await tx.studentSkill.create({
          data: {
            studentId,
            skillId: skill.id
          }
        });
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return redirectWithNotice(request, "error", "Could not update profile right now.");
    }
    return redirectWithNotice(request, "error", "Unable to update profile.");
  }

  return redirectWithNotice(request, "success", "Profile updated.");
}

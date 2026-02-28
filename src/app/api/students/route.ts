import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const students = await prisma.studentProfile.findMany({
    include: {
      user: {
        select: {
          email: true
        }
      },
      skills: {
        include: {
          skill: true
        }
      }
    }
  });

  return NextResponse.json(
    students.map((student) => ({
      id: student.id,
      fullName: student.fullName,
      email: student.user.email,
      zipCode: student.zipCode,
      availability: student.availability,
      programAffiliation: student.programAffiliation,
      parentConsent: student.parentConsent,
      personalStatement: student.personalStatement,
      skills: student.skills.map((entry) => entry.skill.name)
    }))
  );
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rankOpportunities } from "@/lib/matching";

export async function GET(_: Request, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const id = Number(studentId);

  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "studentId must be a number" }, { status: 400 });
  }

  const student = await prisma.studentProfile.findUnique({
    where: { id },
    include: {
      skills: {
        include: {
          skill: true
        }
      }
    }
  });

  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const opportunities = await prisma.opportunity.findMany({
    include: {
      orgProfile: true,
      skills: {
        include: {
          skill: true
        }
      }
    }
  });

  const ranked = rankOpportunities(student, opportunities);

  return NextResponse.json({
    student: {
      id: student.id,
      fullName: student.fullName,
      maxDistanceKm: student.maxDistanceKm
    },
    matches: ranked.map((match) => ({
      rank: match.rank,
      opportunityId: match.opportunityId,
      title: match.title,
      organization: match.organization,
      distanceKm: match.distanceKm,
      skillsMatched: match.skillsMatched,
      skillsMissing: match.skillsMissing
    }))
  });
}

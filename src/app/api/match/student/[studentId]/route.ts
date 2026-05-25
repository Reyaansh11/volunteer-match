import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rankOpportunities } from "@/lib/matching";

export async function GET(request: Request, { params }: { params: Promise<{ studentId: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ORG") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    where: { archived: false, orgProfile: { status: "APPROVED" } },
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

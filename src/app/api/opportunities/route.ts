import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

  return NextResponse.json(
    opportunities.map((opportunity) => ({
      id: opportunity.id,
      title: opportunity.title,
      organization: opportunity.orgProfile.organization,
      availability: opportunity.availability,
      requiredCommitment: opportunity.requiredCommitment,
      contactEmail: opportunity.contactEmail,
      contactPhone: opportunity.contactPhone,
      skills: opportunity.skills.map((entry) => ({
        name: entry.skill.name,
        required: entry.required
      }))
    }))
  );
}

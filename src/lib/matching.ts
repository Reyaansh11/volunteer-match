import {
  Opportunity,
  OpportunitySkill,
  OrgProfile,
  Skill,
  StudentProfile,
  StudentSkill,
  User
} from "@prisma/client";
import { RankedOpportunity, RankedStudent } from "@/types/matching";

type StudentWithSkills = StudentProfile & { skills: (StudentSkill & { skill: Skill })[] };
type OpportunityWithDetails = Opportunity & {
  orgProfile: OrgProfile;
  skills: (OpportunitySkill & { skill: Skill })[];
};
type StudentCandidate = StudentProfile & {
  skills: (StudentSkill & { skill: Skill })[];
  user: Pick<User, "email">;
};

const WEIGHTS = {
  distance: 0.4,
  skill: 0.35,
  availability: 0.25
};

function isOneDayCommitment(requiredCommitment: string) {
  const normalized = requiredCommitment.trim().toLowerCase();
  return normalized.includes("one-time") || normalized.includes("one time") || normalized.includes("single-day");
}

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function parseWindows(raw: string): Set<string> {
  return new Set(
    raw
      .toLowerCase()
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean)
  );
}

function availabilityOverlap(studentAvailability: string, opportunityAvailability: string): number {
  const studentWindows = parseWindows(studentAvailability);
  const opportunityWindows = parseWindows(opportunityAvailability);

  if (!studentWindows.size || !opportunityWindows.size) {
    return 0;
  }

  let overlap = 0;
  for (const window of opportunityWindows) {
    if (studentWindows.has(window)) {
      overlap += 1;
    }
  }

  return overlap / opportunityWindows.size;
}

function round(value: number) {
  return Math.round(value * 1000) / 1000;
}

export function rankOpportunities(student: StudentWithSkills, opportunities: OpportunityWithDetails[]): RankedOpportunity[] {
  const studentSkills = new Set(student.skills.map((entry) => entry.skill.name.toLowerCase()));

  const scored = opportunities.map((opportunity) => {
    const distanceKm = haversineKm(student.lat, student.lng, opportunity.orgProfile.lat, opportunity.orgProfile.lng);
    const maxDistance = Math.min(student.maxDistanceKm, opportunity.radiusKm);
    const distanceScore = distanceKm <= maxDistance ? 1 - distanceKm / Math.max(maxDistance, 1) : 0;

    const requiredSkills = opportunity.skills.filter((entry) => entry.required).map((entry) => entry.skill.name.toLowerCase());
    const allOpportunitySkills = opportunity.skills.map((entry) => entry.skill.name.toLowerCase());

    const matchedRequired = requiredSkills.filter((name) => studentSkills.has(name));
    const skillScore = requiredSkills.length ? matchedRequired.length / requiredSkills.length : 1;

    const availabilityScore = availabilityOverlap(student.availability, opportunity.availability);

    const totalScore = isOneDayCommitment(opportunity.requiredCommitment)
      ? distanceScore * 0.55 + skillScore * 0.45
      : distanceScore * WEIGHTS.distance + skillScore * WEIGHTS.skill + availabilityScore * WEIGHTS.availability;

    return {
      opportunityId: opportunity.id,
      title: opportunity.title,
      organization: opportunity.orgProfile.organization,
      requiredCommitment: opportunity.requiredCommitment,
      availability: opportunity.availability,
      contactEmail: opportunity.contactEmail,
      contactPhone: opportunity.contactPhone,
      distanceKm: round(distanceKm),
      rank: 0,
      breakdown: {
        distanceScore: round(distanceScore),
        skillScore: round(skillScore),
        availabilityScore: round(availabilityScore),
        totalScore: round(totalScore)
      },
      skillsMatched: allOpportunitySkills.filter((name) => studentSkills.has(name)),
      skillsMissing: requiredSkills.filter((name) => !studentSkills.has(name))
    };
  });

  return scored.sort((a, b) => b.breakdown.totalScore - a.breakdown.totalScore).map((item, index) => ({
    ...item,
    rank: index + 1
  }));
}

export function rankStudentsForOpportunity(
  opportunity: OpportunityWithDetails,
  students: StudentCandidate[],
  maxDistanceKm: number
): RankedStudent[] {
  const requiredSkills = opportunity.skills.filter((entry) => entry.required).map((entry) => entry.skill.name.toLowerCase());
  const opportunitySkills = opportunity.skills.map((entry) => entry.skill.name.toLowerCase());

  const scored = students.map((student) => {
    const studentSkills = new Set(student.skills.map((entry) => entry.skill.name.toLowerCase()));
    const distanceKm = haversineKm(student.lat, student.lng, opportunity.orgProfile.lat, opportunity.orgProfile.lng);
    const effectiveDistance = Math.min(maxDistanceKm, student.maxDistanceKm);
    const distanceScore = distanceKm <= effectiveDistance ? 1 - distanceKm / Math.max(effectiveDistance, 1) : 0;
    const matchedRequired = requiredSkills.filter((name) => studentSkills.has(name));
    const skillScore = requiredSkills.length ? matchedRequired.length / requiredSkills.length : 1;
    const availabilityScore = availabilityOverlap(student.availability, opportunity.availability);
    const totalScore = isOneDayCommitment(opportunity.requiredCommitment)
      ? distanceScore * 0.55 + skillScore * 0.45
      : distanceScore * WEIGHTS.distance + skillScore * WEIGHTS.skill + availabilityScore * WEIGHTS.availability;

    return {
      studentId: student.id,
      fullName: student.fullName,
      email: student.user.email,
      school: student.school,
      programAffiliation: student.programAffiliation,
      personalStatement: student.personalStatement,
      letterOfRecUrl: student.letterOfRecUrl,
      rank: 0,
      distanceKm: round(distanceKm),
      availability: student.availability,
      skillsMatched: opportunitySkills.filter((name) => studentSkills.has(name)),
      skillsMissing: requiredSkills.filter((name) => !studentSkills.has(name)),
      totalScore
    };
  });

  return scored
    .sort((a, b) => b.totalScore - a.totalScore)
    .map((item, index) => ({
      studentId: item.studentId,
      fullName: item.fullName,
      email: item.email,
      school: item.school,
      programAffiliation: item.programAffiliation,
      personalStatement: item.personalStatement,
      letterOfRecUrl: item.letterOfRecUrl,
      rank: index + 1,
      distanceKm: item.distanceKm,
      availability: item.availability,
      skillsMatched: item.skillsMatched,
      skillsMissing: item.skillsMissing
    }));
}

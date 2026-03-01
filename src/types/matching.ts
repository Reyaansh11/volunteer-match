export type MatchBreakdown = {
  distanceScore: number;
  skillScore: number;
  availabilityScore: number;
  totalScore: number;
};

export type RankedOpportunity = {
  opportunityId: number;
  title: string;
  organization: string;
  contactEmail: string;
  contactPhone: string | null;
  distanceKm: number;
  rank: number;
  breakdown: MatchBreakdown;
  skillsMatched: string[];
  skillsMissing: string[];
};

export type RankedStudent = {
  studentId: number;
  fullName: string;
  email: string;
  school: string | null;
  programAffiliation: string | null;
  personalStatement: string | null;
  letterOfRecUrl: string | null;
  rank: number;
  distanceKm: number;
  availability: string;
  skillsMatched: string[];
  skillsMissing: string[];
};

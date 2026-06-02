export const SKILL_OPTIONS = [
  "public speaking",
  "conversation",
  "music",
  "entertainer",
  "reading",
  "arts & crafts",
  "technology help",
  "games & activities",
  "language support",
  "tutoring",
  "event planning",
  "companionship",
  "pet management",
  "animal care",
  "food boxing",
  "meal packing",
  "boxing",
  "sorting donations",
  "warehouse support",
  "clean-up",
  "transport support",
  "gardening",
  "fundraising"
] as const;

export const DEFAULT_US_TIME_ZONE = "America/Denver" as const;

export const US_TIMEZONE_OPTIONS = [
  { value: "America/Phoenix", label: "Mountain Time (Arizona)" },
  { value: "America/Denver", label: "Mountain Time" },
  { value: "America/Los_Angeles", label: "Pacific Time" },
  { value: "America/Chicago", label: "Central Time" },
  { value: "America/New_York", label: "Eastern Time" },
  { value: "America/Anchorage", label: "Alaska Time" },
  { value: "Pacific/Honolulu", label: "Hawaii Time" }
] as const;

export const DEFAULT_DISTANCE_UNIT = "mi" as const;
export const DISTANCE_UNIT_OPTIONS = [
  { value: "mi", label: "Miles (mi)" },
  { value: "km", label: "Kilometers (km)" }
] as const;

export type DistanceUnit = (typeof DISTANCE_UNIT_OPTIONS)[number]["value"];

const DISTANCE_UNIT_SET = new Set<DistanceUnit>(DISTANCE_UNIT_OPTIONS.map((option) => option.value));
const TIME_ZONE_SET = new Set<string>(US_TIMEZONE_OPTIONS.map((option) => option.value));

export function normalizeDistanceUnit(input: string | null | undefined, fallback: DistanceUnit = DEFAULT_DISTANCE_UNIT): DistanceUnit {
  return DISTANCE_UNIT_SET.has(input as DistanceUnit) ? (input as DistanceUnit) : fallback;
}

export function normalizeUsTimeZone(input: string | null | undefined, fallback = DEFAULT_US_TIME_ZONE): string {
  return input && TIME_ZONE_SET.has(input) ? input : fallback;
}

export function toKilometers(value: number, unit: DistanceUnit) {
  return unit === "mi" ? value * 1.60934 : value;
}

export function fromKilometers(valueKm: number, unit: DistanceUnit) {
  return unit === "mi" ? valueKm / 1.60934 : valueKm;
}

export function formatTimeZoneLabel(timeZone: string) {
  return US_TIMEZONE_OPTIONS.find((option) => option.value === timeZone)?.label || timeZone;
}

export const COMMITMENT_OPTIONS = [
  "1 hour/week",
  "2 hours/week",
  "3 hours/week",
  "4+ hours/week",
  "One-time event",
  "Flexible"
] as const;

export const SUPERVISOR_TITLE_OPTIONS = [
  "Coach",
  "Supervisor",
  "Advisor",
  "Manager",
  "Director",
  "Coordinator",
  "Teacher",
  "Other"
] as const;

export const GRADE_OPTIONS = [
  { value: "8",             label: "8th Grade" },
  { value: "9",             label: "9th Grade" },
  { value: "10",            label: "10th Grade" },
  { value: "11",            label: "11th Grade" },
  { value: "12",            label: "12th Grade" },
  { value: "college",       label: "College Student" },
  { value: "not-in-school", label: "Not in School" },
] as const;

const GRADE_RANK: Record<string, number> = {
  "8": 8, "9": 9, "10": 10, "11": 11, "12": 12,
  "college": 13, "not-in-school": 14
};

export function gradeRank(grade: string | null | undefined): number {
  return GRADE_RANK[grade ?? ""] ?? 99;
}

export function meetsGradeRequirement(
  studentGrade: string | null | undefined,
  oppMinGrade: string | null | undefined
): boolean {
  if (!oppMinGrade) return true;
  return gradeRank(studentGrade) >= gradeRank(oppMinGrade);
}

export function gradeLabel(grade: string | null | undefined): string {
  return GRADE_OPTIONS.find((g) => g.value === grade)?.label ?? (grade ?? "");
}

export const DAY_OPTIONS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export const TIME_OPTIONS = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00"
] as const;

import Link from "next/link";
import { rankOpportunities } from "@/lib/matching";
import { prisma } from "@/lib/prisma";

type MatchPageProps = {
  searchParams: Promise<{ studentId?: string }>;
};

export default async function MatchesPage({ searchParams }: MatchPageProps) {
  const params = await searchParams;
  const studentId = Number(params.studentId ?? "1");

  const student = Number.isFinite(studentId)
    ? await prisma.studentProfile.findUnique({
        where: { id: studentId },
        include: {
          skills: {
            include: {
              skill: true
            }
          }
        }
      })
    : null;

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

  const matches = student ? rankOpportunities(student, opportunities) : [];

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-12">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold text-slate-900">Match Results</h1>
        <div className="flex gap-2">
          <Link href="/students" className="rounded-lg bg-white px-4 py-2 text-sm font-medium ring-1 ring-slate-300 hover:bg-slate-50">
            Students
          </Link>
          <Link href="/" className="rounded-lg bg-white px-4 py-2 text-sm font-medium ring-1 ring-slate-300 hover:bg-slate-50">
            Home
          </Link>
        </div>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-700">Showing matches for student ID: {Number.isFinite(studentId) ? studentId : "Invalid"}</p>
        {student ? (
          <>
            <p className="mt-2 text-lg font-semibold text-slate-900">{student.fullName}</p>
            <p className="mt-1 text-sm text-slate-700">Skills: {student.skills.map((s) => s.skill.name).join(", ")}</p>
            <p className="mt-1 text-sm text-slate-700">Availability: {student.availability}</p>
          </>
        ) : (
          <p className="mt-2 text-sm text-red-700">Student not found. Try /matches?studentId=1</p>
        )}
      </section>

      {student && (
        <section className="grid gap-4">
          {matches.map((match) => (
            <article key={match.opportunityId} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-slate-900">{match.title}</h2>
                <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">Rank #{match.rank}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{match.organization}</p>
              <p className="mt-2 text-sm text-slate-700">Time needed: {match.availability}</p>
              <p className="mt-2 text-sm text-slate-700">Commitment: {match.requiredCommitment}</p>
              <p className="mt-2 text-sm text-slate-700">Distance: {match.distanceKm} km</p>
              <p className="mt-2 text-sm text-slate-700">Contact details are shown in dashboard after an accepted request.</p>
              <p className="mt-2 text-sm text-slate-700">Matched skills: {match.skillsMatched.join(", ") || "None"}</p>
              <p className="mt-2 text-sm text-slate-700">Missing required skills: {match.skillsMissing.join(", ") || "None"}</p>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

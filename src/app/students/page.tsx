import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function StudentsPage() {
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
    },
    orderBy: {
      id: "asc"
    }
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-12">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold text-slate-900">Students</h1>
        <Link href="/" className="rounded-lg bg-white px-4 py-2 text-sm font-medium ring-1 ring-slate-300 hover:bg-slate-50">
          Back Home
        </Link>
      </header>

      <section className="grid gap-4">
        {students.length === 0 ? (
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">No students found.</article>
        ) : (
          students.map((student) => (
            <article key={student.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-slate-900">{student.fullName}</h2>
                <Link
                  href={`/matches?studentId=${student.id}`}
                  className="rounded-md bg-brand-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-500"
                >
                  View Matches
                </Link>
              </div>
              <p className="mt-2 text-sm text-slate-700">Email: {student.user.email}</p>
              <p className="mt-2 text-sm text-slate-700">ZIP: {student.zipCode} | Max distance: {student.maxDistanceKm} km</p>
              <p className="mt-2 text-sm text-slate-700">Availability: {student.availability}</p>
              <p className="mt-2 text-sm text-slate-700">Program: {student.programAffiliation || "Not provided"}</p>
              <p className="mt-2 text-sm text-slate-700">Parent consent: {student.parentConsent ? "Confirmed" : "Not confirmed"}</p>
              <p className="mt-2 text-sm text-slate-700">Personal statement: {student.personalStatement || "Not provided"}</p>
              <p className="mt-2 text-sm text-slate-700">Skills: {student.skills.map((s) => s.skill.name).join(", ") || "None"}</p>
            </article>
          ))
        )}
      </section>
    </main>
  );
}

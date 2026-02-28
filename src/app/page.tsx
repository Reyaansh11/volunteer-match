import Link from "next/link";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";

const highlights = [
  "Students create a profile with skills, parent consent, and personal goals.",
  "Volunteer programs publish opportunities with required skills and contact details.",
  "The platform ranks matches internally and presents clear, approachable lists."
];

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-14">
      <section className="rounded-2xl border border-brand-700/20 bg-white/85 p-9 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-500">Student + Program Matching</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">Volunteer Match</h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-700">
          A full website where students and volunteer programs can sign in, build profiles, and connect through ranked opportunities.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/register/student" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500">
            Student Sign Up
          </Link>
          <Link href="/register/org" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
            Program Sign Up
          </Link>
          <Link href="/login" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 ring-1 ring-slate-300 hover:bg-slate-100">
            Log In
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {highlights.map((item) => (
          <article key={item} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-slate-800">{item}</p>
          </article>
        ))}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Explore</h2>
        {!user ? (
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/opportunities" className="rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-200">
              View Local Opportunities
            </Link>
            <Link href="/register/student" className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500">
              Start as Student
            </Link>
          </div>
        ) : null}
        {user?.role === UserRole.STUDENT ? (
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/dashboard/student" className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500">
              Explore Nearby Opportunities
            </Link>
            <Link href="/opportunities" className="rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-200">
              View Opportunity Details
            </Link>
          </div>
        ) : null}
        {user?.role === UserRole.ORG ? (
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/dashboard/org" className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500">
              View Ranked Student Matches
            </Link>
            <Link href="/dashboard/org" className="rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-200">
              Post or Manage Opportunities
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}

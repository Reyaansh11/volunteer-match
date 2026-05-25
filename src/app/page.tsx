import Link from "next/link";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";

const highlights = [
  { icon: "🎓", text: "Students build a profile with skills, availability, and service goals." },
  { icon: "📋", text: "Local programs post opportunities and connect after accepted match requests." },
  { icon: "✅", text: "Service completion is logged with verified hours for both students and organizations." }
];

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="space-y-6">

        {/* ── Hero ── */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
          {/* Decorative green glow blobs */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand-50 opacity-60 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-[#a0f2e1] opacity-30 blur-3xl" />

          <div className="relative">
            <span className="inline-block rounded-full bg-brand-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand-700">
              Students Serving, Communities Growing
            </span>
            <h1 className="mt-4 max-w-3xl text-4xl tracking-tight text-slate-900 sm:text-5xl">
              ServeConnect
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
              A community-first platform for students and local organizations to find each other,
              confirm fit, and track verified service hours.
            </p>

            {!user ? (
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/register/student" className="rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 active:scale-95 transition-all">
                  Student Sign Up
                </Link>
                <Link href="/register/org" className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition-colors">
                  Organization Sign Up
                </Link>
                <Link href="/login" className="rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors">
                  Log In
                </Link>
              </div>
            ) : null}
          </div>
        </section>

        {/* ── Quick Actions ── */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl text-slate-900">Quick Actions</h2>
          <p className="mt-1 text-sm text-slate-600">Jump directly to the next step.</p>

          {!user ? (
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/opportunities" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">
                View Opportunities
              </Link>
              <Link href="/register/student" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 transition-colors">
                Start as Student
              </Link>
              <Link href="/register/org" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">
                Start as Organization
              </Link>
            </div>
          ) : null}

          {user?.role === UserRole.STUDENT ? (
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/dashboard/student?view=ranked" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 transition-colors">
                Explore Ranked Opportunities
              </Link>
              <Link href="/dashboard/student?view=matches" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">
                View Your Matches
              </Link>
              <Link href="/dashboard/student?view=log" className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors">
                View Service Log
              </Link>
            </div>
          ) : null}

          {user?.role === UserRole.ORG ? (
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/dashboard/org?view=post" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 transition-colors">
                Post Opportunity
              </Link>
              <Link href="/dashboard/org?view=ranked" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">
                View Ranked Students
              </Link>
              <Link href="/dashboard/org?view=accepted" className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors">
                Confirm Completed Tasks
              </Link>
            </div>
          ) : null}
        </section>

        {/* ── Highlights ── */}
        <section className="grid gap-4 md:grid-cols-3">
          {highlights.map((item) => (
            <article key={item.text} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="mt-0.5 text-2xl">{item.icon}</span>
              <p className="text-sm leading-relaxed text-slate-700">{item.text}</p>
            </article>
          ))}
        </section>

        {/* ── For Students / For Programs ── */}
        <section className="grid gap-4 md:grid-cols-2">
          {/* Students — light card */}
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
              For Students
            </span>
            <h3 className="mt-3 text-lg text-slate-900">Find Purpose in Every Hour</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Discover nearby opportunities that match your availability and strengths. Once a
              request is accepted, connect directly and complete verified service records.
            </p>
            {!user ? (
              <Link href="/register/student" className="mt-4 inline-block rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 transition-colors">
                Sign up as Student →
              </Link>
            ) : null}
          </article>

          {/* Programs — dark card (inverse-surface) */}
          <article className="relative overflow-hidden rounded-2xl bg-slate-800 p-6 shadow-sm">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-50 opacity-10 blur-2xl" />
            <span className="inline-block rounded-full bg-[#a0f2e1]/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#a0f2e1]">
              For Programs
            </span>
            <h3 className="mt-3 text-lg text-white">Streamline Your Civic Reach</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Post opportunities, review ranked candidates, manage requests, and confirm completed
              hours after participation is finished.
            </p>
            {!user ? (
              <Link href="/register/org" className="mt-4 inline-block rounded-lg bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-white transition-colors">
                Register Organization →
              </Link>
            ) : null}
          </article>
        </section>

        {/* ── How It Works ── */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl text-slate-900">How ServeConnect Works</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">S</span>
                <h3 className="text-base text-slate-900">Student Journey</h3>
              </div>
              <ol className="space-y-2 pl-1 text-sm leading-relaxed text-slate-700">
                {[
                  "Create your account and build a profile with your strengths, availability, and goals.",
                  "Review personalized, ranked opportunities that fit your schedule and interests.",
                  "Send match requests and connect once organizations accept.",
                  "Complete your service and track your impact.",
                  "Track your completed tasks and total verified service hours in one place."
                ].map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-brand-700 text-xs font-bold text-brand-700">{i + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </article>
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#006054] text-sm font-bold text-white">O</span>
                <h3 className="text-base text-slate-900">Organization Journey</h3>
              </div>
              <ol className="space-y-2 pl-1 text-sm leading-relaxed text-slate-700">
                {[
                  "Register your organization and share volunteer needs, schedules, and contact details.",
                  "Post opportunities and see students ranked by fit.",
                  "Send or respond to match requests with full control over approvals.",
                  "Coordinate service directly after a match is confirmed.",
                  "Confirm completed tasks and contribute verified service-hour totals for students."
                ].map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-[#006054] text-xs font-bold text-[#006054]">{i + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </article>
          </div>
        </section>

      </div>
    </main>
  );
}

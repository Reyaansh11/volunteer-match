import Link from "next/link";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";

// Heroicons-style SVG icons (24×24 stroke, 1.5 weight)
function IconGraduationCap({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.627 48.627 0 0 1 12 20.904a48.627 48.627 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.57 50.57 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
    </svg>
  );
}

function IconClipboard({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
    </svg>
  );
}

function IconCheckCircle({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

const highlights = [
  { Icon: IconGraduationCap, text: "Students build a profile with skills, availability, and service goals." },
  { Icon: IconClipboard,     text: "Local programs post opportunities and connect after accepted match requests." },
  { Icon: IconCheckCircle,   text: "Service completion is logged with verified hours for both students and organizations." }
];

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="space-y-6">

        {/* ── Hero ── */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
          {/* Subtle decorative blobs — very low opacity */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand-50 opacity-40 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-[#b8ece3] opacity-20 blur-3xl" />

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
              <Link href="/dashboard/student?view=records" className="rounded-lg border border-brand-700/30 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50/80 transition-colors">
                Service Records
              </Link>
              <Link href="/dashboard/student?view=log" className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors">
                Service Log
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
          {highlights.map(({ Icon, text }) => (
            <article key={text} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="mt-0.5 flex-shrink-0 text-brand-700">
                <Icon className="h-5 w-5" />
              </span>
              <p className="text-sm leading-relaxed text-slate-700">{text}</p>
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

          {/* Programs — dark card (inverse-surface), teal accent toned down */}
          <article className="relative overflow-hidden rounded-2xl bg-slate-800 p-6 shadow-sm">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#84d5c5] opacity-10 blur-2xl" />
            <span className="inline-block rounded-full bg-[#84d5c5]/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#84d5c5]">
              For Programs
            </span>
            <h3 className="mt-3 text-lg text-white">Streamline Your Civic Reach</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Post opportunities, review ranked candidates, manage requests, and confirm completed
              hours after participation is finished.
            </p>
            {!user ? (
              <Link href="/register/org" className="mt-4 inline-block rounded-lg bg-white/10 border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors">
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

        {/* ── Contact ── */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base text-slate-900">Questions or feedback?</h2>
              <p className="mt-0.5 text-sm text-slate-600">
                Reach out directly — I read every message.
              </p>
            </div>
            <a
              href="mailto:reyaansh.tomar11@gmail.com"
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-brand-700 transition-colors sm:mt-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
              reyaansh.tomar11@gmail.com
            </a>
          </div>
        </section>

      </div>
    </main>
  );
}

import Link from "next/link";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";

const highlights = [
  "Students build a profile with skills, availability, and service goals.",
  "Local programs post opportunities and connect after accepted match requests.",
  "Service hours can be verified and exported as completed forms."
];

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="self-start rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm lg:sticky lg:top-24">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-500">Start Here</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Welcome to ServeConnect</h2>
          <p className="mt-1 text-sm text-slate-700">Simple workflows for students and organizations to coordinate real service work.</p>

          <nav className="mt-4 space-y-1 text-sm">
            <a href="#home-overview" className="block rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100">Overview</a>
            <a href="#home-explore" className="block rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100">Explore Options</a>
            <a href="#home-groups" className="block rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100">Who It Helps</a>
            <a href="#home-how" className="block rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100">How It Works</a>
          </nav>

          <div className="mt-5 rounded-xl border border-brand-700/20 bg-brand-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Quick Access</p>
            <div className="mt-3 grid gap-2">
              {!user ? (
                <>
                  <Link href="/register" className="rounded-md bg-brand-700 px-3 py-2 text-center text-sm font-medium text-white hover:bg-brand-500">Create Account</Link>
                  <Link href="/login" className="rounded-md bg-white px-3 py-2 text-center text-sm font-medium text-slate-900 ring-1 ring-slate-300 hover:bg-slate-100">Log In</Link>
                </>
              ) : (
                <Link
                  href={user.role === UserRole.STUDENT ? "/dashboard/student" : "/dashboard/org"}
                  className="rounded-md bg-brand-700 px-3 py-2 text-center text-sm font-medium text-white hover:bg-brand-500"
                >
                  Open Dashboard
                </Link>
              )}
              <Link href="/opportunities" className="rounded-md bg-white px-3 py-2 text-center text-sm font-medium text-slate-900 ring-1 ring-slate-300 hover:bg-slate-100">
                Browse Opportunities
              </Link>
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          <section id="home-overview" className="relative overflow-hidden rounded-3xl border border-brand-700/20 bg-white/95 p-8 shadow-sm sm:p-10">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-brand-50 to-transparent" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">Students Serving, Communities Growing</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">ServeConnect</h1>
            <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-700">
              A community-first platform for students and local organizations to find each other, confirm fit, and track verified service hours.
            </p>
            {!user ? (
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/register" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500">
                  Sign Up
                </Link>
                <Link href="/login" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 ring-1 ring-slate-300 hover:bg-slate-100">
                  Log In
                </Link>
              </div>
            ) : null}
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {highlights.map((item) => (
              <article key={item} className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm">
                <p className="text-sm leading-relaxed text-slate-800">{item}</p>
              </article>
            ))}
          </section>

          <section id="home-explore" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Explore ServeConnect</h2>
            <p className="mt-1 text-sm text-slate-600">Choose the path that fits your role today.</p>
            {!user ? (
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/opportunities" className="rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-200">
                  View Local Opportunities
                </Link>
                <Link href="/register/student" className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500">
                  Start as Student
                </Link>
                <Link href="/register/org" className="rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-900 ring-1 ring-slate-300 hover:bg-slate-100">
                  Start as Organization
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

          <section id="home-groups" className="grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">For Students</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                Discover nearby opportunities that match your availability and strengths. Once a request is accepted, connect directly and complete verified service records.
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">For Programs</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                Post opportunities, review ranked candidates, manage requests, and finalize service-hour forms with one workflow after participation is complete.
              </p>
            </article>
          </section>

          <section id="home-how" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">How ServeConnect Works</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <article className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-base font-semibold text-slate-900">Student Journey</h3>
                <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
                  <li>Create your account and build a profile with your strengths, availability, and goals.</li>
                  <li>Review personalized, ranked opportunities that fit your schedule and interests.</li>
                  <li>Send match requests and connect once organizations accept.</li>
                  <li>Complete your service and track your impact.</li>
                  <li>Download verified, ready-to-submit service-hour forms for NHS and similar programs.</li>
                </ol>
              </article>
              <article className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-base font-semibold text-slate-900">Organization Journey</h3>
                <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
                  <li>Register your organization and share volunteer needs, schedules, and contact details.</li>
                  <li>Post opportunities and see students ranked by fit.</li>
                  <li>Send or respond to match requests with full control over approvals.</li>
                  <li>Coordinate service directly after a match is confirmed.</li>
                  <li>Auto-fill and issue digital service-hour verification forms after completion.</li>
                </ol>
              </article>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

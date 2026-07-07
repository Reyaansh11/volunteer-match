import Link from "next/link";
import Image from "next/image";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <main className="w-full">

      {/* ── Hero — full-viewport ── */}
      <section className="relative flex min-h-[calc(100dvh-65px)] flex-col items-center justify-center overflow-hidden bg-white px-4 text-center">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-50 opacity-50 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-[#b8ece3] opacity-25 blur-3xl" />

        <div className="relative flex flex-col items-center">
          <Image
            src="/logo.png"
            alt="ServeConnect"
            width={96}
            height={96}
            className="mb-6 rounded-full shadow-md"
            priority
          />

          <span className="inline-block rounded-full bg-brand-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand-700">
            Students Serving, Communities Growing
          </span>

          <h1 className="mt-5 max-w-2xl text-5xl tracking-tight text-slate-900 sm:text-6xl">
            ServeConnect
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
            A community-first platform connecting students with local organizations —
            find the right fit, confirm the match, and track verified service hours.
          </p>

          {!user ? (
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/register/student" className="rounded-lg bg-brand-700 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 active:scale-95 transition-all">
                Student Sign Up
              </Link>
              <Link href="/register/org" className="rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition-colors">
                Organization Sign Up
              </Link>
              <Link href="/login" className="rounded-lg bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors">
                Log In
              </Link>
            </div>
          ) : user.role === UserRole.STUDENT ? (
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/dashboard/student?view=ranked" className="rounded-lg bg-brand-700 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-500 transition-colors">
                Explore Opportunities
              </Link>
              <Link href="/dashboard/student" className="rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition-colors">
                My Dashboard
              </Link>
            </div>
          ) : user.role === UserRole.ORG ? (
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/dashboard/org?view=post" className="rounded-lg bg-brand-700 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-500 transition-colors">
                Post Opportunity
              </Link>
              <Link href="/dashboard/org" className="rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition-colors">
                My Dashboard
              </Link>
            </div>
          ) : null}
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 flex flex-col items-center gap-1.5 text-slate-400">
          <span className="text-xs tracking-wide">Learn more</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 animate-bounce">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </section>

      {/* ── Below-fold content ── */}
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-10 sm:px-6">

        {/* ── For Students / For Programs ── */}
        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
              For Students
            </span>
            <h2 className="mt-3 text-lg text-slate-900">Find Purpose in Every Hour</h2>
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

          <article className="relative overflow-hidden rounded-2xl bg-slate-800 p-6 shadow-sm">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#84d5c5] opacity-10 blur-2xl" />
            <span className="inline-block rounded-full bg-[#84d5c5]/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#84d5c5]">
              For Programs
            </span>
            <h2 className="mt-3 text-lg text-white">Streamline Your Civic Reach</h2>
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
                  "Track completed tasks and total verified service hours in one place."
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

        {/* ── In the Community ── */}
        <section className="rounded-2xl border border-brand-700/20 bg-brand-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-block rounded-full bg-brand-700/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
                In the Community
              </span>
              <h2 className="mt-2 text-xl text-slate-900">Stories &amp; Updates</h2>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600">
                See how students and organizations across the country are using ServeConnect — plus
                advice for NHS and NJHS advisors on making service hours work.
              </p>
            </div>
            <Link
              href="/community"
              className="shrink-0 self-start rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-500 transition-colors sm:self-auto"
            >
              Read posts →
            </Link>
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

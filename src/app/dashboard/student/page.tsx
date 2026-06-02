import Link from "next/link";
import { MatchRequestStatus, RequestInitiator, UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import {
  DISTANCE_UNIT_OPTIONS,
  fromKilometers,
  formatTimeZoneLabel,
  gradeLabel,
  meetsGradeRequirement,
  normalizeDistanceUnit,
  normalizeUsTimeZone,
  SKILL_OPTIONS,
  US_TIMEZONE_OPTIONS
} from "@/lib/form-options";
import { rankOpportunities } from "@/lib/matching";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guards";

export const dynamic = "force-dynamic";

type StudentDashboardView = "overview" | "incoming" | "matches" | "log" | "records" | "ranked" | "history";

const STUDENT_VIEW_LABELS: Record<StudentDashboardView, string> = {
  overview: "Overview",
  incoming: "Incoming Requests",
  matches: "Active Matches",
  log: "Service Log",
  records: "Service Records",
  ranked: "Ranked Opportunities",
  history: "Request History"
};

type StudentDashboardProps = {
  searchParams: Promise<{ error?: string; success?: string; editProfile?: string; view?: string }>;
};

export default async function StudentDashboardPage({ searchParams }: StudentDashboardProps) {
  const params = await searchParams;
  const requestedView = params.view as StudentDashboardView | undefined;
  const activeView: StudentDashboardView =
    requestedView && requestedView in STUDENT_VIEW_LABELS ? requestedView : "overview";
  const showEditProfile = params.editProfile === "1";
  const user = await requireRole(UserRole.STUDENT);

  if (!user.student) {
    redirect("/register/student");
  }

  const student = await prisma.studentProfile.findUnique({
    where: { id: user.student.id },
    include: {
      skills: {
        include: {
          skill: true
        }
      }
    }
  });

  if (!student) {
    redirect("/register/student");
  }

  const opportunities = await prisma.opportunity.findMany({
    where: { archived: false, orgProfile: { status: "APPROVED" } },
    include: {
      orgProfile: true,
      skills: {
        include: {
          skill: true
        }
      }
    }
  });

  const requests = await prisma.matchRequest.findMany({
    where: {
      studentId: student.id
    },
    include: {
      opportunity: true,
      orgProfile: true,
      studentReview: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  const requestByOpportunity = new Map(requests.map((req) => [req.opportunityId, req]));
  const acceptedByOpportunity = new Map(
    requests.filter((req) => req.status === MatchRequestStatus.ACCEPTED).map((req) => [req.opportunityId, req])
  );

  const ranked = rankOpportunities(student, opportunities);
  const incomingRequests = requests.filter((req) => req.status === MatchRequestStatus.PENDING && req.initiatedBy === RequestInitiator.ORG);
  const outgoingRequests = requests.filter((req) => req.initiatedBy === RequestInitiator.STUDENT);
  const acceptedRequests = requests.filter((req) => req.status === MatchRequestStatus.ACCEPTED);
  // Active matches: accepted but not yet reviewed by org — these are ongoing commitments
  const activeMatches = acceptedRequests.filter((req) => !req.studentReview);
  // Completed logs: any accepted request where hours have been recorded (for service log/records)
  const completedLogs = acceptedRequests.filter((req) => req.completedAt);
  const totalLoggedHours = completedLogs.reduce((sum, req) => sum + (req.hoursCompleted || 0), 0);
  const studentDistanceUnit = normalizeDistanceUnit(student.distanceUnit, "km");
  const studentTimeZone = normalizeUsTimeZone(student.timeZone);
  const distanceDisplayValue = Number(fromKilometers(student.maxDistanceKm, studentDistanceUnit).toFixed(2));
  const selectedSkills = new Set(student.skills.map((entry) => entry.skill.name.toLowerCase()));
  const editProfileHref = activeView === "overview" ? "/dashboard/student?editProfile=1" : `/dashboard/student?view=${activeView}&editProfile=1`;
  const closeProfileHref = activeView === "overview" ? "/dashboard/student" : `/dashboard/student?view=${activeView}`;
  const viewHref = (view: StudentDashboardView) => (view === "overview" ? "/dashboard/student" : `/dashboard/student?view=${view}`);
  const tabBaseClass =
    "rounded-full px-4 py-2 text-sm font-medium transition";

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="space-y-6">
      <section className="rounded-3xl border border-brand-700/20 bg-white/95 p-6 shadow-sm sm:p-8">

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">Student Dashboard</h1>
          <a href={editProfileHref} className="rounded-lg bg-brand-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-500 transition-colors">
            Edit Profile
          </a>
        </div>
        <p className="mt-2 text-sm text-slate-700">Welcome, {student.fullName}. Track requests, contact matches, and monitor completed service hours.</p>
        <div className="mt-4 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
          <p>Email: {user.email}</p>
          <p>School: {student.school || "Not provided"}</p>
          <p>Program: {student.programAffiliation || "Not provided"}</p>
          <p>Parent consent: {student.parentConsent ? "Confirmed" : "Not confirmed"}</p>
        </div>
        {params.error ? <p className="mt-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{params.error}</p> : null}
        {params.success ? <p className="mt-3 rounded-md bg-green-50 p-2 text-sm text-green-700">{params.success}</p> : null}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link href={viewHref("incoming")} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Incoming</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{incomingRequests.length}</p>
        </Link>
        <Link href={viewHref("matches")} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Active Matches</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{activeMatches.length}</p>
        </Link>
        <Link href={viewHref("ranked")} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Ranked Opportunities</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{ranked.length}</p>
        </Link>
        <Link href={viewHref("log")} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Completed</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{completedLogs.length}</p>
        </Link>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <nav className="flex flex-wrap gap-2">
          {(Object.keys(STUDENT_VIEW_LABELS) as StudentDashboardView[]).map((view) => (
            <Link
              key={view}
              href={viewHref(view)}
              className={`${tabBaseClass} ${
                activeView === view ? "bg-brand-700 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {STUDENT_VIEW_LABELS[view]}
            </Link>
          ))}
        </nav>
      </section>

      {showEditProfile ? (
        <section className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-slate-900">Edit Your Profile</h2>
              <a href={closeProfileHref} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors">
                Close
              </a>
            </div>
            <form action="/api/profile/student/update" method="post" className="grid gap-3 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Full Name *
            <input name="fullName" defaultValue={student.fullName} required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            School
            <input name="school" defaultValue={student.school || ""} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            ZIP Code *
            <input name="zipCode" defaultValue={student.zipCode} required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            City
            <input name="city" defaultValue={student.city || ""} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            State
            <input name="state" defaultValue={student.state || ""} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Phone
            <input name="phone" defaultValue={student.phone || ""} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Program Affiliation
            <input name="programAffiliation" defaultValue={student.programAffiliation || ""} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Grade
            <select name="grade" defaultValue={student.grade || ""} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
              <option value="">— not set —</option>
              <option value="8">8th Grade</option>
              <option value="9">9th Grade</option>
              <option value="10">10th Grade</option>
              <option value="11">11th Grade</option>
              <option value="12">12th Grade</option>
              <option value="college">College Student</option>
              <option value="not-in-school">Not in School</option>
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Max Travel Distance
            <input
              name="maxDistance"
              type="number"
              step="0.5"
              min="1"
              defaultValue={distanceDisplayValue}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Distance Unit
            <select name="distanceUnit" defaultValue={studentDistanceUnit} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
              {DISTANCE_UNIT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="md:col-span-2 text-sm font-medium text-slate-700">
            Personal Statement
            <textarea name="personalStatement" rows={3} defaultValue={student.personalStatement || ""} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="md:col-span-2 text-sm font-medium text-slate-700">
            Letter of Recommendation URL
            <input name="letterOfRecUrl" type="url" defaultValue={student.letterOfRecUrl || ""} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="md:col-span-2 text-sm font-medium text-slate-700">
            Availability / Schedule *
            <textarea name="availability" rows={2} defaultValue={student.availability} required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="md:col-span-2 text-sm font-medium text-slate-700">
            Availability Time Zone (US)
            <select name="availabilityTimeZone" defaultValue={studentTimeZone} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
              {US_TIMEZONE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="md:col-span-2 rounded-lg border border-slate-200 p-4">
            <legend className="px-1 text-sm font-semibold text-slate-900">Skills You Can Offer *</legend>
            <div className="mt-2 grid gap-2 md:grid-cols-3">
              {SKILL_OPTIONS.map((skill) => (
                <label key={skill} className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" name="skills" value={skill} defaultChecked={selectedSkills.has(skill)} />
                  <span className="capitalize">{skill}</span>
                </label>
              ))}
            </div>
            <label className="mt-3 block text-sm font-medium text-slate-700">
              Add custom skills (optional, comma-separated)
              <input name="skillsCustom" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
            </label>
          </fieldset>

          <label className="md:col-span-2 flex items-center gap-2 rounded-md bg-slate-50 p-3 text-sm text-slate-700">
            <input name="parentConsent" type="checkbox" defaultChecked={student.parentConsent} />
            Parent/guardian consent has been obtained if required.
          </label>

          <button type="submit" className="md:col-span-2 w-fit rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500">
            Save Profile Changes
          </button>
            </form>
          </div>
        </section>
      ) : null}

      {activeView === "incoming" ? (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Incoming Match Requests</h2>
        <div className="mt-4 grid gap-3">
          {incomingRequests.length === 0 ? (
            <p className="text-sm text-slate-700">No incoming requests.</p>
          ) : (
            incomingRequests.map((req) => (
              <article key={req.id} className="rounded-lg border border-slate-200 p-4">
                <p className="text-sm text-slate-800">
                  <span className="font-medium">{req.orgProfile.organization}</span> requested to match for <span className="font-medium">{req.opportunity?.title ?? req.opportunityTitle ?? "Opportunity"}</span>
                </p>
                <p className="mt-1 text-sm text-slate-700">Message: {req.message || "No message provided"}</p>
                <div className="mt-3 flex gap-2">
                  <form action="/api/match-requests/respond" method="post">
                    <input type="hidden" name="requestId" value={req.id} />
                    <input type="hidden" name="action" value="accept" />
                    <input type="hidden" name="redirectTo" value="/dashboard/student?view=incoming" />
                    <button type="submit" className="rounded-md bg-brand-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-500">
                      Accept
                    </button>
                  </form>
                  <form action="/api/match-requests/respond" method="post">
                    <input type="hidden" name="requestId" value={req.id} />
                    <input type="hidden" name="action" value="reject" />
                    <input type="hidden" name="redirectTo" value="/dashboard/student?view=incoming" />
                    <button type="submit" className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-200">
                      Reject
                    </button>
                  </form>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
      ) : null}

      {activeView === "matches" ? (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Active Matches</h2>
        <p className="mt-1 text-sm text-slate-500">Your current volunteer commitments. Once the organization logs your hours and submits a review, the match will appear in your Service Records.</p>
        {activeMatches.length > 0 ? (
          <p className="mt-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
            You&apos;re matched! Reach out directly to the organization using the contact details on each card below.
          </p>
        ) : null}
        <div className="mt-4 grid gap-3">
          {activeMatches.length === 0 ? (
            <p className="text-sm text-slate-700">No active matches right now. Completed matches appear in your Service Records.</p>
          ) : (
            activeMatches.map((req) => (
              <article key={req.id} className="rounded-lg border border-slate-200 p-4">
                <p className="font-medium text-slate-900">{req.opportunity?.title ?? req.opportunityTitle ?? "Opportunity"}</p>
                <p className="mt-1 text-sm text-slate-700">Organization: {req.orgProfile.organization}</p>
                {req.opportunity ? (
                  <>
                    <p className="mt-1 text-sm text-slate-700">Time needed: {req.opportunity.availability}</p>
                    <p className="mt-1 text-sm text-slate-700">Commitment: {req.opportunity.requiredCommitment}</p>
                    <p className="mt-1 text-sm text-slate-700">
                      Contact: <a href={`mailto:${req.opportunity.contactEmail}`} className="text-brand-700 underline">{req.opportunity.contactEmail}</a>
                      {req.opportunity.contactPhone ? ` | ${req.opportunity.contactPhone}` : ""}
                    </p>
                  </>
                ) : null}
                <p className="mt-2 text-xs text-slate-500">Match request ID: {req.id}</p>
              </article>
            ))
          )}
        </div>
      </section>
      ) : null}

      {activeView === "log" ? (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Service Log</h2>
            <p className="mt-1 text-sm text-slate-500 max-w-lg">An all-time running log of every service session you&apos;ve completed through ServeConnect — hours, dates, and notes.</p>
            <p className="mt-2 text-sm text-slate-700">Total verified hours: <span className="font-semibold text-slate-900">{totalLoggedHours.toFixed(2)}</span></p>
          </div>
          {completedLogs.length > 0 ? (
            <Link
              href="/service-summary"
              target="_blank"
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Summary
            </Link>
          ) : null}
        </div>
        <div className="mt-4 grid gap-3">
          {completedLogs.length === 0 ? (
            <p className="text-sm text-slate-700">No completed service entries yet.</p>
          ) : (
            completedLogs.map((req) => (
              <article key={req.id} className="rounded-lg border border-slate-200 p-4">
                <p className="font-medium text-slate-900">{req.opportunity?.title ?? req.opportunityTitle ?? "Service Opportunity"}</p>
                <p className="mt-1 text-sm text-slate-700">Organization: {req.orgProfile?.organization ?? "Organization"}</p>
                <p className="mt-1 text-sm text-slate-700">Hours logged: {req.hoursCompleted ?? 0}</p>
                <p className="mt-1 text-sm text-slate-500">Date of Service: {req.serviceDate ? new Date(req.serviceDate).toLocaleDateString() : "—"}</p>
                <p className="mt-0.5 text-sm text-slate-500">Confirmed: {req.completedAt ? new Date(req.completedAt).toLocaleDateString() : "N/A"}</p>
                {req.completionNotes ? <p className="mt-1 text-sm text-slate-700">Notes: {req.completionNotes}</p> : null}
              </article>
            ))
          )}
        </div>
      </section>
      ) : null}

      {activeView === "records" ? (
      <section className="rounded-2xl border-2 border-brand-700/20 bg-white shadow-sm overflow-hidden">
        {/* Distinctive header — clearly different from "Your Matches" */}
        <div className="bg-gradient-to-r from-brand-700 to-brand-500 px-6 py-5">
          <h2 className="text-xl font-bold text-white">Service Records</h2>
          <p className="mt-1 text-sm text-brand-50">
            Printable confirmation records for each completed service — use these to show your supervisor or NHS chapter advisor.
            Each record includes a public verification link your advisor can use to confirm authenticity.
          </p>
          <p className="mt-2 text-xs text-white/70">
            Supervisor ratings (visible only to you) are also shown here.
          </p>
        </div>
        <div className="p-6">
          {completedLogs.length === 0 ? (
            <div className="text-center py-10">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-700">No service records yet</p>
              <p className="text-xs text-slate-500 mt-1">Completed services will appear here once an organization confirms them.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {completedLogs.map((req) => {
                const review = req.studentReview;
                return (
                  <article key={req.id} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="font-semibold text-slate-900">{req.opportunity?.title ?? req.opportunityTitle ?? "Service Opportunity"}</p>
                        <p className="text-sm text-slate-600">{req.orgProfile?.organization ?? "Organization"}</p>
                        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500">
                          <span>{req.hoursCompleted ?? "—"} hrs</span>
                          <span>Service: {req.serviceDate ? new Date(req.serviceDate).toLocaleDateString() : "—"}</span>
                          <span>Confirmed: {req.completedAt ? new Date(req.completedAt).toLocaleDateString() : "—"}</span>
                        </div>
                      </div>
                      <Link
                        href={`/service-form/${req.id}`}
                        target="_blank"
                        className="flex-shrink-0 flex items-center gap-1.5 rounded-lg bg-brand-700 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-500 transition-colors"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        View Service Record
                      </Link>
                    </div>

                    {/* Org review / rating */}
                    {review ? (
                      <div className="mt-4 rounded-lg border border-brand-700/15 bg-white p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Supervisor Rating</span>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`h-4 w-4 ${star <= review.rating ? "text-amber-400" : "text-slate-200"}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-sm font-semibold text-slate-700">{review.rating}/5</span>
                        </div>
                        {review.feedback ? (
                          <p className="text-sm text-slate-700 italic leading-relaxed">&ldquo;{review.feedback}&rdquo;</p>
                        ) : (
                          <p className="text-xs text-slate-400">No written feedback provided.</p>
                        )}
                        <p className="mt-2 text-xs text-slate-400">— {req.orgProfile.organization} · {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ""}</p>
                      </div>
                    ) : (
                      <div className="mt-3 rounded-lg border border-slate-100 bg-white px-4 py-3">
                        <p className="text-xs text-slate-400 italic">No supervisor rating yet for this service.</p>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-3">
          <p className="text-xs text-slate-500">
            Ratings are submitted privately by supervising organizations. Only you can see your ratings — they are not shared publicly.
          </p>
        </div>
      </section>
      ) : null}

      {activeView === "ranked" ? (
      <section className="grid gap-4">
        <h2 className="text-xl font-semibold text-slate-900">Ranked Opportunities</h2>
        {ranked.length === 0 ? <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm">No opportunities available right now.</p> : null}
        {ranked.map((match) => {
          const existingRequest = requestByOpportunity.get(match.opportunityId);
          const acceptedRequest = acceptedByOpportunity.get(match.opportunityId);
          const canSend = !existingRequest || existingRequest.status === MatchRequestStatus.REJECTED || existingRequest.status === MatchRequestStatus.CANCELLED;
          const gradeOk = meetsGradeRequirement(student.grade, match.minGrade);

          return (
            <article key={match.opportunityId} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Rank #{match.rank}</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">{match.title}</h2>
              <p className="mt-1 text-sm text-slate-700">{match.organization}</p>
              <a href={match.websiteUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm text-brand-700 underline hover:text-brand-500">
                {match.websiteUrl}
              </a>
              <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Do your research before sending a match request — visit this organization&apos;s website and make sure you&apos;re comfortable with who they are.
              </p>
              <p className="mt-2 text-sm text-slate-700">Time needed: {match.availability} ({formatTimeZoneLabel(match.timeZone)})</p>
              <p className="mt-2 text-sm text-slate-700">Commitment: {match.requiredCommitment}</p>
              <p className="mt-2 text-sm text-slate-700">
                Distance: {fromKilometers(match.distanceKm, studentDistanceUnit).toFixed(1)} {studentDistanceUnit}
              </p>
              <p className="mt-2 text-sm text-slate-700">Matched skills: {match.skillsMatched.join(", ") || "None"}</p>
              <p className="mt-2 text-sm text-slate-700">Missing required skills: {match.skillsMissing.join(", ") || "None"}</p>
              {match.minGrade ? (
                <p className="mt-2 text-sm text-slate-700">
                  Grade requirement:{" "}
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${gradeOk ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {gradeLabel(match.minGrade)}+
                  </span>
                </p>
              ) : null}

              {acceptedRequest ? (
                <p className="mt-3 rounded-md bg-green-50 p-2 text-sm text-green-700">
                  Match accepted — reach out directly:{" "}
                  <a href={`mailto:${match.contactEmail}`} className="underline font-medium">{match.contactEmail}</a>
                  {match.contactPhone ? ` | ${match.contactPhone}` : ""}
                </p>
              ) : null}

              {!acceptedRequest && existingRequest ? (
                <p className="mt-3 text-sm text-slate-700">Request status: {existingRequest.status}</p>
              ) : null}

              {!gradeOk ? (
                <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  This opportunity requires {gradeLabel(match.minGrade ?? "")} or above. You cannot send a match request because your grade ({student.grade ? gradeLabel(student.grade) : "not set"}) does not meet this requirement.
                </p>
              ) : null}

              {canSend && gradeOk ? (
                <form action="/api/match-requests/create" method="post" className="mt-3 flex flex-col gap-2">
                  <input type="hidden" name="opportunityId" value={match.opportunityId} />
                  <input type="hidden" name="redirectTo" value="/dashboard/student?view=ranked" />
                  <input
                    name="message"
                    placeholder="Optional message to organization"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-slate-500">By sending a request, you confirm you have reviewed this organization&apos;s website and are comfortable proceeding.</p>
                  <button type="submit" className="w-fit rounded-md bg-brand-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-500">
                    Send Match Request
                  </button>
                </form>
              ) : null}
            </article>
          );
        })}
      </section>
      ) : null}

      {activeView === "history" ? (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Your Request History</h2>
        <div className="mt-4 grid gap-2 text-sm text-slate-700">
          {outgoingRequests.length === 0 ? (
            <p>No outgoing requests yet.</p>
          ) : (
            outgoingRequests.map((req) => (
              <p key={req.id}>
                #{req.id} - {req.opportunity?.title ?? req.opportunityTitle ?? "Opportunity"} - {req.status}
              </p>
            ))
          )}
        </div>
      </section>
      ) : null}

      {activeView === "overview" ? (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Overview</h2>
        <p className="mt-2 text-sm text-slate-700">
          Use the tabs above to switch between incoming requests, active matches, your service log, ranked opportunities, and request history.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Link href={viewHref("incoming")} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 hover:bg-slate-100">
            Review incoming match requests and respond quickly.
          </Link>
          <Link href={viewHref("ranked")} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 hover:bg-slate-100">
            Explore ranked opportunities and send match requests.
          </Link>
          <Link href={viewHref("matches")} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 hover:bg-slate-100">
            View accepted matches and direct organization contact info.
          </Link>
          <Link href={viewHref("log")} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 hover:bg-slate-100">
            Review completed tasks and your total verified service hours.
          </Link>
        </div>
      </section>
      ) : null}
      </div>
    </main>
  );
}

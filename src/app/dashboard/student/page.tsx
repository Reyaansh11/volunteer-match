import { MatchRequestStatus, RequestInitiator, UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { SKILL_OPTIONS } from "@/lib/form-options";
import { rankOpportunities } from "@/lib/matching";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guards";

type StudentDashboardProps = {
  searchParams: Promise<{ error?: string; success?: string; editProfile?: string }>;
};

export default async function StudentDashboardPage({ searchParams }: StudentDashboardProps) {
  const params = await searchParams;
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
      serviceHourForm: true
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
  const selectedSkills = new Set(student.skills.map((entry) => entry.skill.name.toLowerCase()));

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-12">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">Student Dashboard</h1>
          <a href="/dashboard/student?editProfile=1" className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700">
            Edit Profile
          </a>
        </div>
        <p className="mt-2 text-sm text-slate-700">Welcome, {student.fullName}. Send match requests and manage responses here.</p>
        <div className="mt-4 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
          <p>Email: {user.email}</p>
          <p>School: {student.school || "Not provided"}</p>
          <p>Program: {student.programAffiliation || "Not provided"}</p>
          <p>Parent consent: {student.parentConsent ? "Confirmed" : "Not confirmed"}</p>
        </div>
        {params.error ? <p className="mt-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{params.error}</p> : null}
        {params.success ? <p className="mt-3 rounded-md bg-green-50 p-2 text-sm text-green-700">{params.success}</p> : null}
      </section>

      {showEditProfile ? (
        <section className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-slate-900">Edit Your Profile</h2>
              <a href="/dashboard/student" className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-200">
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
            Max Travel Distance (km)
            <input
              name="maxDistanceKm"
              type="number"
              step="1"
              min="1"
              defaultValue={student.maxDistanceKm}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            />
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

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Incoming Match Requests</h2>
        <div className="mt-4 grid gap-3">
          {incomingRequests.length === 0 ? (
            <p className="text-sm text-slate-700">No incoming requests.</p>
          ) : (
            incomingRequests.map((req) => (
              <article key={req.id} className="rounded-lg border border-slate-200 p-4">
                <p className="text-sm text-slate-800">
                  <span className="font-medium">{req.orgProfile.organization}</span> requested to match for <span className="font-medium">{req.opportunity.title}</span>
                </p>
                <p className="mt-1 text-sm text-slate-700">Message: {req.message || "No message provided"}</p>
                <div className="mt-3 flex gap-2">
                  <form action="/api/match-requests/respond" method="post">
                    <input type="hidden" name="requestId" value={req.id} />
                    <input type="hidden" name="action" value="accept" />
                    <input type="hidden" name="redirectTo" value="/dashboard/student" />
                    <button type="submit" className="rounded-md bg-brand-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-500">
                      Accept
                    </button>
                  </form>
                  <form action="/api/match-requests/respond" method="post">
                    <input type="hidden" name="requestId" value={req.id} />
                    <input type="hidden" name="action" value="reject" />
                    <input type="hidden" name="redirectTo" value="/dashboard/student" />
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

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Your Matches</h2>
        <div className="mt-4 grid gap-3">
          {acceptedRequests.length === 0 ? (
            <p className="text-sm text-slate-700">No accepted matches yet.</p>
          ) : (
            acceptedRequests.map((req) => (
              <article key={req.id} className="rounded-lg border border-slate-200 p-4">
                <p className="font-medium text-slate-900">{req.opportunity.title}</p>
                <p className="mt-1 text-sm text-slate-700">Organization: {req.orgProfile.organization}</p>
                <p className="mt-1 text-sm text-slate-700">Time needed: {req.opportunity.availability}</p>
                <p className="mt-1 text-sm text-slate-700">Commitment: {req.opportunity.requiredCommitment}</p>
                <p className="mt-1 text-sm text-slate-700">
                  Contact: {req.opportunity.contactEmail}
                  {req.opportunity.contactPhone ? ` | ${req.opportunity.contactPhone}` : ""}
                </p>
                <p className="mt-2 text-xs text-slate-500">Match request ID: {req.id}</p>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Filled Service Hour Forms</h2>
        <div className="mt-4 grid gap-3">
          {acceptedRequests.filter((req) => req.serviceHourForm).length === 0 ? (
            <p className="text-sm text-slate-700">No filled service hour forms yet.</p>
          ) : (
            acceptedRequests
              .filter((req) => req.serviceHourForm)
              .map((req) => (
                <article key={req.id} className="rounded-lg border border-slate-200 p-4">
                  <p className="font-medium text-slate-900">{req.opportunity.title}</p>
                  <p className="mt-1 text-sm text-slate-700">Hours: {req.serviceHourForm?.hoursCompleted ?? "N/A"}</p>
                  <p className="mt-1 text-sm text-slate-700">
                    Date: {req.serviceHourForm?.serviceDate ? new Date(req.serviceHourForm.serviceDate).toLocaleDateString() : "N/A"}
                  </p>
                  <a
                    href={`/api/service-hours/download/${req.serviceHourForm?.id}`}
                    className="mt-2 inline-block rounded-md bg-brand-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-500"
                  >
                    Download NHS DOCX
                  </a>
                  <pre className="mt-3 whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-xs text-slate-700">{req.serviceHourForm?.generatedText}</pre>
                </article>
              ))
          )}
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="text-xl font-semibold text-slate-900">Ranked Opportunities</h2>
        {ranked.map((match) => {
          const existingRequest = requestByOpportunity.get(match.opportunityId);
          const acceptedRequest = acceptedByOpportunity.get(match.opportunityId);
          const canSend = !existingRequest || existingRequest.status === MatchRequestStatus.REJECTED || existingRequest.status === MatchRequestStatus.CANCELLED;

          return (
            <article key={match.opportunityId} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Rank #{match.rank}</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">{match.title}</h2>
              <p className="mt-1 text-sm text-slate-700">{match.organization}</p>
              <p className="mt-2 text-sm text-slate-700">Time needed: {match.availability}</p>
              <p className="mt-2 text-sm text-slate-700">Commitment: {match.requiredCommitment}</p>
              <p className="mt-2 text-sm text-slate-700">Distance: {match.distanceKm} km</p>
              <p className="mt-2 text-sm text-slate-700">Matched skills: {match.skillsMatched.join(", ") || "None"}</p>
              <p className="mt-2 text-sm text-slate-700">Missing required skills: {match.skillsMissing.join(", ") || "None"}</p>

              {acceptedRequest ? (
                <p className="mt-3 rounded-md bg-green-50 p-2 text-sm text-green-700">
                  Match accepted. Contact: {match.contactEmail}
                  {match.contactPhone ? ` | ${match.contactPhone}` : ""}
                </p>
              ) : null}

              {!acceptedRequest && existingRequest ? (
                <p className="mt-3 text-sm text-slate-700">Request status: {existingRequest.status}</p>
              ) : null}

              {canSend ? (
                <form action="/api/match-requests/create" method="post" className="mt-3 flex flex-col gap-2">
                  <input type="hidden" name="opportunityId" value={match.opportunityId} />
                  <input type="hidden" name="redirectTo" value="/dashboard/student" />
                  <input
                    name="message"
                    placeholder="Optional message to organization"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                  <button type="submit" className="w-fit rounded-md bg-brand-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-500">
                    Send Match Request
                  </button>
                </form>
              ) : null}
            </article>
          );
        })}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Your Request History</h2>
        <div className="mt-4 grid gap-2 text-sm text-slate-700">
          {outgoingRequests.length === 0 ? (
            <p>No outgoing requests yet.</p>
          ) : (
            outgoingRequests.map((req) => (
              <p key={req.id}>
                #{req.id} - {req.opportunity.title} - {req.status}
              </p>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

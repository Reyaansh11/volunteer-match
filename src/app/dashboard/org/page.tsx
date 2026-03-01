import Link from "next/link";
import { MatchRequestStatus, RequestInitiator, UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { AvailabilityPicker } from "@/components/availability-picker";
import { COMMITMENT_OPTIONS, SKILL_OPTIONS } from "@/lib/form-options";
import { rankStudentsForOpportunity } from "@/lib/matching";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guards";

type OrgDashboardProps = {
  searchParams: Promise<{ opportunityId?: string; error?: string; success?: string }>;
};

export default async function OrgDashboardPage({ searchParams }: OrgDashboardProps) {
  const user = await requireRole(UserRole.ORG);
  const params = await searchParams;

  if (!user.org) {
    redirect("/register/org");
  }

  const org = await prisma.orgProfile.findUnique({
    where: { id: user.org.id },
    include: {
      opportunities: {
        include: {
          skills: {
            include: {
              skill: true
            }
          },
          orgProfile: true,
          matchRequests: {
            include: {
              serviceHourForm: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      }
    }
  });

  if (!org) {
    redirect("/register/org");
  }

  const selectedOpportunityId = Number(params.opportunityId || org.opportunities[0]?.id || 0);
  const selectedOpportunity = org.opportunities.find((opp) => opp.id === selectedOpportunityId) || org.opportunities[0] || null;

  const students = await prisma.studentProfile.findMany({
    include: {
      user: {
        select: {
          email: true
        }
      },
      reviewsReceived: {
        select: {
          rating: true
        }
      },
      skills: {
        include: {
          skill: true
        }
      }
    }
  });

  const rankedStudents = selectedOpportunity ? rankStudentsForOpportunity(selectedOpportunity, students, 30) : [];

  const requests = await prisma.matchRequest.findMany({
    where: {
      orgProfileId: org.id
    },
    include: {
      student: {
        include: {
          user: true
        }
      },
      opportunity: true,
      serviceHourForm: true,
      studentReview: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  const incomingRequests = requests.filter((req) => req.status === MatchRequestStatus.PENDING && req.initiatedBy === RequestInitiator.STUDENT);
  const acceptedRequests = requests.filter((req) => req.status === MatchRequestStatus.ACCEPTED);
  const requestKeyToStatus = new Map(requests.map((req) => [`${req.opportunityId}:${req.studentId}`, req.status]));

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-12">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Program Dashboard</h1>
        <p className="mt-2 text-sm text-slate-700">{org.organization}</p>
        <p className="mt-2 text-sm text-slate-700">Contact: {org.contactName} | {org.contactEmail}{org.contactPhone ? ` | ${org.contactPhone}` : ""}</p>
        <p className="mt-2 text-sm text-slate-700">{org.description || "Add organization details in your profile as needed."}</p>
        {params.error ? <p className="mt-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{params.error}</p> : null}
        {params.success ? <p className="mt-3 rounded-md bg-green-50 p-2 text-sm text-green-700">{params.success}</p> : null}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Edit Program Profile</h2>
        <form action="/api/profile/org/update" method="post" className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Organization Name *
            <input name="organization" defaultValue={org.organization} required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Category
            <input name="category" defaultValue={org.category} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            ZIP Code *
            <input name="zipCode" defaultValue={org.zipCode} required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            City
            <input name="city" defaultValue={org.city || ""} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            State
            <input name="state" defaultValue={org.state || ""} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Contact Name *
            <input name="contactName" defaultValue={org.contactName} required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Contact Email *
            <input name="contactEmail" type="email" defaultValue={org.contactEmail} required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Contact Phone
            <input name="contactPhone" defaultValue={org.contactPhone || ""} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Website URL
            <input name="websiteUrl" type="url" defaultValue={org.websiteUrl || ""} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="md:col-span-2 text-sm font-medium text-slate-700">
            About Your Program
            <textarea name="description" rows={3} defaultValue={org.description || ""} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="md:col-span-2 text-sm font-medium text-slate-700">
            Volunteer Notes
            <textarea name="volunteerNotes" rows={3} defaultValue={org.volunteerNotes || ""} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <button type="submit" className="md:col-span-2 w-fit rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500">
            Save Program Changes
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Incoming Match Requests</h2>
        <div className="mt-4 grid gap-3">
          {incomingRequests.length === 0 ? (
            <p className="text-sm text-slate-700">No incoming requests.</p>
          ) : (
            incomingRequests.map((req) => (
              <article key={req.id} className="rounded-lg border border-slate-200 p-4">
                <p className="text-sm text-slate-800">
                  <span className="font-medium">{req.student.fullName}</span> requested <span className="font-medium">{req.opportunity.title}</span>
                </p>
                <p className="mt-1 text-sm text-slate-700">Message: {req.message || "No message provided"}</p>
                <div className="mt-3 flex gap-2">
                  <form action="/api/match-requests/respond" method="post">
                    <input type="hidden" name="requestId" value={req.id} />
                    <input type="hidden" name="action" value="accept" />
                    <input type="hidden" name="redirectTo" value={`/dashboard/org?opportunityId=${selectedOpportunity?.id || ""}`} />
                    <button type="submit" className="rounded-md bg-brand-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-500">
                      Accept
                    </button>
                  </form>
                  <form action="/api/match-requests/respond" method="post">
                    <input type="hidden" name="requestId" value={req.id} />
                    <input type="hidden" name="action" value="reject" />
                    <input type="hidden" name="redirectTo" value={`/dashboard/org?opportunityId=${selectedOpportunity?.id || ""}`} />
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
        <h2 className="text-xl font-semibold text-slate-900">Post New Opportunity</h2>
        <form action="/api/org/opportunities/create" method="post" className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Title *
            <input name="title" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Required Commitment *
            <select name="requiredCommitmentPreset" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
              <option value="">Select commitment</option>
              {COMMITMENT_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
              <option value="custom">Custom</option>
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Custom Commitment (optional)
            <input name="requiredCommitmentCustom" placeholder="e.g., 90 minutes/week" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="md:col-span-2 text-sm font-medium text-slate-700">
            Description *
            <textarea name="description" required rows={3} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>

          <AvailabilityPicker
            prefix="availability"
            title="When You Need Volunteers"
            description="Choose the days this opportunity needs support, then set start and end times for each selected day."
            required
          />
          <label className="md:col-span-2 mt-[-0.25rem] flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="oneDayOpportunity" />
            This is a one-day opportunity (availability fit will not affect ranking).
          </label>

          <label className="text-sm font-medium text-slate-700">
            Radius (km)
            <input name="radiusKm" type="number" defaultValue={20} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Contact Email *
            <input name="contactEmail" defaultValue={org.contactEmail} required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Contact Phone
            <input name="contactPhone" defaultValue={org.contactPhone || ""} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <fieldset className="md:col-span-2 rounded-lg border border-slate-200 p-4">
            <legend className="px-1 text-sm font-semibold text-slate-900">Required Skills</legend>
            <div className="mt-2 grid gap-2 md:grid-cols-3">
              {SKILL_OPTIONS.map((skill) => (
                <label key={skill} className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" name="skills" value={skill} />
                  <span className="capitalize">{skill}</span>
                </label>
              ))}
            </div>
            <label className="mt-3 block text-sm font-medium text-slate-700">
              Add custom skills (optional, comma-separated)
              <input name="skillsCustom" placeholder="mobility support, sing-alongs" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
            </label>
          </fieldset>
          <button type="submit" className="md:col-span-2 rounded-md bg-brand-700 px-4 py-2 font-medium text-white hover:bg-brand-500">
            Post Opportunity
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Your Opportunities</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {org.opportunities.length === 0 ? (
            <p className="text-sm text-slate-700">No opportunities yet.</p>
          ) : (
            org.opportunities.map((opp) => (
              <Link
                key={opp.id}
                href={`/dashboard/org?opportunityId=${opp.id}`}
                className={`rounded-md px-3 py-1.5 text-sm ${selectedOpportunity?.id === opp.id ? "bg-brand-700 text-white" : "bg-slate-100 text-slate-800 hover:bg-slate-200"}`}
              >
                {opp.title}
              </Link>
            ))
          )}
        </div>
      </section>

      {selectedOpportunity && (
        <section className="grid gap-4">
          <h2 className="text-xl font-semibold text-slate-900">Ranked Students for: {selectedOpportunity.title}</h2>
          {rankedStudents.map((student) => {
            const status = requestKeyToStatus.get(`${selectedOpportunity.id}:${student.studentId}`);
            const isAccepted = status === MatchRequestStatus.ACCEPTED;
            const canRequest = !status || status === MatchRequestStatus.REJECTED || status === MatchRequestStatus.CANCELLED;

            return (
              <article key={student.studentId} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Rank #{student.rank}</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">{student.fullName}</h3>
                {isAccepted ? <p className="mt-2 text-sm text-slate-700">Email: {student.email}</p> : <p className="mt-2 text-sm text-slate-700">Email is revealed after accepted match request.</p>}
                <p className="mt-1 text-sm text-slate-700">School: {student.school || "Not provided"}</p>
                <p className="mt-1 text-sm text-slate-700">Program: {student.programAffiliation || "Not provided"}</p>
                <p className="mt-1 text-sm text-slate-700">Personal statement: {student.personalStatement || "Not provided"}</p>
                <p className="mt-1 text-sm text-slate-700">
                  Letter of recommendation:{" "}
                  {student.letterOfRecUrl ? (
                    <a href={student.letterOfRecUrl} target="_blank" rel="noreferrer" className="text-brand-700 underline">
                      View letter
                    </a>
                  ) : (
                    "Not provided"
                  )}
                </p>
                <p className="mt-1 text-sm text-slate-700">Distance: {student.distanceKm} km</p>
                <p className="mt-1 text-sm text-slate-700">Availability: {student.availability}</p>
                <p className="mt-1 text-sm text-slate-700">Matched skills: {student.skillsMatched.join(", ") || "None"}</p>
                <p className="mt-1 text-sm text-slate-700">
                  Average review: {student.averageRating ? `${student.averageRating}/5` : "No reviews yet"} ({student.reviewCount} total)
                </p>

                {status ? <p className="mt-2 text-sm text-slate-700">Request status: {status}</p> : null}

                {canRequest ? (
                  <form action="/api/match-requests/create" method="post" className="mt-3 flex flex-col gap-2">
                    <input type="hidden" name="opportunityId" value={selectedOpportunity.id} />
                    <input type="hidden" name="studentId" value={student.studentId} />
                    <input type="hidden" name="redirectTo" value={`/dashboard/org?opportunityId=${selectedOpportunity.id}`} />
                    <input
                      name="message"
                      placeholder="Optional message to student"
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
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Accepted Matches and Service Forms</h2>
        <div className="mt-4 grid gap-4">
          {acceptedRequests.length === 0 ? (
            <p className="text-sm text-slate-700">No accepted matches yet.</p>
          ) : (
            acceptedRequests.map((req) => (
              <article key={req.id} className="rounded-lg border border-slate-200 p-4">
                <p className="font-medium text-slate-900">{req.opportunity.title}</p>
                <p className="mt-1 text-sm text-slate-700">Student: {req.student.fullName} ({req.student.user.email})</p>
                <p className="mt-1 text-sm text-slate-700">Request message: {req.message || "No message"}</p>

                {req.studentReview ? (
                  <p className="mt-2 text-sm text-slate-700">
                    Your review: {req.studentReview.rating}/5
                    {req.studentReview.feedback ? ` - ${req.studentReview.feedback}` : ""}
                  </p>
                ) : (
                  <form action="/api/reviews/create" method="post" className="mt-3 grid gap-2 rounded-md border border-slate-200 p-3">
                    <input type="hidden" name="matchRequestId" value={req.id} />
                    <input type="hidden" name="redirectTo" value={`/dashboard/org?opportunityId=${selectedOpportunity?.id || ""}`} />
                    <label className="text-sm font-medium text-slate-700">
                      Review this student (1-5) *
                      <select name="rating" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
                        <option value="">Select rating</option>
                        <option value="5">5 - Excellent</option>
                        <option value="4">4 - Strong</option>
                        <option value="3">3 - Good</option>
                        <option value="2">2 - Fair</option>
                        <option value="1">1 - Needs improvement</option>
                      </select>
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      Optional feedback
                      <textarea name="feedback" rows={2} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
                    </label>
                    <button type="submit" className="w-fit rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700">
                      Save Review
                    </button>
                  </form>
                )}

                {req.serviceHourForm ? (
                  <>
                    <p className="mt-2 text-sm text-green-700">Service hour form filled.</p>
                    <a
                      href={`/api/service-hours/download/${req.serviceHourForm.id}`}
                      className="mt-2 inline-block rounded-md bg-brand-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-500"
                    >
                      Download NHS DOCX
                    </a>
                    <pre className="mt-2 whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-xs text-slate-700">{req.serviceHourForm.generatedText}</pre>
                  </>
                ) : (
                  <form action="/api/service-hours/fill" method="post" className="mt-3 grid gap-2 md:grid-cols-3">
                    <input type="hidden" name="matchRequestId" value={req.id} />
                    <input type="hidden" name="redirectTo" value={`/dashboard/org?opportunityId=${selectedOpportunity?.id || ""}`} />
                    <label className="text-sm font-medium text-slate-700">
                      Hours Completed
                      <input name="hoursCompleted" type="number" step="0.25" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      Service Date
                      <input name="serviceDate" type="date" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
                    </label>
                    <label className="text-sm font-medium text-slate-700 md:col-span-3">
                      Activity Notes
                      <textarea name="activityNotes" rows={2} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
                    </label>
                    <button type="submit" className="w-fit rounded-md bg-brand-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-500">
                      Fill Service Hour Form
                    </button>
                  </form>
                )}
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

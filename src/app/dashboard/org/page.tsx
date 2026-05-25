import Link from "next/link";
import { MatchRequestStatus, RequestInitiator, UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { AvailabilityPicker } from "@/components/availability-picker";
import { OrgOnboardingGuide } from "@/components/org-onboarding-guide";
import {
  COMMITMENT_OPTIONS,
  DEFAULT_DISTANCE_UNIT,
  DISTANCE_UNIT_OPTIONS,
  formatTimeZoneLabel,
  fromKilometers,
  normalizeDistanceUnit,
  SKILL_OPTIONS,
  SUPERVISOR_TITLE_OPTIONS
} from "@/lib/form-options";
import { rankStudentsForOpportunity } from "@/lib/matching";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guards";

export const dynamic = "force-dynamic";

type OrgDashboardView = "overview" | "incoming" | "post" | "opportunities" | "ranked" | "active-volunteers" | "match-history";

const ORG_VIEW_LABELS: Record<OrgDashboardView, string> = {
  overview: "Overview",
  incoming: "Incoming Requests",
  post: "Post Opportunity",
  opportunities: "Your Opportunities",
  ranked: "Ranked Students",
  "active-volunteers": "Active Volunteers",
  "match-history": "Match History"
};

type OrgDashboardProps = {
  searchParams: Promise<{ opportunityId?: string; error?: string; success?: string; editProfile?: string; onboarding?: string; view?: string }>;
};

export default async function OrgDashboardPage({ searchParams }: OrgDashboardProps) {
  const user = await requireRole(UserRole.ORG);
  const params = await searchParams;
  const requestedView = params.view as OrgDashboardView | undefined;
  const activeView: OrgDashboardView = requestedView && requestedView in ORG_VIEW_LABELS ? requestedView : "overview";
  const showEditProfile = params.editProfile === "1";
  const showOnboarding = params.onboarding === "1";

  if (!user.org) {
    redirect("/register/org");
  }

  const org = await prisma.orgProfile.findUnique({
    where: { id: user.org.id },
    include: {
      opportunities: {
        where: {
          archived: false
        },
        include: {
          skills: {
            include: {
              skill: true
            }
          },
          orgProfile: true,
          matchRequests: {
            include: {
              studentReview: true
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
  const selectedRadiusUnit = normalizeDistanceUnit(selectedOpportunity?.radiusUnit, "km");

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
      studentReview: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  const incomingRequests = requests.filter((req) => req.status === MatchRequestStatus.PENDING && req.initiatedBy === RequestInitiator.STUDENT);
  const acceptedRequests = requests.filter((req) => req.status === MatchRequestStatus.ACCEPTED);
  // Active volunteers: accepted matches still needing log + review (either one missing)
  const activeVolunteers = acceptedRequests.filter((req) => !(req.studentReview && req.completedAt));
  // Match history: fully processed — both hours logged AND review submitted
  const matchHistory = acceptedRequests.filter((req) => !!(req.studentReview && req.completedAt));
  const requestKeyToStatus = new Map(requests.map((req) => [`${req.opportunityId}:${req.studentId}`, req.status]));

  const buildOrgHref = (
    view: OrgDashboardView,
    options?: { opportunityId?: number | null; editProfile?: boolean; onboarding?: boolean }
  ) => {
    const search = new URLSearchParams();
    const opportunityId = options?.opportunityId ?? selectedOpportunity?.id ?? null;
    if (view !== "overview") {
      search.set("view", view);
    }
    if (opportunityId) {
      search.set("opportunityId", String(opportunityId));
    }
    if (options?.editProfile) {
      search.set("editProfile", "1");
    }
    if (options?.onboarding) {
      search.set("onboarding", "1");
    }
    const query = search.toString();
    return query ? `/dashboard/org?${query}` : "/dashboard/org";
  };

  const editProfileHref = buildOrgHref(activeView, { editProfile: true });
  const closeProfileHref = buildOrgHref(activeView);
  const openOnboardingHref = buildOrgHref(activeView, { onboarding: true });
  const closeOnboardingHref = buildOrgHref(activeView);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-3xl border border-brand-700/20 bg-white/95 p-6 shadow-sm sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-gradient-to-br from-brand-50 to-transparent" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold text-slate-900">Program Dashboard</h1>
            <div className="flex flex-wrap gap-2">
              <a href={openOnboardingHref} className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-200">
                Onboarding Guide
              </a>
              <a href={editProfileHref} className="rounded-lg bg-brand-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-500 transition-colors">
                Edit Profile
              </a>
            </div>
          </div>
          <p className="mt-2 text-sm text-slate-700">{org.organization}</p>
          <p className="mt-2 text-sm text-slate-700">
            Contact: {org.contactName}
            {org.contactTitle ? ` (${org.contactTitle})` : ""} | {org.contactEmail}
            {org.contactPhone ? ` | ${org.contactPhone}` : ""}
          </p>
          <p className="mt-2 text-sm text-slate-700">{org.description || "Add organization details in your profile as needed."}</p>
          {params.error ? <p className="mt-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{params.error}</p> : null}
          {params.success ? <p className="mt-3 rounded-md bg-green-50 p-2 text-sm text-green-700">{params.success}</p> : null}
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link href={buildOrgHref("opportunities")} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Opportunities</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{org.opportunities.length}</p>
          </Link>
          <Link href={buildOrgHref("incoming")} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Incoming</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{incomingRequests.length}</p>
          </Link>
          <Link href={buildOrgHref("active-volunteers")} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Active Volunteers</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{activeVolunteers.length}</p>
          </Link>
          <Link href={buildOrgHref("ranked")} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Ranked</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{rankedStudents.length}</p>
          </Link>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <nav className="flex flex-wrap gap-2">
            {(Object.keys(ORG_VIEW_LABELS) as OrgDashboardView[]).map((view) => (
              <Link
                key={view}
                href={buildOrgHref(view)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeView === view ? "bg-brand-700 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {ORG_VIEW_LABELS[view]}
              </Link>
            ))}
            <a href={openOnboardingHref} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200">
              Onboarding
            </a>
          </nav>
        </section>

        {showEditProfile ? (
          <section className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-slate-900">Edit Program Profile</h2>
                <a href={closeProfileHref} className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-200">
                  Close
                </a>
              </div>
              <form action="/api/profile/org/update" method="post" className="grid gap-3 md:grid-cols-2">
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
                  Contact Title *
                  <select name="contactTitle" defaultValue={org.contactTitle || ""} required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
                    <option value="">Select title</option>
                    {SUPERVISOR_TITLE_OPTIONS.map((title) => (
                      <option key={title} value={title}>
                        {title}
                      </option>
                    ))}
                  </select>
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
            </div>
          </section>
        ) : null}

        {showOnboarding ? (
          <section className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-2xl">
              <OrgOnboardingGuide closeHref={closeOnboardingHref} />
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
                      <span className="font-medium">{req.student.fullName}</span> requested <span className="font-medium">{req.opportunity?.title ?? req.opportunityTitle ?? "Opportunity"}</span>
                    </p>
                    <p className="mt-1 text-sm text-slate-700">Message: {req.message || "No message provided"}</p>
                    <div className="mt-3 flex gap-2">
                      <form action="/api/match-requests/respond" method="post">
                        <input type="hidden" name="requestId" value={req.id} />
                        <input type="hidden" name="action" value="accept" />
                        <input type="hidden" name="redirectTo" value={buildOrgHref("incoming")} />
                        <button type="submit" className="rounded-md bg-brand-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-500">
                          Accept
                        </button>
                      </form>
                      <form action="/api/match-requests/respond" method="post">
                        <input type="hidden" name="requestId" value={req.id} />
                        <input type="hidden" name="action" value="reject" />
                        <input type="hidden" name="redirectTo" value={buildOrgHref("incoming")} />
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

        {activeView === "post" ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
                    <option key={option} value={option}>
                      {option}
                    </option>
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
                Radius
                <input
                  name="radius"
                  type="number"
                  min="1"
                  step="0.5"
                  defaultValue={12}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Radius Unit
                <select name="radiusUnit" defaultValue={DEFAULT_DISTANCE_UNIT} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
                  {DISTANCE_UNIT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">
                Contact Email *
                <input name="contactEmail" defaultValue={org.contactEmail} required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Contact Phone *
                <input name="contactPhone" type="tel" required defaultValue={org.contactPhone || ""} placeholder={org.contactPhone ? "" : "Required — students will see this"} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
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
        ) : null}

        {activeView === "opportunities" ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Your Opportunities</h2>
            <div className="mt-4 grid gap-4">
              {org.opportunities.length === 0 ? (
                <p className="text-sm text-slate-700">No opportunities yet.</p>
              ) : (
                org.opportunities.map((opp) => (
                  <article key={opp.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="font-medium text-slate-900">{opp.title}</p>
                    <p className="mt-1 text-sm text-slate-700">{opp.description}</p>
                    <p className="mt-1 text-sm text-slate-700">Needed schedule: {opp.availability} ({formatTimeZoneLabel(opp.timeZone)})</p>
                    <p className="mt-1 text-sm text-slate-700">Commitment: {opp.requiredCommitment}</p>
                    <p className="mt-1 text-sm text-slate-700">
                      Radius: {fromKilometers(opp.radiusKm, selectedRadiusUnit).toFixed(1)} {selectedRadiusUnit}
                    </p>
                    <form action="/api/org/opportunities/delete" method="post" className="mt-3">
                      <input type="hidden" name="opportunityId" value={opp.id} />
                      <input type="hidden" name="redirectTo" value="/dashboard/org?view=opportunities" />
                      <button type="submit" className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500">
                        Remove Opportunity
                      </button>
                    </form>
                  </article>
                ))
              )}
            </div>
          </section>
        ) : null}

        {activeView === "ranked" ? (
          <section className="grid gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-medium text-slate-700">Select opportunity for ranking</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {org.opportunities.length === 0 ? (
                  <p className="text-sm text-slate-700">Add an opportunity first to see ranked students.</p>
                ) : (
                  org.opportunities.map((opp) => (
                    <Link
                      key={opp.id}
                      href={buildOrgHref("ranked", { opportunityId: opp.id })}
                      className={`rounded-md px-3 py-1.5 text-sm ${
                        selectedOpportunity?.id === opp.id ? "bg-brand-700 text-white" : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                      }`}
                    >
                      {opp.title}
                    </Link>
                  ))
                )}
              </div>
            </div>
            {selectedOpportunity ? <h2 className="text-xl font-semibold text-slate-900">Ranked Students for: {selectedOpportunity.title}</h2> : null}
            {!selectedOpportunity ? (
              <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm">Select an opportunity to view student rankings.</p>
            ) : null}
            {selectedOpportunity
              ? rankedStudents.map((student) => {
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
                      <p className="mt-1 text-sm text-slate-700">
                        Distance: {fromKilometers(student.distanceKm, selectedRadiusUnit).toFixed(1)} {selectedRadiusUnit}
                      </p>
                      <p className="mt-1 text-sm text-slate-700">Availability: {student.availability} ({formatTimeZoneLabel(student.timeZone)})</p>
                      <p className="mt-1 text-sm text-slate-700">Matched skills: {student.skillsMatched.join(", ") || "None"}</p>

                      {status ? <p className="mt-2 text-sm text-slate-700">Request status: {status}</p> : null}

                      {canRequest ? (
                        <form action="/api/match-requests/create" method="post" className="mt-3 flex flex-col gap-2">
                          <input type="hidden" name="opportunityId" value={selectedOpportunity.id} />
                          <input type="hidden" name="studentId" value={student.studentId} />
                          <input type="hidden" name="redirectTo" value={buildOrgHref("ranked", { opportunityId: selectedOpportunity.id })} />
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
                })
              : null}
          </section>
        ) : null}

        {activeView === "active-volunteers" ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Active Volunteers</h2>
            <p className="mt-1 text-sm text-slate-500">
              Accepted matches waiting for service to be logged and reviewed. Once both are submitted, the match moves to Match History.
            </p>
            <p className="mt-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
              You can communicate directly with matched students via email — their address is on each card below.
            </p>
            <div className="mt-4 grid gap-6">
              {activeVolunteers.length === 0 ? (
                <p className="text-sm text-slate-700">No active volunteers right now — all matches are in Match History.</p>
              ) : (
                activeVolunteers.map((req) => (
                  <article key={req.id} className="rounded-xl border border-slate-200 overflow-hidden">
                    {/* Card header */}
                    <div className="bg-slate-50 px-5 py-4 border-b border-slate-200">
                      <p className="font-semibold text-slate-900">{req.opportunity?.title ?? req.opportunityTitle ?? "Opportunity"}</p>
                      <p className="mt-0.5 text-sm text-slate-600">
                        {req.student.fullName} —{" "}
                        <a href={`mailto:${req.student.user.email}`} className="text-brand-700 underline">
                          {req.student.user.email}
                        </a>
                      </p>
                      {req.message ? <p className="mt-1 text-xs text-slate-500">Message: {req.message}</p> : null}
                    </div>

                    <div className="p-5">
                      {/* Legacy case: hours already logged separately, just need the review */}
                      {req.completedAt && !req.studentReview ? (
                        <>
                          <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                            <p className="font-medium">Hours already logged</p>
                            <p className="mt-0.5">{req.hoursCompleted} hrs · {req.serviceDate ? new Date(req.serviceDate).toLocaleDateString() : new Date(req.completedAt).toLocaleDateString()}</p>
                            {req.completionNotes ? <p className="mt-0.5 text-xs">Notes: {req.completionNotes}</p> : null}
                          </div>
                          <form action="/api/match-requests/complete-and-review" method="post" className="grid gap-4">
                            <input type="hidden" name="requestId" value={req.id} />
                            <input type="hidden" name="redirectTo" value={buildOrgHref("active-volunteers")} />
                            <fieldset>
                              <legend className="text-sm font-semibold text-slate-700">Your Rating *</legend>
                              <p className="mt-0.5 text-xs text-slate-500">Required — affects this student&apos;s future ranking on ServeConnect</p>
                              <div className="mt-3 flex flex-wrap gap-3">
                                {([1, 2, 3, 4, 5] as const).map((n) => {
                                  const labels = ["", "Poor", "Fair", "Good", "Great", "Excellent"] as const;
                                  return (
                                    <label key={n} className="group flex flex-col items-center gap-1 cursor-pointer select-none">
                                      <input type="radio" name="rating" value={String(n)} required className="peer sr-only" />
                                      <span className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-slate-200 text-3xl text-slate-300 transition-colors group-hover:border-amber-300 group-hover:text-amber-300 peer-checked:border-amber-400 peer-checked:bg-amber-50 peer-checked:text-amber-500">
                                        ★
                                      </span>
                                      <span className="text-xs text-slate-500">{n} · {labels[n]}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </fieldset>
                            <label className="text-sm font-medium text-slate-700">
                              Private note for student (optional)
                              <p className="mt-0.5 text-xs font-normal text-slate-500">Sent only to the student — not on any printed form.</p>
                              <textarea name="feedback" rows={2} placeholder="e.g. Great attitude, very reliable" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                            </label>
                            <button type="submit" className="w-fit rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-500 transition-colors">
                              Submit Review
                            </button>
                          </form>
                        </>
                      ) : !req.studentReview ? (
                        /* Main case: combined log + review form */
                        <form action="/api/match-requests/complete-and-review" method="post" className="grid gap-5">
                          <input type="hidden" name="requestId" value={req.id} />
                          <input type="hidden" name="redirectTo" value={buildOrgHref("active-volunteers")} />

                          {/* Row 1: service details */}
                          <div className="grid gap-3 md:grid-cols-2">
                            <label className="text-sm font-medium text-slate-700">
                              Date of Service *
                              <input name="serviceDate" type="date" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
                            </label>
                            <label className="text-sm font-medium text-slate-700">
                              Hours Completed *
                              <input name="hoursCompleted" type="number" step="0.25" min="0.25" max="24" required placeholder="e.g. 2.5" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
                            </label>
                          </div>

                          {/* Row 2: star rating — same visual level as service details, not nested inside them */}
                          <fieldset className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <legend className="px-1 text-sm font-semibold text-slate-800">Your Rating *</legend>
                            <p className="mt-0.5 text-xs text-slate-500">Required — affects this student&apos;s future ranking on ServeConnect</p>
                            <div className="mt-3 flex flex-wrap gap-3">
                              {([1, 2, 3, 4, 5] as const).map((n) => {
                                const labels = ["", "Poor", "Fair", "Good", "Great", "Excellent"] as const;
                                return (
                                  <label key={n} className="group flex flex-col items-center gap-1 cursor-pointer select-none">
                                    <input type="radio" name="rating" value={String(n)} required className="peer sr-only" />
                                    <span className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-slate-200 text-3xl text-slate-300 transition-colors group-hover:border-amber-300 group-hover:text-amber-300 peer-checked:border-amber-400 peer-checked:bg-amber-50 peer-checked:text-amber-500">
                                      ★
                                    </span>
                                    <span className="text-xs text-slate-500">{n} · {labels[n]}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </fieldset>

                          {/* Row 3: optional text fields */}
                          <div className="grid gap-3 md:grid-cols-2">
                            <label className="text-sm font-medium text-slate-700">
                              Private note for student (optional)
                              <p className="mt-0.5 text-xs font-normal text-slate-500">Sent only to the student — not on any printed form.</p>
                              <textarea name="feedback" rows={2} placeholder="e.g. Great attitude, very reliable" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                            </label>
                            <label className="text-sm font-medium text-slate-700">
                              Activity description for service record (optional)
                              <p className="mt-0.5 text-xs font-normal text-slate-500">Appears on the printed form seen by the student and NHS advisor.</p>
                              <textarea name="completionNotes" rows={2} placeholder="e.g. Assisted with meal prep and serving at the senior center" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                            </label>
                          </div>

                          <button type="submit" className="w-fit rounded-lg bg-brand-700 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-500 transition-colors">
                            Confirm Service &amp; Submit Review
                          </button>
                        </form>
                      ) : (
                        /* Edge case: review exists but no completion — show completion-only form */
                        <form action="/api/match-requests/complete" method="post" className="grid gap-3 md:grid-cols-2">
                          <input type="hidden" name="requestId" value={req.id} />
                          <input type="hidden" name="redirectTo" value={buildOrgHref("active-volunteers")} />
                          <p className="md:col-span-2 text-sm text-slate-600 rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
                            Review already submitted. Please log the service hours to complete this match.
                          </p>
                          <label className="text-sm font-medium text-slate-700">
                            Date of Service *
                            <input name="serviceDate" type="date" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
                          </label>
                          <label className="text-sm font-medium text-slate-700">
                            Hours Completed *
                            <input name="hoursCompleted" type="number" step="0.25" min="0.25" max="24" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
                          </label>
                          <button type="submit" className="w-fit rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 md:col-span-2">
                            Log Hours
                          </button>
                        </form>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        ) : null}

        {activeView === "match-history" ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Match History</h2>
            <p className="mt-1 text-sm text-slate-500">
              All completed and reviewed matches. Service records are available for each entry below.
            </p>
            <div className="mt-4 grid gap-4">
              {matchHistory.length === 0 ? (
                <p className="text-sm text-slate-700">No completed matches yet.</p>
              ) : (
                matchHistory.map((req) => (
                  <article key={req.id} className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{req.opportunity?.title ?? req.opportunityTitle ?? "Opportunity"}</p>
                        <p className="mt-0.5 text-sm text-slate-600">
                          {req.student.fullName} —{" "}
                          <a href={`mailto:${req.student.user.email}`} className="text-brand-700 underline">
                            {req.student.user.email}
                          </a>
                        </p>
                      </div>
                      <Link
                        href={`/service-form/${req.id}`}
                        target="_blank"
                        className="flex items-center gap-1.5 rounded-lg bg-brand-700 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-500 transition-colors"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View Service Record
                      </Link>
                    </div>
                    <div className="px-5 py-4 grid gap-2">
                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-700">
                        <span>Hours: <span className="font-medium">{req.hoursCompleted ?? 0}</span></span>
                        <span>Date: <span className="font-medium">{req.serviceDate ? new Date(req.serviceDate).toLocaleDateString() : req.completedAt ? new Date(req.completedAt).toLocaleDateString() : "—"}</span></span>
                        <span>Confirmed: <span className="font-medium">{req.completedAt ? new Date(req.completedAt).toLocaleDateString() : "—"}</span></span>
                      </div>
                      {req.completionNotes ? (
                        <p className="text-sm text-slate-600">Activity: {req.completionNotes}</p>
                      ) : null}
                      {req.studentReview ? (
                        <div className="mt-1 flex items-center gap-3">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span key={star} className={`text-xl ${star <= req.studentReview!.rating ? "text-amber-400" : "text-slate-200"}`}>★</span>
                            ))}
                          </div>
                          <span className="text-sm text-slate-600">{req.studentReview.rating}/5</span>
                          {req.studentReview.feedback ? (
                            <span className="text-sm text-slate-500 italic">&ldquo;{req.studentReview.feedback}&rdquo;</span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        ) : null}

        {activeView === "overview" ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Overview</h2>
            <p className="mt-2 text-sm text-slate-700">
              Use the tabs to switch between requests, opportunity management, student rankings, and completion logging.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link href={buildOrgHref("post")} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 hover:bg-slate-100">
                Post a new opportunity with schedule, skills, and commitment details.
              </Link>
              <Link href={buildOrgHref("incoming")} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 hover:bg-slate-100">
                Review incoming student match requests and respond.
              </Link>
              <Link href={buildOrgHref("ranked")} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 hover:bg-slate-100">
                See ranked student matches for each opportunity.
              </Link>
              <Link href={buildOrgHref("active-volunteers")} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 hover:bg-slate-100">
                Log service hours and leave a review for your active volunteers.
              </Link>
              <Link href={buildOrgHref("match-history")} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 hover:bg-slate-100">
                View completed match history and access past service records.
              </Link>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

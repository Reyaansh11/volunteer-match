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

type OrgDashboardView = "overview" | "incoming" | "post" | "opportunities" | "ranked" | "accepted";

const ORG_VIEW_LABELS: Record<OrgDashboardView, string> = {
  overview: "Overview",
  incoming: "Incoming Requests",
  post: "Post Opportunity",
  opportunities: "Your Opportunities",
  ranked: "Ranked Students",
  accepted: "Accepted & Completion"
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
          <Link href={buildOrgHref("accepted")} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Accepted</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{acceptedRequests.length}</p>
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

        {activeView === "accepted" ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Accepted Matches and Completion Log</h2>
            <p className="mt-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
              You can now communicate directly with matched students via email — their address is shown on each card below.
            </p>
            <div className="mt-4 grid gap-4">
              {acceptedRequests.length === 0 ? (
                <p className="text-sm text-slate-700">No accepted matches yet.</p>
              ) : (
                acceptedRequests.map((req) => (
                  <article key={req.id} className="rounded-lg border border-slate-200 p-4">
                    <p className="font-medium text-slate-900">{req.opportunity?.title ?? req.opportunityTitle ?? "Opportunity"}</p>
                    <p className="mt-1 text-sm text-slate-700">
                      Student: {req.student.fullName} — <a href={`mailto:${req.student.user.email}`} className="text-brand-700 underline">{req.student.user.email}</a>
                    </p>
                    <p className="mt-1 text-sm text-slate-700">Request message: {req.message || "No message"}</p>

                    {req.studentReview ? (
                      <p className="mt-2 text-sm text-slate-700">Review submitted for this student.</p>
                    ) : (
                      <form action="/api/reviews/create" method="post" className="mt-3 grid gap-2 rounded-md border border-slate-200 p-3">
                        <input type="hidden" name="matchRequestId" value={req.id} />
                        <input type="hidden" name="redirectTo" value={buildOrgHref("accepted")} />
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
                        <button type="submit" className="w-fit rounded-lg bg-brand-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-500 transition-colors">
                          Save Review
                        </button>
                      </form>
                    )}

                    {req.completedAt ? (
                      <div className="mt-3 rounded-md border border-green-200 bg-green-50 p-3">
                        <p className="text-sm font-medium text-green-800">Task confirmed complete</p>
                        <p className="mt-1 text-sm text-green-800">Hours logged: {req.hoursCompleted ?? 0}</p>
                        <p className="mt-1 text-sm text-green-800">Completed on: {new Date(req.completedAt).toLocaleDateString()}</p>
                        {req.completionNotes ? <p className="mt-1 text-sm text-green-800">Notes: {req.completionNotes}</p> : null}
                        <Link
                          href={`/service-form/${req.id}`}
                          target="_blank"
                          className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-500 transition-colors"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          View Service Record
                        </Link>
                      </div>
                    ) : (
                      <form action="/api/match-requests/complete" method="post" className="mt-3 grid gap-2 md:grid-cols-2">
                        <input type="hidden" name="requestId" value={req.id} />
                        <input type="hidden" name="redirectTo" value={buildOrgHref("accepted")} />
                        <label className="text-sm font-medium text-slate-700">
                          Date of Service *
                          <input name="serviceDate" type="date" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
                        </label>
                        <label className="text-sm font-medium text-slate-700">
                          Hours Completed *
                          <input name="hoursCompleted" type="number" step="0.25" min="0.25" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
                        </label>
                        <label className="md:col-span-2 text-sm font-medium text-slate-700">
                          Activity Description / Notes (optional)
                          <input name="completionNotes" placeholder="Brief description of what the student did" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
                        </label>
                        <button type="submit" className="w-fit rounded-md bg-brand-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-500 md:col-span-2">
                          Confirm Task Completed
                        </button>
                      </form>
                    )}
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
              <Link href={buildOrgHref("accepted")} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 hover:bg-slate-100">
                Complete reviews and confirm completed service tasks.
              </Link>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

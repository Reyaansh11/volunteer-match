import Link from "next/link";
import { formatTimeZoneLabel, fromKilometers, normalizeDistanceUnit } from "@/lib/form-options";
import { prisma } from "@/lib/prisma";

export default async function OpportunitiesPage() {
  let opportunities: any[] = [];
  let loadError: string | null = null;

  try {
    opportunities = await prisma.opportunity.findMany({
      where: { archived: false, orgProfile: { status: "APPROVED" } },
      include: {
        orgProfile: true,
        skills: {
          include: {
            skill: true
          }
        }
      },
      orderBy: {
        id: "asc"
      }
    });
  } catch (error) {
    console.error("Failed to load opportunities", error);
    loadError = "We could not load opportunities right now. Please try again in a minute.";
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-12">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl text-slate-900">Opportunities</h1>
          <p className="mt-1 text-sm text-slate-600">Browse verified service opportunities from approved organizations.</p>
        </div>
        <Link
          href="/"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
        >
          ← Back Home
        </Link>
      </header>

      <section className="grid gap-4">
        {loadError ? (
          <article className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {loadError}
          </article>
        ) : opportunities.length === 0 ? (
          <article className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-slate-600">No opportunities available right now — check back soon.</p>
          </article>
        ) : (
          opportunities.map((opportunity) => (
            <article
              key={opportunity.id}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Header row */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg text-slate-900">{opportunity.title}</h2>
                  <p className="mt-0.5 text-sm font-medium text-brand-700">{opportunity.orgProfile.organization}</p>
                </div>
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
                  Open
                </span>
              </div>

              {/* Description */}
              <p className="mt-3 text-sm leading-relaxed text-slate-700">{opportunity.description}</p>

              {/* Details grid */}
              <div className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                <p><span className="font-medium text-slate-900">Commitment:</span> {opportunity.requiredCommitment}</p>
                <p>
                  <span className="font-medium text-slate-900">Availability:</span>{" "}
                  {opportunity.availability} ({formatTimeZoneLabel(opportunity.timeZone)})
                </p>
                <p>
                  <span className="font-medium text-slate-900">Radius:</span>{" "}
                  {fromKilometers(opportunity.radiusKm, normalizeDistanceUnit(opportunity.radiusUnit, "km")).toFixed(1)}{" "}
                  {normalizeDistanceUnit(opportunity.radiusUnit, "km")}
                </p>
                <p>
                  <span className="font-medium text-slate-900">Skills needed:</span>{" "}
                  {opportunity.skills.map((s: any) => `${s.skill.name}${s.required ? " (required)" : ""}`).join(", ") || "None"}
                </p>
              </div>

              {/* Contact notice */}
              <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">
                🔒 Contact details are shared after an accepted match request.
              </p>
            </article>
          ))
        )}
      </section>
    </main>
  );
}

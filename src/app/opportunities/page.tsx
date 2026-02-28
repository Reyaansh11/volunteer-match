import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function OpportunitiesPage() {
  const opportunities = await prisma.opportunity.findMany({
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

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-12">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold text-slate-900">Opportunities</h1>
        <Link href="/" className="rounded-lg bg-white px-4 py-2 text-sm font-medium ring-1 ring-slate-300 hover:bg-slate-50">
          Back Home
        </Link>
      </header>

      <section className="grid gap-4">
        {opportunities.length === 0 ? (
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">No opportunities found.</article>
        ) : (
          opportunities.map((opportunity) => (
            <article key={opportunity.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">{opportunity.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{opportunity.orgProfile.organization}</p>
              <p className="mt-3 text-sm text-slate-700">{opportunity.description}</p>
              <p className="mt-2 text-sm text-slate-700">Commitment: {opportunity.requiredCommitment}</p>
              <p className="mt-2 text-sm text-slate-700">Availability: {opportunity.availability}</p>
              <p className="mt-2 text-sm text-slate-700">Contact details are shared after an accepted match request.</p>
              <p className="mt-2 text-sm text-slate-700">
                Skills needed: {opportunity.skills.map((s) => `${s.skill.name}${s.required ? " (required)" : ""}`).join(", ") || "None"}
              </p>
            </article>
          ))
        )}
      </section>
    </main>
  );
}

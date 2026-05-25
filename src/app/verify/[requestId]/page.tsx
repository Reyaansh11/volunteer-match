import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

// Public page — no auth required. For NHS advisors to verify service records.
export const dynamic = "force-dynamic";

function fmt(date: Date | null | undefined): string {
  if (!date) return "—";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

type Props = {
  params: Promise<{ requestId: string }>;
};

export default async function VerifyPage({ params }: Props) {
  const { requestId } = await params;
  const id = Number(requestId);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const req = await prisma.matchRequest.findUnique({
    where: { id },
    include: {
      student: true,
      orgProfile: true,
      opportunity: true
    }
  });

  // Only show completed records
  if (!req || !req.completedAt) notFound();

  const student = req.student;
  const org = req.orgProfile;
  const opp = req.opportunity;

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">

      {/* Verified header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
          <svg className="h-6 w-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Service Record Verified</h1>
          <p className="text-sm text-slate-500">ServeConnect · Record #{id}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

        {/* Status banner */}
        <div className="bg-green-50 border-b border-green-200 px-6 py-3">
          <p className="text-sm font-medium text-green-800">
            ✓ This service record is authentic and was confirmed through ServeConnect's platform on{" "}
            <strong>{fmt(req.completedAt)}</strong>.
          </p>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* Student */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Student</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div>
                <span className="text-slate-500">Name</span>
                <p className="font-semibold text-slate-900">{student.fullName}</p>
              </div>
              {student.grade ? (
                <div>
                  <span className="text-slate-500">Grade</span>
                  <p className="font-semibold text-slate-900">Grade {student.grade}</p>
                </div>
              ) : null}
              {student.school ? (
                <div>
                  <span className="text-slate-500">School</span>
                  <p className="font-semibold text-slate-900">{student.school}</p>
                </div>
              ) : null}
              {student.programAffiliation ? (
                <div>
                  <span className="text-slate-500">Program / Chapter</span>
                  <p className="font-semibold text-slate-900">{student.programAffiliation}</p>
                </div>
              ) : null}
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Service */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Service Details</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div>
                <span className="text-slate-500">Opportunity</span>
                <p className="font-semibold text-slate-900">{opp.title}</p>
              </div>
              <div>
                <span className="text-slate-500">Organization</span>
                <p className="font-semibold text-slate-900">{org.organization}</p>
              </div>
              <div>
                <span className="text-slate-500">Date of Service</span>
                <p className="font-semibold text-slate-900">{fmt(req.serviceDate)}</p>
              </div>
              <div>
                <span className="text-slate-500">Hours Completed</span>
                <p className="font-semibold text-slate-900">{req.hoursCompleted ?? "—"} hrs</p>
              </div>
              <div>
                <span className="text-slate-500">Digitally Confirmed</span>
                <p className="font-semibold text-slate-900">{fmt(req.completedAt)}</p>
              </div>
            </div>
            {req.completionNotes ? (
              <div className="mt-3">
                <span className="text-xs text-slate-500">Activity Notes</span>
                <p className="mt-1 text-sm text-slate-700 leading-relaxed border-l-2 border-slate-200 pl-3">{req.completionNotes}</p>
              </div>
            ) : null}
          </section>

          <hr className="border-slate-100" />

          {/* Organization contact */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Supervising Organization</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div>
                <span className="text-slate-500">Organization</span>
                <p className="font-semibold text-slate-900">{org.organization}</p>
              </div>
              <div>
                <span className="text-slate-500">Supervisor</span>
                <p className="font-semibold text-slate-900">{org.contactName}{org.contactTitle ? `, ${org.contactTitle}` : ""}</p>
              </div>
              <div>
                <span className="text-slate-500">Contact Email</span>
                <p className="font-semibold text-slate-900">
                  <a href={`mailto:${org.contactEmail}`} className="text-brand-700 hover:underline">{org.contactEmail}</a>
                </p>
              </div>
              {org.contactPhone ? (
                <div>
                  <span className="text-slate-500">Contact Phone</span>
                  <p className="font-semibold text-slate-900">
                    <a href={`tel:${org.contactPhone}`} className="text-brand-700 hover:underline">{org.contactPhone}</a>
                  </p>
                </div>
              ) : null}
            </div>
          </section>

        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-6 py-3 text-xs text-slate-500">
          Record ID #{id} · Verified by ServeConnect · serveconnect.org
        </div>
      </div>

      <p className="mt-6 text-xs text-center text-slate-400">
        Advisors: if you have questions about this record, contact the organization supervisor directly using the contact
        information above. ServeConnect does not store electronic signatures.
      </p>
    </main>
  );
}

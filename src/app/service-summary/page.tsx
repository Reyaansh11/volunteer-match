import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

function fmt(date: Date | null | undefined): string {
  if (!date) return "—";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default async function ServiceSummaryPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.STUDENT || !user.student) redirect("/login");

  const student = user.student;

  const completedRequests = await prisma.matchRequest.findMany({
    where: {
      studentId: student.id,
      completedAt: { not: null }
    },
    include: {
      orgProfile: true,
      opportunity: true
    },
    orderBy: [
      { serviceDate: "asc" },
      { completedAt: "asc" }
    ]
  });

  const totalHours = completedRequests.reduce((sum, r) => sum + (r.hoursCompleted ?? 0), 0);
  const today = fmt(new Date());

  return (
    <>
      {/* Screen-only print guidance */}
      <div className="print:hidden bg-amber-50 border-b border-amber-200 px-6 py-3 text-sm text-amber-800 text-center">
        <strong>Service Log Summary</strong> — press{" "}
        <kbd className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">Ctrl+P</kbd> /{" "}
        <kbd className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">⌘P</kbd> and choose{" "}
        <strong>Save as PDF</strong> to save this page.
        <br />
        <span className="text-amber-700">Check with your chapter supervisor to confirm whether this format is accepted.</span>
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          @page { margin: 1.2in 1in; size: letter; }
        }
      `}</style>

      <div className="mx-auto max-w-[700px] px-8 py-10 print:py-0 print:px-0 font-sans">

        {/* Header */}
        <div className="border-b-2 border-slate-800 pb-4 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Community Service Log Summary</h1>
              <p className="text-sm text-slate-500 mt-0.5">ServeConnect · serveconnect.org</p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p>Generated: {today}</p>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mb-6 rounded border border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-600 print:bg-white print:border-slate-400">
          <strong>Notice:</strong> This summary serves as a digital record of community service completed through
          ServeConnect. Each individual record can be independently verified at{" "}
          <span className="font-mono">serveconnect.org/verify/[ID]</span>. Check with your NHS or volunteer program
          chapter supervisor to confirm whether this format is accepted by your chapter.
        </div>

        {/* Student Info */}
        <section className="mb-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Student</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
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

        {/* Totals */}
        <div className="mb-6 flex gap-6">
          <div className="rounded border border-slate-200 bg-slate-50 px-5 py-3 text-center print:bg-white print:border-slate-300">
            <p className="text-2xl font-bold text-slate-900">{completedRequests.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">Completed Services</p>
          </div>
          <div className="rounded border border-slate-200 bg-slate-50 px-5 py-3 text-center print:bg-white print:border-slate-300">
            <p className="text-2xl font-bold text-slate-900">{totalHours % 1 === 0 ? totalHours : totalHours.toFixed(2)}</p>
            <p className="text-xs text-slate-500 mt-0.5">Total Hours</p>
          </div>
        </div>

        <hr className="border-slate-200 mb-6" />

        {/* Service list */}
        {completedRequests.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No completed service records yet.</p>
        ) : (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Service Records</h2>
            <ol className="space-y-5">
              {completedRequests.map((req, idx) => (
                <li key={req.id} className="flex gap-4">
                  {/* Number */}
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-100 print:bg-white print:border print:border-slate-300 flex items-center justify-center text-xs font-bold text-slate-600">
                    {idx + 1}
                  </div>
                  {/* Content */}
                  <div className="flex-1 border-b border-slate-100 pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{req.opportunity.title}</p>
                        <p className="text-xs text-slate-500">{req.orgProfile.organization}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-slate-900">{req.hoursCompleted ?? "—"} hrs</p>
                        <p className="text-xs text-slate-400">Record #{req.id}</p>
                      </div>
                    </div>
                    <div className="mt-1.5 grid grid-cols-2 gap-x-8 text-xs text-slate-500">
                      <span>Date of Service: <strong className="text-slate-700">{fmt(req.serviceDate)}</strong></span>
                      <span>Confirmed: <strong className="text-slate-700">{fmt(req.completedAt)}</strong></span>
                    </div>
                    {req.completionNotes ? (
                      <p className="mt-1.5 text-xs text-slate-600 italic">{req.completionNotes}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-slate-400 font-mono">
                      Verify: serveconnect.org/verify/{req.id}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Footer */}
        <div className="mt-10 border-t border-slate-200 pt-4 text-xs text-slate-400 text-center">
          Generated {today} · ServeConnect · serveconnect.org
          <br />
          This summary is a digital record only. Check with your chapter coordinator to confirm it is accepted.
        </div>

      </div>
    </>
  );
}

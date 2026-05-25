import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

const BASE_URL = "https://serveconnect.org";

function fmt(date: Date | null | undefined): string {
  if (!date) return "—";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

type Props = {
  params: Promise<{ requestId: string }>;
};

export default async function ServiceFormPage({ params }: Props) {
  const { requestId } = await params;
  const id = Number(requestId);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const req = await prisma.matchRequest.findUnique({
    where: { id },
    include: {
      student: { include: { user: true } },
      orgProfile: true,
      opportunity: { include: { orgProfile: true } },
      studentReview: true
    }
  });

  if (!req || !req.completedAt) notFound();

  // Access control: only the matched student or the org can view
  const isStudent = user.role === UserRole.STUDENT && user.student?.id === req.studentId;
  const isOrg = user.role === UserRole.ORG && user.org?.id === req.orgProfileId;
  if (!isStudent && !isOrg) notFound();

  const student = req.student;
  const org = req.orgProfile;
  const opp = req.opportunity; // may be null if opportunity was deleted (snapshot fallback used below)
  const oppTitle = opp?.title ?? req.opportunityTitle ?? "Service Opportunity";
  const verifyUrl = `${BASE_URL}/verify/${id}`;

  return (
    <>
      {/* Screen-only banner */}
      <div className="print:hidden bg-amber-50 border-b border-amber-200 px-6 py-3 text-sm text-amber-800 text-center">
        <strong>This is a digital service confirmation from ServeConnect.</strong> To save as PDF: press{" "}
        <kbd className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">Ctrl+P</kbd> /{" "}
        <kbd className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">⌘P</kbd> and choose{" "}
        <strong>Save as PDF</strong> in the destination dropdown.
        <br />
        <span className="text-amber-700">
          Check with your NHS (or volunteer program) chapter supervisor to confirm this format is accepted.
        </span>
      </div>

      {/* Print-only: ensure clean white background */}
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
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Community Service Verification Record
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">ServeConnect · serveconnect.org</p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p>Record ID: <span className="font-mono font-semibold text-slate-700">#{id}</span></p>
              <p className="mt-0.5">Verify at:</p>
              <p className="font-mono text-slate-700 break-all">{verifyUrl}</p>
            </div>
          </div>
        </div>

        {/* Disclaimer banner (on printed page too, smaller) */}
        <div className="mb-6 rounded border border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-600 print:border-slate-400">
          <strong>Notice:</strong> This document serves as a printable, digital confirmation of community service
          completed through ServeConnect. Check with your NHS or volunteer program chapter supervisor to confirm
          whether this format is accepted by your chapter. Advisors can independently verify this record at{" "}
          <span className="font-mono">{verifyUrl}</span>.
        </div>

        {/* Student Info */}
        <section className="mb-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Student Information</h2>
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
            <div>
              <span className="text-slate-500">Student Email</span>
              <p className="font-semibold text-slate-900">{student.user.email}</p>
            </div>
          </div>
        </section>

        <hr className="border-slate-200 my-5" />

        {/* Opportunity Info */}
        <section className="mb-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Service Opportunity</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
            <div>
              <span className="text-slate-500">Opportunity Title</span>
              <p className="font-semibold text-slate-900">{oppTitle}</p>
            </div>
            <div>
              <span className="text-slate-500">Organization</span>
              <p className="font-semibold text-slate-900">{org.organization}</p>
            </div>
          </div>
          {opp?.description ? (
            <div className="mt-3">
              <span className="text-xs text-slate-500">Opportunity Description</span>
              <p className="mt-1 text-sm text-slate-700 leading-relaxed border-l-2 border-slate-200 pl-3">{opp.description}</p>
            </div>
          ) : null}
        </section>

        <hr className="border-slate-200 my-5" />

        {/* Service Details */}
        <section className="mb-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Service Details</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
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
              <span className="text-xs text-slate-500">Activity Notes / Description</span>
              <p className="mt-1 text-sm text-slate-700 leading-relaxed border-l-2 border-slate-200 pl-3">{req.completionNotes}</p>
            </div>
          ) : null}
        </section>

        <hr className="border-slate-200 my-5" />

        {/* Digital Verification Block */}
        <section className="mb-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Digital Confirmation</h2>
          <div className="rounded border border-slate-300 bg-slate-50 p-4 text-sm print:bg-white">
            <p className="text-slate-700 mb-3">
              This service was digitally confirmed by the supervising organization through ServeConnect's secure platform.
              Advisors may independently verify this record at{" "}
              <span className="font-mono font-semibold text-slate-800">{verifyUrl}</span>.
            </p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
              <div>
                <span className="text-slate-500 text-xs">Supervisor Name</span>
                <p className="font-semibold text-slate-900">{org.contactName}</p>
              </div>
              {org.contactTitle ? (
                <div>
                  <span className="text-slate-500 text-xs">Title</span>
                  <p className="font-semibold text-slate-900">{org.contactTitle}</p>
                </div>
              ) : null}
              <div>
                <span className="text-slate-500 text-xs">Organization</span>
                <p className="font-semibold text-slate-900">{org.organization}</p>
              </div>
              <div>
                <span className="text-slate-500 text-xs">Contact Email</span>
                <p className="font-semibold text-slate-900">{org.contactEmail}</p>
              </div>
              {org.contactPhone ? (
                <div>
                  <span className="text-slate-500 text-xs">Contact Phone</span>
                  <p className="font-semibold text-slate-900">{org.contactPhone}</p>
                </div>
              ) : null}
              <div>
                <span className="text-slate-500 text-xs">Confirmation Date</span>
                <p className="font-semibold text-slate-900">{fmt(req.completedAt)}</p>
              </div>
              <div>
                <span className="text-slate-500 text-xs">Record ID</span>
                <p className="font-mono font-semibold text-slate-900">#{id}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer note */}
        <div className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-400 text-center">
          Generated by ServeConnect · serveconnect.org · Record #{id} ·{" "}
          Verify at {verifyUrl}
          <br />
          This document is a digital confirmation only. Check with your chapter coordinator to confirm it is accepted.
        </div>

      </div>
    </>
  );
}

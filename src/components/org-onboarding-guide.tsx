"use client";

import { useState } from "react";

const STEPS = [
  {
    title: "Complete Your Program Profile",
    body: "Keep your organization description, location, and contact details current so students can quickly verify trust and fit."
  },
  {
    title: "Post High-Quality Opportunities",
    body: "Add clear titles, required skills, and exact times you need help. Better detail leads to better-ranked candidates."
  },
  {
    title: "Review and Respond to Requests",
    body: "Accept or reject incoming requests promptly. Once accepted, contact details unlock so coordination can start."
  },
  {
    title: "Track Completion and Forms",
    body: "After service is done, fill the service-hour form to generate verified records students can download."
  },
  {
    title: "Submit Internal Reviews",
    body: "Leave fair feedback after completed matches. Reviews improve internal ranking quality and future fit."
  }
] as const;

type OrgOnboardingGuideProps = {
  closeHref?: string;
};

export function OrgOnboardingGuide({ closeHref }: OrgOnboardingGuideProps) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Organization Onboarding</p>
      <h2 className="mt-2 text-xl font-semibold text-slate-900">{STEPS[step].title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-700">{STEPS[step].body}</p>

      <div className="mt-4 flex items-center gap-2">
        {STEPS.map((_, index) => (
          <span key={index} className={`h-2 w-8 rounded-full ${index <= step ? "bg-brand-600" : "bg-slate-200"}`} />
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setStep((value) => Math.max(0, value - 1))}
          disabled={step === 0}
          className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Back
        </button>
        {!isLast ? (
          <button
            type="button"
            onClick={() => setStep((value) => Math.min(STEPS.length - 1, value + 1))}
            className="rounded-md bg-brand-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-500"
          >
            Next
          </button>
        ) : null}
        {closeHref ? (
          <a href={closeHref} className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700">
            Finish
          </a>
        ) : null}
      </div>
    </div>
  );
}

import Link from "next/link";
import { COMMITMENT_OPTIONS, DAY_OPTIONS, SKILL_OPTIONS, TIME_OPTIONS } from "@/lib/form-options";

type OrgRegisterProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function OrgRegisterPage({ searchParams }: OrgRegisterProps) {
  const params = await searchParams;
  const error = params.error;

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Program Registration</h1>
        <p className="mt-2 text-sm text-slate-700">Create an organization account and optionally post your first opportunity.</p>
        {error ? <p className="mt-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p> : null}

        <form action="/api/auth/register/org" method="post" className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Organization Name *
            <input name="organization" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Category
            <input name="category" defaultValue="Senior Home" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Login Email *
            <input name="email" type="email" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Password *
            <input name="password" type="password" minLength={8} required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Contact Name *
            <input name="contactName" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Contact Email *
            <input name="contactEmail" type="email" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Contact Phone
            <input name="contactPhone" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Website URL
            <input name="websiteUrl" type="url" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            ZIP Code *
            <input name="zipCode" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            City
            <input name="city" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            State
            <input name="state" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="md:col-span-2 text-sm font-medium text-slate-700">
            About Your Program
            <textarea name="description" rows={3} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="md:col-span-2 text-sm font-medium text-slate-700">
            Volunteer Notes
            <textarea name="volunteerNotes" rows={3} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>

          <h2 className="md:col-span-2 mt-2 text-lg font-semibold text-slate-900">Optional: First Opportunity</h2>
          <label className="text-sm font-medium text-slate-700">
            Opportunity Title
            <input name="opportunityTitle" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Required Commitment
            <select name="requiredCommitmentPreset" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
              <option value="">Select commitment</option>
              {COMMITMENT_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
              <option value="custom">Custom</option>
            </select>
          </label>
          <label className="md:col-span-2 text-sm font-medium text-slate-700">
            Custom Commitment (optional)
            <input name="requiredCommitmentCustom" placeholder="e.g., 90 minutes/week" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="md:col-span-2 text-sm font-medium text-slate-700">
            Opportunity Description
            <textarea name="opportunityDescription" rows={3} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>

          <fieldset className="md:col-span-2 rounded-lg border border-slate-200 p-4">
            <legend className="px-1 text-sm font-semibold text-slate-900">Availability</legend>
            <p className="mb-3 text-xs text-slate-600">Choose one or two time windows, and all days where help is needed.</p>
            <div className="grid gap-3 md:grid-cols-2">
              <fieldset className="rounded-md border border-slate-200 p-3">
                <legend className="px-1 text-xs font-semibold text-slate-700">Days (Slot 1)</legend>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {DAY_OPTIONS.map((day) => (
                    <label key={day} className="flex items-center gap-1 text-xs text-slate-700">
                      <input type="checkbox" name="oppAvailabilityDays1" value={day} />
                      {day}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="text-sm font-medium text-slate-700">
                Start (Slot 1)
                <select name="oppAvailabilityStart1" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
                  <option value="">Select time</option>
                  {TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">
                End (Slot 1)
                <select name="oppAvailabilityEnd1" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
                  <option value="">Select time</option>
                  {TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </label>
              <fieldset className="rounded-md border border-slate-200 p-3">
                <legend className="px-1 text-xs font-semibold text-slate-700">Days (Slot 2)</legend>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {DAY_OPTIONS.map((day) => (
                    <label key={day} className="flex items-center gap-1 text-xs text-slate-700">
                      <input type="checkbox" name="oppAvailabilityDays2" value={day} />
                      {day}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="text-sm font-medium text-slate-700">
                Start (Slot 2)
                <select name="oppAvailabilityStart2" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
                  <option value="">Select time</option>
                  {TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">
                End (Slot 2)
                <select name="oppAvailabilityEnd2" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
                  <option value="">Select time</option>
                  {TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="oneDayOpportunity" />
              This is a one-day opportunity (availability fit will not affect ranking).
            </label>
          </fieldset>

          <fieldset className="md:col-span-2 rounded-lg border border-slate-200 p-4">
            <legend className="px-1 text-sm font-semibold text-slate-900">Skills Needed</legend>
            <div className="mt-2 grid gap-2 md:grid-cols-3">
              {SKILL_OPTIONS.map((skill) => (
                <label key={skill} className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" name="opportunitySkills" value={skill} />
                  <span className="capitalize">{skill}</span>
                </label>
              ))}
            </div>
            <label className="mt-3 block text-sm font-medium text-slate-700">
              Add custom skills (optional, comma-separated)
              <input name="opportunitySkillsCustom" placeholder="wheelchair support, bingo hosting" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
            </label>
          </fieldset>

          <button type="submit" className="md:col-span-2 rounded-md bg-brand-700 px-4 py-2 font-medium text-white hover:bg-brand-500">
            Create Program Account
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-700">
          Already have an account? <Link href="/login" className="text-brand-700 underline">Log in</Link>
        </p>
      </section>
    </main>
  );
}

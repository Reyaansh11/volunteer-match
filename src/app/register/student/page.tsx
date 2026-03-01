import Link from "next/link";
import { DAY_OPTIONS, SKILL_OPTIONS, TIME_OPTIONS } from "@/lib/form-options";

type StudentRegisterProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function StudentRegisterPage({ searchParams }: StudentRegisterProps) {
  const params = await searchParams;
  const error = params.error;

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Student Registration</h1>
        <p className="mt-2 text-sm text-slate-700">Build your profile so programs can discover and contact you.</p>
        {error ? <p className="mt-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p> : null}

        <form action="/api/auth/register/student" method="post" className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Full Name *
            <input name="fullName" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Email *
            <input name="email" type="email" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Password *
            <input name="password" type="password" minLength={8} required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            School
            <input name="school" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
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
          <label className="text-sm font-medium text-slate-700">
            Phone
            <input name="phone" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>

          <fieldset className="md:col-span-2 rounded-lg border border-slate-200 p-4">
            <legend className="px-1 text-sm font-semibold text-slate-900">Skills You Can Offer *</legend>
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
              <input name="skillsCustom" placeholder="poetry, sign language" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
            </label>
          </fieldset>

          <fieldset className="md:col-span-2 rounded-lg border border-slate-200 p-4">
            <legend className="px-1 text-sm font-semibold text-slate-900">Availability *</legend>
            <p className="mb-3 text-xs text-slate-600">Choose one or two weekly time windows.</p>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="text-sm font-medium text-slate-700">
                Day (Slot 1)
                <select name="availabilityDay1" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
                  <option value="">Select day</option>
                  {DAY_OPTIONS.map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">
                Start (Slot 1)
                <select name="availabilityStart1" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
                  <option value="">Select time</option>
                  {TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">
                End (Slot 1)
                <select name="availabilityEnd1" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
                  <option value="">Select time</option>
                  {TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">
                Day (Slot 2, optional)
                <select name="availabilityDay2" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
                  <option value="">Select day</option>
                  {DAY_OPTIONS.map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">
                Start (Slot 2)
                <select name="availabilityStart2" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
                  <option value="">Select time</option>
                  {TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">
                End (Slot 2)
                <select name="availabilityEnd2" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
                  <option value="">Select time</option>
                  {TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </label>
            </div>
          </fieldset>

          <label className="text-sm font-medium text-slate-700">
            Max Travel Distance (km)
            <input name="maxDistanceKm" type="number" defaultValue={25} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>

          <label className="md:col-span-2 text-sm font-medium text-slate-700">
            Personal Statement
            <textarea name="personalStatement" rows={4} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700 md:col-span-2">
            Letter of Recommendation URL (optional)
            <input name="letterOfRecUrl" type="url" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700 md:col-span-2">
            Program Affiliation (optional)
            <input name="programAffiliation" placeholder="National Honor Society" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="md:col-span-2 flex items-center gap-2 rounded-md bg-slate-50 p-3 text-sm text-slate-700">
            <input name="parentConsent" type="checkbox" />
            Parent/guardian consent has been obtained if required.
          </label>

          <button type="submit" className="md:col-span-2 rounded-md bg-brand-700 px-4 py-2 font-medium text-white hover:bg-brand-500">
            Create Student Account
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-700">
          Already have an account? <Link href="/login" className="text-brand-700 underline">Log in</Link>
        </p>
      </section>
    </main>
  );
}

import Link from "next/link";

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
            <input name="requiredCommitment" placeholder="2 hours/week" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="md:col-span-2 text-sm font-medium text-slate-700">
            Opportunity Description
            <textarea name="opportunityDescription" rows={3} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Availability
            <input name="availability" placeholder="Tue 16:00-18:00" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Skills Needed (comma-separated)
            <input name="opportunitySkills" placeholder="conversation, public speaking" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>

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

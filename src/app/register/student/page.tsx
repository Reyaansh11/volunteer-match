import Link from "next/link";

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
          <label className="text-sm font-medium text-slate-700">
            Skills * (comma-separated)
            <input name="skills" required placeholder="public speaking, entertainer, music" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Max Travel Distance (km)
            <input name="maxDistanceKm" type="number" defaultValue={25} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
          <label className="md:col-span-2 text-sm font-medium text-slate-700">
            Availability *
            <input name="availability" required placeholder="Tue 16:00-18:00; Sat 10:00-12:00" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
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

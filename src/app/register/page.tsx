import Link from "next/link";

export default function RegisterChooserPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Create Your ServeConnect Account</h1>
        <p className="mt-2 text-sm text-slate-700">Choose the account type that fits how you want to use the platform.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-lg font-semibold text-slate-900">I am a Student</h2>
            <p className="mt-2 text-sm text-slate-700">Find opportunities, request matches, and collect verified service-hour forms.</p>
            <Link href="/register/student" className="mt-4 inline-block rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500">
              Continue as Student
            </Link>
          </article>

          <article className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-lg font-semibold text-slate-900">I am an Organization</h2>
            <p className="mt-2 text-sm text-slate-700">Post opportunities, review ranked candidates, and issue service-hour verifications.</p>
            <Link href="/register/org" className="mt-4 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
              Continue as Organization
            </Link>
          </article>
        </div>
      </section>
    </main>
  );
}

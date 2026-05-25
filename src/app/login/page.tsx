import Link from "next/link";

type LoginProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginProps) {
  const params = await searchParams;
  const error = params.error;

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <section className="grid gap-6 md:grid-cols-2">

        {/* ── Log in form ── */}
        <article className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
            Welcome back
          </span>
          <h1 className="mt-3 text-2xl text-slate-900">Log In</h1>
          <p className="mt-1 text-sm text-slate-600">Choose your account type and sign in.</p>

          {error ? (
            <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
          ) : null}

          <form action="/api/auth/login" method="post" className="mt-5 space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Email
              <input
                name="email"
                type="email"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/20"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Password
              <input
                name="password"
                type="password"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/20"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Account Type
              <select
                name="role"
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/20"
              >
                <option value="STUDENT">Student</option>
                <option value="ORG">Program / Organization</option>
              </select>
            </label>
            <button
              type="submit"
              className="w-full rounded-lg bg-brand-700 px-4 py-2.5 font-semibold text-white hover:bg-brand-500 active:scale-95 transition-all"
            >
              Log In
            </button>
          </form>
        </article>

        {/* ── Sign up prompt ── */}
        <article className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <div>
            <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-600">
              New here?
            </span>
            <h2 className="mt-3 text-xl text-slate-900">Create an account</h2>
            <p className="mt-2 text-sm text-slate-600">Choose the right account for your role.</p>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/register/student"
              className="rounded-lg bg-brand-700 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-500 transition-colors"
            >
              Register as Student
            </Link>
            <Link
              href="/register/org"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Register as Organization
            </Link>
          </div>
        </article>

      </section>
    </main>
  );
}

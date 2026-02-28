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
        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Log In</h1>
          <p className="mt-2 text-sm text-slate-700">Choose your account type and sign in.</p>
          {error ? <p className="mt-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p> : null}

          <form action="/api/auth/login" method="post" className="mt-5 space-y-3">
            <label className="block text-sm font-medium text-slate-700">
              Email
              <input name="email" type="email" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Password
              <input name="password" type="password" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Account Type
              <select name="role" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">
                <option value="STUDENT">Student</option>
                <option value="ORG">Program / Organization</option>
              </select>
            </label>
            <button type="submit" className="w-full rounded-md bg-brand-700 px-4 py-2 font-medium text-white hover:bg-brand-500">
              Log In
            </button>
          </form>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">New here?</h2>
          <p className="mt-2 text-sm text-slate-700">Create the right account for your role.</p>
          <div className="mt-5 flex flex-col gap-3">
            <Link href="/register/student" className="rounded-md bg-slate-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-slate-700">
              Register as Student
            </Link>
            <Link href="/register/org" className="rounded-md bg-white px-4 py-2 text-center text-sm font-medium text-slate-900 ring-1 ring-slate-300 hover:bg-slate-100">
              Register as Program
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}

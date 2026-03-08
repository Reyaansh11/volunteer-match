export default function CookiePolicyPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Cookie Policy</h1>
        <p className="mt-2 text-xs text-slate-500">Effective date: March 8, 2026</p>
        <div className="mt-4 space-y-4 text-sm text-slate-700">
          <p>ServeConnect uses essential cookies to maintain secure sessions and keep authenticated users signed in.</p>
          <p>We may also use analytics-related storage to understand aggregate usage trends and improve product quality.</p>
          <p>
            You can manage cookie settings in your browser. Disabling essential cookies may prevent login, account security checks, and core matching features from working properly.
          </p>
        </div>
      </section>
    </main>
  );
}

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Terms of Service</h1>
        <p className="mt-2 text-xs text-slate-500">Effective date: March 8, 2026</p>
        <div className="mt-4 space-y-4 text-sm text-slate-700">
          <p>
            By using ServeConnect, you agree to provide accurate account information and use the platform only for lawful volunteer coordination purposes.
          </p>
          <p>
            Organizations and students are responsible for their own communications, supervision, scheduling, and safety decisions for activities arranged through the platform.
          </p>
          <p>
            ServeConnect may remove content, suspend access, or terminate accounts for policy violations, misuse, fraud, or unlawful conduct.
          </p>
          <p>
            The platform is provided on an as-available and as-is basis. We do not guarantee uninterrupted service, specific outcomes, or suitability for every use case.
          </p>
          <p>
            These terms may be updated periodically. Continued use after updates indicates acceptance of the revised terms.
          </p>
        </div>
      </section>
    </main>
  );
}

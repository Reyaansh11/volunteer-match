export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Privacy Policy</h1>
        <p className="mt-1 text-xs text-slate-500">Effective date: May 26, 2026 &nbsp;·&nbsp; Last updated: May 26, 2026</p>

        <div className="mt-6 space-y-8 text-sm text-slate-700">

          <div>
            <h2 className="text-base font-semibold text-slate-900">1. Who We Are</h2>
            <p className="mt-2">
              ServeConnect is a volunteer-matching platform that connects students seeking community service opportunities with organizations that need volunteers. The platform is operated independently and is not affiliated with any school district, school, or honor society chapter.
            </p>
            <p className="mt-2">
              For privacy questions or data requests, contact us at:{" "}
              <a href="mailto:reyaansh.tomar11@gmail.com" className="text-brand-700 underline">
                reyaansh.tomar11@gmail.com
              </a>
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-slate-900">2. Information We Collect</h2>
            <p className="mt-2 font-medium text-slate-800">Student accounts</p>
            <ul className="mt-1 list-disc pl-5 space-y-1">
              <li>Name, email address, and password (stored as a one-way hash — we cannot read it)</li>
              <li>ZIP code, city, and state (used to calculate distance to volunteer opportunities)</li>
              <li>Grade, school name, and program affiliation (e.g., NHS chapter)</li>
              <li>Availability schedule and travel distance preferences</li>
              <li>Skills, personal statement, and letter of recommendation URL (if provided)</li>
              <li>Phone number (optional)</li>
              <li>Service history: matched organizations, hours completed, activity descriptions, and supervisor ratings</li>
              <li>Confirmation that you are 13 years of age or older</li>
            </ul>

            <p className="mt-4 font-medium text-slate-800">Organization accounts</p>
            <ul className="mt-1 list-disc pl-5 space-y-1">
              <li>Organization name, category, and description</li>
              <li>Contact name, title, email address, and phone number</li>
              <li>ZIP code, city, state, and website URL</li>
              <li>Posted volunteer opportunities including schedule, skills needed, and commitment level</li>
            </ul>

            <p className="mt-4 font-medium text-slate-800">Automatically collected</p>
            <ul className="mt-1 list-disc pl-5 space-y-1">
              <li>Session tokens (stored as secure, one-way hashed values in our database — used to keep you logged in)</li>
              <li>IP address (used only for rate-limiting login and registration attempts to prevent abuse)</li>
            </ul>

            <p className="mt-4">
              We do not use advertising trackers, analytics cookies, or fingerprinting tools. We do not collect precise device location.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-slate-900">3. How We Use Your Information</h2>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>To create and manage your account</li>
              <li>To match students with volunteer opportunities based on location, availability, and skills</li>
              <li>To facilitate communication between students and organizations after a match is accepted</li>
              <li>To generate and verify service hour records for NHS and similar programs</li>
              <li>To send transactional emails (match requests, acceptances, and service confirmations)</li>
              <li>To detect and prevent abuse of the platform</li>
            </ul>
            <p className="mt-2">
              We do not sell, rent, or trade your personal information to any third party for marketing purposes, ever.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-slate-900">4. Information Shared Between Users</h2>
            <p className="mt-2">
              Student and organization contact details (email address, phone number) are only shared with the other party <strong>after both sides have accepted a match request</strong>. Before that point, only public profile information (name, skills, program affiliation, availability) is visible to organizations during the matching process.
            </p>
            <p className="mt-2">
              Supervisor ratings submitted by organizations are visible only to the student being reviewed. They are not displayed publicly or shared with other organizations.
            </p>
            <p className="mt-2">
              Service hour records, once generated, are accessible to the matched student and organization, and may be shared by the student with their school or program advisor for verification purposes.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-slate-900">5. Third-Party Service Providers</h2>
            <p className="mt-2">
              We use the following infrastructure providers to operate the platform. Each processes data only as necessary to deliver their service and is not permitted to use your data for their own purposes:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li><strong>Vercel</strong> — application hosting and content delivery (vercel.com)</li>
              <li><strong>Neon</strong> — PostgreSQL database hosting (neon.tech)</li>
              <li><strong>Resend</strong> — transactional email delivery (resend.com)</li>
              <li><strong>Zippopotam.us</strong> — free ZIP code geolocation lookup used to calculate distances (zippopotam.us). Only your ZIP code is sent — no name or other identifying information.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-slate-900">6. Data Retention</h2>
            <p className="mt-2">
              We retain your account data for as long as your account is active. If you request deletion of your account, we will remove your personal information within a reasonable time. Some records — such as completed service logs associated with verified hours — may be retained in anonymized form for platform integrity purposes even after account deletion.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-slate-900">7. Children&apos;s Privacy (COPPA)</h2>
            <p className="mt-2">
              ServeConnect requires all users to be <strong>13 years of age or older</strong> to register. We do not knowingly collect personal information from children under 13. If you believe a child under 13 has registered, please contact us immediately at{" "}
              <a href="mailto:reyaansh.tomar11@gmail.com" className="text-brand-700 underline">
                reyaansh.tomar11@gmail.com
              </a>{" "}
              and we will promptly remove the account and associated data.
            </p>
            <p className="mt-2">
              Students in grades 6–8 are welcome to use the platform if they have already turned 13. We rely on the age confirmation provided at registration. Parents or guardians who have questions about their child&apos;s account may contact us using the email above.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-slate-900">8. Your Rights</h2>
            <p className="mt-2">
              You may request access to, correction of, or deletion of your personal information at any time by emailing us at{" "}
              <a href="mailto:reyaansh.tomar11@gmail.com" className="text-brand-700 underline">
                reyaansh.tomar11@gmail.com
              </a>.
            </p>
            <p className="mt-2">
              <strong>California residents</strong> have additional rights under the California Consumer Privacy Act (CCPA), including the right to know what personal information is collected, the right to request deletion, and the right to opt out of sale (we do not sell data). To exercise these rights, contact us at the email above.
            </p>
            <p className="mt-2">
              You may also unsubscribe from non-essential email notifications using the unsubscribe link included in those emails.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-slate-900">9. Security</h2>
            <p className="mt-2">
              Passwords are stored using bcrypt hashing and are never recoverable in plain text. Session tokens are stored as one-way hashes. All connections use HTTPS. We apply rate limiting to login and registration endpoints to prevent brute-force attacks.
            </p>
            <p className="mt-2">
              No system is perfectly secure. We encourage you to use a strong, unique password and to contact us immediately if you believe your account has been compromised.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-slate-900">10. Changes to This Policy</h2>
            <p className="mt-2">
              We may update this Privacy Policy from time to time. When we do, we will update the &ldquo;Last updated&rdquo; date at the top of this page. Continued use of ServeConnect after changes are posted constitutes acceptance of the updated policy.
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-slate-900">11. Contact</h2>
            <p className="mt-2">
              For any privacy-related questions, data requests, or concerns, please email:{" "}
              <a href="mailto:reyaansh.tomar11@gmail.com" className="text-brand-700 underline">
                reyaansh.tomar11@gmail.com
              </a>
            </p>
          </div>

        </div>
      </section>
    </main>
  );
}

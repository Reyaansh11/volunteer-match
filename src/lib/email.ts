import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;
const FROM_EMAIL = process.env.FROM_EMAIL ?? "ServeConnect <noreply@serveconnect.org>";

export async function sendAdminNewOrgEmail(org: {
  id: number;
  organization: string;
  contactName: string;
  contactEmail: string;
  websiteUrl: string;
  category: string;
  city?: string | null;
  state?: string | null;
}) {
  const adminUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/admin`;
  await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `[ServeConnect] New org pending approval: ${org.organization}`,
    html: `
      <h2>New organization registered</h2>
      <p><strong>Name:</strong> ${org.organization}</p>
      <p><strong>Category:</strong> ${org.category}</p>
      <p><strong>Location:</strong> ${[org.city, org.state].filter(Boolean).join(", ") || "Not provided"}</p>
      <p><strong>Contact:</strong> ${org.contactName} &lt;${org.contactEmail}&gt;</p>
      <p><strong>Website:</strong> <a href="${org.websiteUrl}">${org.websiteUrl}</a></p>
      <p><a href="${adminUrl}">Review in admin panel →</a></p>
    `
  });
}

export async function sendOrgYellowFlagEmail(contactEmail: string, orgName: string, note: string) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: contactEmail,
    subject: `[ServeConnect] Action required for your organization: ${orgName}`,
    html: `
      <h2>Your ServeConnect listing needs attention</h2>
      <p>Thank you for signing up on ServeConnect. Before your opportunities can be shown to students, we need a bit more information:</p>
      <blockquote style="border-left:3px solid #ccc;padding-left:1em;color:#555">${note}</blockquote>
      <p>Please reply to this email or contact us at ${ADMIN_EMAIL} to resolve this.</p>
    `
  });
}

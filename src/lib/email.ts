import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://serveconnect.org";

// Use onboarding@resend.dev as fallback until domain is verified
const FROM_EMAIL = process.env.FROM_EMAIL ?? "onboarding@resend.dev";

// ─── Internal helper ────────────────────────────────────────────────────────

async function send(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.error("[email] RESEND_API_KEY not set — skipping send");
    return;
  }
  console.log(`[email] sending to=${to} subject="${subject}" from=${FROM_EMAIL}`);
  try {
    const result = await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
    console.log("[email] send result", JSON.stringify(result));
  } catch (err) {
    console.error("[email] send threw", err);
  }
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export async function sendAdminNewOrgEmail(org: {
  id: number;
  organization: string;
  contactName: string;
  contactEmail: string;
  websiteUrl: string;
  category: string;
  city?: string | null;
  state?: string | null;
  adminNote?: string | null;
}) {
  await send(
    ADMIN_EMAIL,
    `[ServeConnect] New org pending approval: ${org.organization}`,
    `
      <h2>New organization registered</h2>
      <p><strong>Name:</strong> ${org.organization}</p>
      <p><strong>Category:</strong> ${org.category}</p>
      <p><strong>Location:</strong> ${[org.city, org.state].filter(Boolean).join(", ") || "Not provided"}</p>
      <p><strong>Contact:</strong> ${org.contactName} &lt;${org.contactEmail}&gt;</p>
      <p><strong>Website:</strong> <a href="${org.websiteUrl}">${org.websiteUrl}</a></p>
      ${org.adminNote ? `<p style="color:#c00"><strong>⚠️ Note:</strong> ${org.adminNote}</p>` : ""}
      <p><a href="${BASE_URL}/admin">Review in admin panel →</a></p>
    `
  );
}

export async function sendOrgYellowFlagEmail(contactEmail: string, orgName: string, note: string) {
  await send(
    contactEmail,
    `[ServeConnect] Action required for your organization: ${orgName}`,
    `
      <h2>Your ServeConnect listing needs attention</h2>
      <p>Before your opportunities can be shown to students, we need a bit more information:</p>
      <blockquote style="border-left:3px solid #ccc;padding-left:1em;color:#555">${note}</blockquote>
      <p>Please reply to this email or contact us at ${ADMIN_EMAIL} to resolve this.</p>
    `
  );
}

// ─── Match requests ───────────────────────────────────────────────────────────

export async function sendMatchRequestReceivedEmail(params: {
  to: string;
  recipientName: string;
  senderName: string;
  opportunityTitle: string;
  message?: string | null;
  dashboardUrl: string;
}) {
  await send(
    params.to,
    `[ServeConnect] New match request: ${params.opportunityTitle}`,
    `
      <h2>You have a new match request</h2>
      <p>Hi ${params.recipientName},</p>
      <p><strong>${params.senderName}</strong> sent you a match request for <strong>${params.opportunityTitle}</strong>.</p>
      ${params.message ? `<p>Their message: <em>${params.message}</em></p>` : ""}
      <p><a href="${params.dashboardUrl}">View request →</a></p>
    `
  );
}

export async function sendMatchRequestAcceptedEmail(params: {
  to: string;
  recipientName: string;
  acceptorName: string;
  opportunityTitle: string;
  contactEmail: string;
  dashboardUrl: string;
}) {
  await send(
    params.to,
    `[ServeConnect] Match accepted: ${params.opportunityTitle}`,
    `
      <h2>Your match request was accepted!</h2>
      <p>Hi ${params.recipientName},</p>
      <p><strong>${params.acceptorName}</strong> accepted your match request for <strong>${params.opportunityTitle}</strong>.</p>
      <p>You can now get in touch: <a href="mailto:${params.contactEmail}">${params.contactEmail}</a></p>
      <p><a href="${params.dashboardUrl}">View your matches →</a></p>
    `
  );
}

// ─── Opportunity blast ────────────────────────────────────────────────────────

export async function sendOpportunityBlastEmail(params: {
  to: string;
  studentName: string;
  unsubscribeToken: string;
  orgName: string;
  opportunityTitle: string;
  opportunityDescription: string;
  requiredCommitment: string;
  skillsMatched: string[];
  opportunityId: number;
}) {
  const unsubscribeUrl = `${BASE_URL}/api/unsubscribe?token=${params.unsubscribeToken}`;
  const opportunitiesUrl = `${BASE_URL}/opportunities`;

  await send(
    params.to,
    `[ServeConnect] New opportunity matching your skills: ${params.opportunityTitle}`,
    `
      <h2>A new volunteer opportunity matches your profile!</h2>
      <p>Hi ${params.studentName},</p>
      <p><strong>${params.orgName}</strong> just posted a new opportunity that matches your skills:</p>
      <h3>${params.opportunityTitle}</h3>
      <p>${params.opportunityDescription}</p>
      <p><strong>Commitment:</strong> ${params.requiredCommitment}</p>
      ${params.skillsMatched.length > 0 ? `<p><strong>Your matching skills:</strong> ${params.skillsMatched.join(", ")}</p>` : ""}
      <p><a href="${opportunitiesUrl}" style="background:#1d4ed8;color:white;padding:10px 20px;border-radius:6px;text-decoration:none">View on ServeConnect →</a></p>
      <hr style="margin-top:2em;border:none;border-top:1px solid #eee"/>
      <p style="font-size:12px;color:#999">
        You're receiving this because you have a ServeConnect student account.
        <a href="${unsubscribeUrl}">Unsubscribe from opportunity alerts</a>
      </p>
    `
  );
}

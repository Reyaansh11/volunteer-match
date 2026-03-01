type MatchRequestEmailParams = {
  to: string;
  subject: string;
  text: string;
};

export async function sendMatchRequestEmail(params: MatchRequestEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    return { sent: false, reason: "Email provider not configured" as const };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: params.to,
        subject: params.subject,
        text: params.text
      })
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("Failed to send email notification", { status: response.status, body });
      return { sent: false, reason: "Provider returned non-2xx status" as const };
    }

    return { sent: true as const };
  } catch (error) {
    console.error("Email notification failed", error);
    return { sent: false, reason: "Request failed" as const };
  }
}

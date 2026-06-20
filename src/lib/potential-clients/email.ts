import "server-only";

import type { PotentialClientValidatedInput } from "@/lib/potential-clients/validation";
import type { Database } from "@/types/database";

type PotentialClientRow = Database["public"]["Tables"]["potential_clients"]["Row"];

type EmailResult =
  | {
      status: "sent";
      sentAt: string;
    }
  | {
      status: "skipped" | "failed";
      error?: string;
    };

function getEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.SALES_FROM_EMAIL?.trim();
  const replyTo = process.env.SALES_REPLY_TO_EMAIL?.trim();

  if (!apiKey || !from) {
    return null;
  }

  return {
    apiKey,
    from,
    replyTo: replyTo || undefined
  };
}

function formatContactMethod(method: string) {
  if (method === "sms") return "SMS";
  if (method === "email") return "Email";
  return "Either";
}

async function sendResendEmail({
  html,
  subject,
  text,
  to
}: {
  html?: string;
  subject: string;
  text: string;
  to: string;
}): Promise<EmailResult> {
  const config = getEmailConfig();

  if (!config) {
    return { status: "skipped" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: config.from,
        to,
        subject,
        text,
        html,
        reply_to: config.replyTo
      })
    });

    if (!response.ok) {
      return {
        status: "failed",
        error: `Resend rejected email with status ${response.status}`
      };
    }

    return {
      status: "sent",
      sentAt: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: "failed",
      error: error instanceof Error ? error.message : "Email send failed"
    };
  }
}

export async function sendPotentialClientConfirmationEmail(
  input: PotentialClientValidatedInput
): Promise<EmailResult> {
  const preferredContact = formatContactMethod(input.preferredContactMethod);
  const text = `Hi ${input.fullName},

Thanks for your interest in Open Spot.

We received your request and will contact you shortly by SMS or email to schedule a quick call.

Here's what we received:
Business: ${input.businessName}
Business type: ${input.businessType}
Preferred contact method: ${preferredContact}

Open Spot helps appointment-based businesses recover last-minute cancellations by contacting interested clients and keeping confirmation in your team's control.

Talk soon,
The Open Spot team

If you no longer want to be contacted, reply STOP by SMS or contact us by email.`;

  return sendResendEmail({
    to: input.email,
    subject: "We received your Open Spot call request",
    text
  });
}

export async function sendPotentialClientOwnerNotification(
  lead: PotentialClientRow
): Promise<EmailResult> {
  const ownerEmail = process.env.SALES_OWNER_EMAIL?.trim();

  if (!ownerEmail) {
    return { status: "skipped" };
  }

  const text = `A new potential client requested a call.

Name: ${lead.full_name}
Business: ${lead.business_name}
Business type: ${lead.business_type}
Email: ${lead.email}
Phone: ${lead.phone}
Preferred contact: ${formatContactMethod(lead.preferred_contact_method)}
Message: ${lead.message ?? "None"}
Consent: yes
Submitted: ${lead.created_at}

Open in dashboard: /admin/potential-clients`;

  return sendResendEmail({
    to: ownerEmail,
    subject: `New Open Spot potential client: ${lead.business_name}`,
    text
  });
}

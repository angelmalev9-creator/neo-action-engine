import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type Payload = {
  siteUrl: string;
  customer: {
    name: string;
    email: string;
  };
  execution: {
    mode: "demo" | "real";
  };
};

export async function sendBookingEmails(payload: Payload) {
  const siteDomain = new URL(payload.siteUrl).hostname;
  const from = process.env.EMAIL_FROM!;

  // 1️⃣ EMAIL TO CUSTOMER (ALWAYS)
  const customerSubject =
    payload.execution.mode === "demo"
      ? `[DEMO] Reservation simulation – ${siteDomain}`
      : `Reservation confirmed – ${siteDomain}`;

  const customerBody =
    payload.execution.mode === "demo"
      ? `⚠️ DEMO EMAIL

This is a reservation simulation.
No real booking has been made.

Site: ${siteDomain}
Executed by: NEO
`
      : `Your reservation has been completed.

Site: ${siteDomain}
Executed by: NEO
`;

  await resend.emails.send({
    from,
    to: payload.customer.email,
    subject: customerSubject,
    text: customerBody
  });

  // 2️⃣ EMAIL TO SITE OWNER (REAL ONLY)
  if (payload.execution.mode === "real") {
    const ownerEmail = `reservations@${siteDomain}`;

    await resend.emails.send({
      from,
      to: ownerEmail,
      subject: `New reservation via NEO`,
      text: `A new reservation was completed via NEO.

Customer: ${payload.customer.name}
Email: ${payload.customer.email}
Site: ${siteDomain}
`
    });
  }
}

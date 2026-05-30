import "server-only";

import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";

const FROM = process.env.EMAIL_FROM ?? "Workia <onboarding@resend.dev>";

type SendArgs = { to: string; subject: string; html: string };

/** Best-effort transactional email. No-op when RESEND_API_KEY is unset and
 *  never throws — notifications must not break the booking flow. */
async function sendEmail({ to, subject, html }: SendArgs) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch {
    // Swallow — booking already succeeded; the email is non-critical.
  }
}

function layout(orgName: string, body: string) {
  return `<div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:480px;margin:0 auto;color:#0f172a">
    <h2 style="font-size:18px;margin:0 0 16px">${orgName}</h2>
    ${body}
    <p style="color:#64748b;font-size:12px;margin-top:24px">Enviado con Workia</p>
  </div>`;
}

export type BookingEmailInput = {
  to: string;
  guestName: string;
  orgName: string;
  resourceName: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  status: "pending" | "confirmed";
};

export async function notifyBookingCreated(b: BookingEmailInput) {
  const day = formatInTimeZone(b.startsAt, b.timezone, "EEEE d 'de' MMMM", {
    locale: es,
  });
  const start = formatInTimeZone(b.startsAt, b.timezone, "HH:mm");
  const end = formatInTimeZone(b.endsAt, b.timezone, "HH:mm");

  const confirmed = b.status === "confirmed";
  const subject = confirmed
    ? `Reserva confirmada · ${b.resourceName}`
    : `Solicitud de reserva recibida · ${b.resourceName}`;

  const intro = confirmed
    ? `Tu reserva quedó <strong>confirmada</strong>.`
    : `Recibimos tu solicitud. Quedó <strong>pendiente de confirmación</strong> y te avisaremos en cuanto la revisemos.`;

  const body = `
    <p style="font-size:14px">Hola ${b.guestName},</p>
    <p style="font-size:14px">${intro}</p>
    <table style="font-size:14px;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:4px 12px 4px 0;color:#64748b">Espacio</td><td style="padding:4px 0"><strong>${b.resourceName}</strong></td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#64748b">Fecha</td><td style="padding:4px 0;text-transform:capitalize">${day}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#64748b">Horario</td><td style="padding:4px 0">${start} – ${end}</td></tr>
    </table>`;

  await sendEmail({ to: b.to, subject, html: layout(b.orgName, body) });
}

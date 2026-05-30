import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { notifyBookingCreated } from "@/lib/email";
import { commissionFor } from "@/lib/plans";
import type { PaymentStatus } from "@/lib/supabase/types";

/** Maps a Mercado Pago payment status onto our PaymentStatus enum. */
export function mapPaymentStatus(mp: string | undefined): PaymentStatus {
  switch (mp) {
    case "approved":
      return "approved";
    case "rejected":
      return "rejected";
    case "refunded":
    case "charged_back":
      return "refunded";
    case "cancelled":
      return "cancelled";
    case "pending":
      return "pending";
    default:
      return "in_process";
  }
}

type PaymentRow = {
  id: string;
  org_id: string;
  booking_id: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  metadata: Record<string, unknown> | null;
};

/**
 * Settles a booking payment: updates the payment row, and on approval confirms
 * the booking, credits the org's wallet with the net amount (sale minus our
 * commission) and sends the confirmation email.
 *
 * Idempotent: once a payment is "approved" it is never reprocessed, so calling
 * this from both the in-page action and the webhook never double-credits.
 */
export async function settleBookingPayment(opts: {
  paymentId: string;
  mpPaymentId: string | number;
  mpStatus: string | undefined;
}): Promise<{ status: PaymentStatus }> {
  const supabase = createServiceClient();

  const { data: payment } = await supabase
    .from("payments")
    .select("id, org_id, booking_id, amount, currency, status, metadata")
    .eq("id", opts.paymentId)
    .maybeSingle();
  if (!payment) return { status: mapPaymentStatus(opts.mpStatus) };
  const p = payment as PaymentRow;

  // Idempotency: once approved we never reprocess (avoids double ledger credit).
  if (p.status === "approved") return { status: "approved" };

  const status = mapPaymentStatus(opts.mpStatus);
  await supabase
    .from("payments")
    .update({
      status,
      provider_payment_id: String(opts.mpPaymentId),
      paid_at: status === "approved" ? new Date().toISOString() : null,
    })
    .eq("id", p.id);

  if (status !== "approved") {
    // Rejected/cancelled payments leave the booking pending; nothing to credit.
    return { status };
  }

  // Confirm the booking the payment belongs to.
  if (p.booking_id) {
    await supabase
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", p.booking_id);
  }

  // Credit the org's wallet with the net amount (sale minus our commission).
  const commissionBps = Number(p.metadata?.commission_bps ?? 0);
  const commission = commissionFor({ commission_bps: commissionBps }, p.amount);
  const net = p.amount - commission;
  await supabase.from("wallet_ledger").insert({
    org_id: p.org_id,
    entry_type: "sale_net",
    amount: net,
    payment_id: p.id,
    note: `Reserva pagada · comisión ${(commissionBps / 100).toFixed(2)}%`,
  });

  // Confirmation email (best-effort).
  const meta = p.metadata ?? {};
  const guestEmail = typeof meta.guest_email === "string" ? meta.guest_email : null;
  if (guestEmail && p.booking_id) {
    const { data: booking } = await supabase
      .from("bookings")
      .select("guest_name, starts_at, ends_at")
      .eq("id", p.booking_id)
      .maybeSingle();
    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", p.org_id)
      .maybeSingle();
    const b = booking as {
      guest_name: string | null;
      starts_at: string;
      ends_at: string;
    } | null;
    if (b) {
      await notifyBookingCreated({
        to: guestEmail,
        guestName: b.guest_name ?? "",
        orgName: (org as { name: string } | null)?.name ?? "Espazio",
        resourceName:
          typeof meta.resource_name === "string" ? meta.resource_name : "Espacio",
        startsAt: b.starts_at,
        endsAt: b.ends_at,
        timezone:
          typeof meta.timezone === "string" ? meta.timezone : "America/Mexico_City",
        status: "confirmed",
      });
    }
  }

  return { status: "approved" };
}

import crypto from "node:crypto";

import type { NextRequest } from "next/server";

import { createServiceClient } from "@/lib/supabase/server";
import { getMpPayment } from "@/lib/mercadopago";
import { notifyBookingCreated } from "@/lib/email";
import { commissionFor } from "@/lib/plans";
import type { PaymentStatus } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

/** Maps a Mercado Pago payment status onto our PaymentStatus enum. */
function mapStatus(mp: string | undefined): PaymentStatus {
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

/** Validates the x-signature header when MERCADOPAGO_WEBHOOK_SECRET is set.
 *  Returns true when no secret is configured (validation disabled). */
function validSignature(req: NextRequest, dataId: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) return true;

  const sig = req.headers.get("x-signature");
  const requestId = req.headers.get("x-request-id");
  if (!sig) return false;

  const parts = Object.fromEntries(
    sig.split(",").map((kv) => {
      const [k, v] = kv.split("=");
      return [k?.trim(), v?.trim()];
    }),
  ) as { ts?: string; v1?: string };
  if (!parts.ts || !parts.v1) return false;

  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${parts.ts};`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(parts.v1),
    );
  } catch {
    return false;
  }
}

/** Extracts the Mercado Pago payment id from the notification (body or query). */
async function extractPaymentId(req: NextRequest): Promise<string | null> {
  const url = new URL(req.url);
  const qpType = url.searchParams.get("type") ?? url.searchParams.get("topic");
  const qpId =
    url.searchParams.get("data.id") ?? url.searchParams.get("id");

  let body: { type?: string; action?: string; data?: { id?: string } } = {};
  try {
    body = await req.json();
  } catch {
    // Some notifications carry no JSON body — fall back to query params.
  }

  const type = body.type ?? body.action?.split(".")[0] ?? qpType;
  if (type && !type.startsWith("payment")) return null; // ignore non-payment events

  return body.data?.id ?? qpId ?? null;
}

export async function POST(req: NextRequest) {
  const mpPaymentId = await extractPaymentId(req);
  // Always 200 so Mercado Pago stops retrying notifications we can't act on.
  if (!mpPaymentId) return new Response(null, { status: 200 });

  if (!validSignature(req, mpPaymentId)) {
    return new Response("invalid signature", { status: 401 });
  }

  let mp;
  try {
    mp = await getMpPayment(mpPaymentId);
  } catch {
    // Transient MP error — ask for a retry.
    return new Response("mp fetch failed", { status: 503 });
  }

  const externalReference = mp.external_reference; // our payments.id
  const mpStatus = mp.status; // approved | rejected | ...
  if (!externalReference) return new Response(null, { status: 200 });

  const supabase = createServiceClient();

  const { data: payment } = await supabase
    .from("payments")
    .select("id, org_id, booking_id, amount, currency, status, metadata")
    .eq("id", externalReference)
    .maybeSingle();
  if (!payment) return new Response(null, { status: 200 });

  const p = payment as {
    id: string;
    org_id: string;
    booking_id: string | null;
    amount: number;
    currency: string;
    status: PaymentStatus;
    metadata: Record<string, unknown> | null;
  };

  // Idempotency: once approved we never reprocess (avoids double ledger credit).
  if (p.status === "approved") return new Response(null, { status: 200 });

  const status = mapStatus(mpStatus);
  await supabase
    .from("payments")
    .update({
      status,
      provider_payment_id: String(mpPaymentId),
      paid_at: status === "approved" ? new Date().toISOString() : null,
    })
    .eq("id", p.id);

  if (status !== "approved") {
    // Rejected/cancelled payments leave the booking pending; nothing to credit.
    return new Response(null, { status: 200 });
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
        timezone: typeof meta.timezone === "string" ? meta.timezone : "America/Mexico_City",
        status: "confirmed",
      });
    }
  }

  return new Response(null, { status: 200 });
}

import crypto from "node:crypto";

import type { NextRequest } from "next/server";

import { createServiceClient } from "@/lib/supabase/server";
import { getMpPayment, getMpPreapproval } from "@/lib/mercadopago";
import { settleBookingPayment } from "@/lib/payments";
import type { PlanCode, SubscriptionStatus } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

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

type EventKind = "payment" | "subscription" | null;

/** Classifies the notification and extracts the resource id (body or query). */
async function parseEvent(
  req: NextRequest,
): Promise<{ kind: EventKind; id: string | null }> {
  const url = new URL(req.url);
  const qpType = url.searchParams.get("type") ?? url.searchParams.get("topic");
  const qpId = url.searchParams.get("data.id") ?? url.searchParams.get("id");

  let body: { type?: string; action?: string; data?: { id?: string } } = {};
  try {
    body = await req.json();
  } catch {
    // Some notifications carry no JSON body — fall back to query params.
  }

  const type = body.type ?? body.action?.split(".")[0] ?? qpType ?? "";
  const id = body.data?.id ?? qpId ?? null;

  let kind: EventKind = null;
  if (type.includes("preapproval") || type.includes("subscription")) {
    kind = "subscription";
  } else if (type.includes("payment")) {
    kind = "payment";
  }
  return { kind, id };
}

/** Maps a Mercado Pago preapproval status onto our SubscriptionStatus. */
function mapSubStatus(mp: string | undefined): {
  status: SubscriptionStatus;
  active: boolean;
} {
  switch (mp) {
    case "authorized":
      return { status: "active", active: true };
    case "paused":
      return { status: "paused", active: false };
    case "cancelled":
      return { status: "cancelled", active: false };
    default:
      return { status: "trialing", active: false };
  }
}

async function handleSubscription(req: NextRequest, preapprovalId: string) {
  if (!validSignature(req, preapprovalId)) {
    return new Response("invalid signature", { status: 401 });
  }

  let pre;
  try {
    pre = await getMpPreapproval(preapprovalId);
  } catch {
    return new Response("mp fetch failed", { status: 503 });
  }

  const ref = pre.external_reference ?? ""; // `${orgId}:${planCode}`
  const [orgId, planCode] = ref.split(":") as [string, PlanCode | undefined];
  if (!orgId || (planCode !== "lite" && planCode !== "premium")) {
    return new Response(null, { status: 200 });
  }

  const { status, active } = mapSubStatus(pre.status);
  // Authorized → grant the paid plan; otherwise fall back to free access.
  const effectivePlan: PlanCode = active ? planCode : "free";

  const supabase = createServiceClient();
  await supabase.from("subscriptions").upsert(
    {
      org_id: orgId,
      plan_code: effectivePlan,
      status,
      mp_subscription_id: preapprovalId,
      mp_payer_id: pre.payer_id ? String(pre.payer_id) : null,
      cancel_at_period_end: false,
    },
    { onConflict: "org_id" },
  );

  return new Response(null, { status: 200 });
}

export async function POST(req: NextRequest) {
  const { kind, id } = await parseEvent(req);
  // Always 200 so Mercado Pago stops retrying notifications we can't act on.
  if (!id || !kind) return new Response(null, { status: 200 });

  if (kind === "subscription") {
    return handleSubscription(req, id);
  }

  const mpPaymentId = id;
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
  if (!externalReference) return new Response(null, { status: 200 });

  // Confirm the booking + credit the wallet (idempotent — shared with the
  // in-page payment action, so whichever runs first wins and never double-pays).
  await settleBookingPayment({
    paymentId: externalReference,
    mpPaymentId,
    mpStatus: mp.status,
  });

  return new Response(null, { status: 200 });
}

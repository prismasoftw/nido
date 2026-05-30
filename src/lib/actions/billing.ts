"use server";

import { headers } from "next/headers";

import { z } from "zod";

import { requireOrg, getUser, isAdminRole } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { PLAN_CATALOG } from "@/lib/plans";
import { createPlanPreapproval, mpConfigured } from "@/lib/mercadopago";
import type { PlanCode, SubscriptionStatus } from "@/lib/supabase/types";

export type UpgradePayResult = {
  status: "active" | "pending" | "rejected";
  error?: string;
};

async function requestOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : "";
}

const schema = z.object({
  plan: z.enum(["lite", "premium"]),
  token: z.string().min(1),
});

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

/**
 * Subscribes the org to a paid plan by charging a card token tokenized in the
 * browser (authorized preapproval) — no redirect to Mercado Pago. On success the
 * subscription is recorded immediately; the webhook later reconciles renewals.
 */
export async function payPlanUpgradeAction(
  input: z.input<typeof schema>,
): Promise<UpgradePayResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { status: "rejected", error: "Datos inválidos." };
  const target = parsed.data.plan as PlanCode;

  const { org, role } = await requireOrg();
  if (!isAdminRole(role)) {
    return { status: "rejected", error: "Solo un administrador puede cambiar el plan." };
  }
  if (org.plan === target) {
    return { status: "rejected", error: "Ya tienes este plan activo." };
  }
  if (!mpConfigured()) {
    return { status: "rejected", error: "Los pagos en línea no están disponibles por ahora." };
  }

  const user = await getUser();
  const payerEmail = user?.email;
  if (!payerEmail) {
    return { status: "rejected", error: "No pudimos obtener tu correo. Vuelve a iniciar sesión." };
  }

  const plan = PLAN_CATALOG[target];
  const origin = await requestOrigin();

  let pre;
  try {
    pre = await createPlanPreapproval({
      reason: `Espazio · Plan ${plan.name}`,
      amount: plan.price_mxn,
      currency: org.currency || "MXN",
      payerEmail,
      externalReference: `${org.id}:${target}`,
      backUrl: `${origin}/settings?plan=${target}`,
      cardTokenId: parsed.data.token,
    });
  } catch {
    return { status: "rejected", error: "No se pudo procesar el pago. Revisa los datos de tu tarjeta." };
  }
  if (!pre.id) {
    return { status: "rejected", error: "No se pudo procesar el pago. Inténtalo de nuevo." };
  }

  const { status, active } = mapSubStatus(pre.status ?? undefined);
  const effectivePlan: PlanCode = active ? target : org.plan;

  // Record the subscription (service role bypasses RLS).
  const supabase = createServiceClient();
  await supabase.from("subscriptions").upsert(
    {
      org_id: org.id,
      plan_code: effectivePlan,
      status,
      mp_subscription_id: pre.id,
      mp_payer_id: pre.payerId ? String(pre.payerId) : null,
      cancel_at_period_end: false,
    },
    { onConflict: "org_id" },
  );

  if (active) return { status: "active" };
  return { status: "pending" };
}

"use server";

import { headers } from "next/headers";

import { requireOrg, getUser, isAdminRole } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { PLAN_CATALOG } from "@/lib/plans";
import { createPlanPreapproval, mpConfigured } from "@/lib/mercadopago";
import type { PlanCode } from "@/lib/supabase/types";

export type UpgradeState = {
  error?: string;
  redirectUrl?: string;
} | null;

async function requestOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : "";
}

/** Starts a Mercado Pago subscription for the chosen paid plan and returns the
 *  checkout URL. The plan only takes effect once the webhook confirms it. */
export async function startPlanUpgradeAction(
  _prev: UpgradeState,
  formData: FormData,
): Promise<UpgradeState> {
  const target = String(formData.get("plan") ?? "") as PlanCode;
  if (target !== "lite" && target !== "premium") {
    return { error: "Plan inválido." };
  }

  const { org, role } = await requireOrg();
  if (!isAdminRole(role)) {
    return { error: "Solo un administrador puede cambiar el plan." };
  }
  if (org.plan === target) {
    return { error: "Ya tienes este plan activo." };
  }
  if (!mpConfigured()) {
    return { error: "Los pagos en línea no están disponibles por ahora." };
  }

  const user = await getUser();
  const payerEmail = user?.email;
  if (!payerEmail) {
    return { error: "No pudimos obtener tu correo. Vuelve a iniciar sesión." };
  }

  const plan = PLAN_CATALOG[target];
  const origin = await requestOrigin();

  try {
    const pre = await createPlanPreapproval({
      reason: `Espazio · Plan ${plan.name}`,
      amount: plan.price_mxn,
      currency: org.currency || "MXN",
      payerEmail,
      externalReference: `${org.id}:${target}`,
      backUrl: `${origin}/settings?plan=${target}`,
    });
    if (!pre.initPoint) throw new Error("No init_point");

    // Record the pending subscription intent (service role bypasses RLS).
    const supabase = createServiceClient();
    await supabase
      .from("subscriptions")
      .upsert(
        {
          org_id: org.id,
          plan_code: org.plan, // keep current plan until webhook confirms
          status: "trialing",
          mp_subscription_id: pre.id,
          mp_payer_id: pre.payerId ? String(pre.payerId) : null,
          cancel_at_period_end: false,
        },
        { onConflict: "org_id" },
      );

    return { redirectUrl: pre.initPoint };
  } catch {
    return { error: "No se pudo conectar con Mercado Pago. Inténtalo de nuevo." };
  }
}

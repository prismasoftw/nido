"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  isAdminRole,
  isPlatformAdmin,
  requireOrg,
  requireUser,
} from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

export type PayoutState = {
  error?: string;
  ok?: boolean;
  message?: string;
} | null;

const requestSchema = z.object({
  amount: z.coerce.number().int().positive("Ingresa un monto válido."),
  destination: z.string().trim().min(3, "Indica tu CLABE o cuenta.").max(200),
  note: z.string().trim().max(300).optional().or(z.literal("")),
});

/** A coworking admin requests to withdraw part of its wallet balance. The
 *  amount is reserved immediately via a negative ledger entry. */
export async function requestPayoutAction(
  _prev: PayoutState,
  formData: FormData,
): Promise<PayoutState> {
  const { org, role } = await requireOrg();
  if (!isAdminRole(role)) {
    return { error: "Solo un administrador puede solicitar retiros." };
  }

  const user = await requireUser();
  const parsed = requestSchema.safeParse({
    amount: formData.get("amount"),
    destination: formData.get("destination"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const { amount, destination, note } = parsed.data;

  const supabase = createServiceClient();
  const { data: balance } = await supabase.rpc("org_wallet_balance", {
    p_org: org.id,
  });
  const available = Number(balance ?? 0);
  if (amount > available) {
    return { error: "El monto supera tu saldo disponible." };
  }

  const { data: payout, error } = await supabase
    .from("payouts")
    .insert({
      org_id: org.id,
      amount,
      status: "requested",
      destination,
      note: note || null,
      requested_by: user.id,
    })
    .select("id")
    .single();
  if (error || !payout) {
    return { error: "No se pudo registrar la solicitud. Inténtalo de nuevo." };
  }
  const payoutId = (payout as { id: string }).id;

  // Reserve the funds so the balance reflects the pending withdrawal.
  await supabase.from("wallet_ledger").insert({
    org_id: org.id,
    entry_type: "payout",
    amount: -amount,
    payout_id: payoutId,
    note: "Retiro solicitado",
  });

  revalidatePath("/payments");
  return { ok: true, message: "Solicitud de retiro enviada." };
}

/** Platform-admin action: settle a payout request (mark paid or rejected). */
export async function resolvePayoutAction(
  _prev: PayoutState,
  formData: FormData,
): Promise<PayoutState> {
  await requireUser();
  if (!(await isPlatformAdmin())) {
    return { error: "No autorizado." };
  }

  const payoutId = String(formData.get("payout_id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!payoutId || (decision !== "paid" && decision !== "rejected")) {
    return { error: "Datos inválidos." };
  }

  const supabase = createServiceClient();
  const { data: payout } = await supabase
    .from("payouts")
    .select("id, org_id, amount, status")
    .eq("id", payoutId)
    .maybeSingle();
  if (!payout) return { error: "Solicitud no encontrada." };
  const p = payout as {
    id: string;
    org_id: string;
    amount: number;
    status: string;
  };
  if (p.status !== "requested") {
    return { error: "Esta solicitud ya fue procesada." };
  }

  await supabase
    .from("payouts")
    .update({ status: decision, processed_at: new Date().toISOString() })
    .eq("id", p.id);

  if (decision === "rejected") {
    // Return the reserved funds to the org's balance.
    await supabase.from("wallet_ledger").insert({
      org_id: p.org_id,
      entry_type: "payout_reversal",
      amount: p.amount,
      payout_id: p.id,
      note: "Retiro rechazado",
    });
  }

  revalidatePath("/admin/payouts");
  return {
    ok: true,
    message: decision === "paid" ? "Retiro marcado como pagado." : "Retiro rechazado.",
  };
}

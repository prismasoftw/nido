"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireOrg } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: boolean;
} | null;

function flatten(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

const paymentSchema = z.object({
  member_id: z.string().uuid().optional().or(z.literal("")),
  kind: z.enum(["booking", "membership", "other"]),
  amount: z.coerce.number().int().min(1, "Monto inválido.").max(100_000_000),
  provider: z.enum(["cash", "transfer", "other"]),
  status: z.enum(["approved", "pending"]).default("approved"),
});

export async function recordPaymentAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { org, role } = await requireOrg();
  if (role !== "owner" && role !== "admin") {
    return { error: "No tienes permisos para registrar pagos." };
  }

  const parsed = paymentSchema.safeParse({
    member_id: formData.get("member_id"),
    kind: formData.get("kind"),
    amount: formData.get("amount"),
    provider: formData.get("provider"),
    status: formData.get("status") || "approved",
  });
  if (!parsed.success) return { fieldErrors: flatten(parsed.error) };
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("payments").insert({
    org_id: org.id,
    member_id: d.member_id || null,
    kind: d.kind,
    amount: d.amount,
    currency: org.currency,
    status: d.status,
    provider: d.provider,
    paid_at: d.status === "approved" ? new Date().toISOString() : null,
  });
  if (error) return { error: "No se pudo registrar el pago." };

  revalidatePath("/payments");
  return { ok: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { isAdminRole, requireOrg } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { PriceUnit } from "@/lib/supabase/types";

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

const BILLING_UNITS: readonly PriceUnit[] = ["hour", "day", "week", "month"];

const planSchema = z.object({
  name: z.string().trim().min(2, "Escribe un nombre.").max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  price: z.coerce.number().int("Usa un monto entero.").min(0).max(1_000_000),
  billing_unit: z
    .enum(BILLING_UNITS as [PriceUnit, ...PriceUnit[]])
    .default("month"),
  included_hours: z.coerce
    .number()
    .int()
    .min(0)
    .max(10_000)
    .optional()
    .or(z.literal("")),
  is_active: z.coerce.boolean().default(true),
});

function parse(formData: FormData) {
  return planSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    billing_unit: formData.get("billing_unit") || "month",
    included_hours: formData.get("included_hours") ?? "",
    is_active: formData.get("is_active") === "on" || formData.get("is_active") === "true",
  });
}

export async function createMembershipPlanAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { org, role } = await requireOrg();
  if (!isAdminRole(role)) return { error: "Solo administradores." };

  const parsed = parse(formData);
  if (!parsed.success) return { fieldErrors: flatten(parsed.error) };
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("membership_plans").insert({
    org_id: org.id,
    name: d.name,
    description: d.description || null,
    price: d.price,
    currency: org.currency,
    billing_unit: d.billing_unit,
    included_hours: d.included_hours === "" ? null : Number(d.included_hours),
    is_active: d.is_active,
  });
  if (error) return { error: "No se pudo crear la membresía." };

  revalidatePath("/members");
  return { ok: true };
}

export async function updateMembershipPlanAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { org, role } = await requireOrg();
  if (!isAdminRole(role)) return { error: "Solo administradores." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Membresía no encontrada." };

  const parsed = parse(formData);
  if (!parsed.success) return { fieldErrors: flatten(parsed.error) };
  const d = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("membership_plans")
    .update({
      name: d.name,
      description: d.description || null,
      price: d.price,
      billing_unit: d.billing_unit,
      included_hours: d.included_hours === "" ? null : Number(d.included_hours),
      is_active: d.is_active,
    })
    .eq("id", id)
    .eq("org_id", org.id);
  if (error) return { error: "No se pudo actualizar la membresía." };

  revalidatePath("/members");
  return { ok: true };
}

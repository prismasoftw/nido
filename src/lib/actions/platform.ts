"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { isPlatformAdmin, requireUser } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { PLAN_CATALOG } from "@/lib/plans";
import type { PlanFeatures } from "@/lib/supabase/types";

export type PlatformActionState = {
  ok?: boolean;
  error?: string;
  message?: string;
} | null;

async function requireAdmin(): Promise<string | null> {
  await requireUser();
  if (!(await isPlatformAdmin())) return "No autorizado.";
  return null;
}

const changePlanSchema = z.object({
  org_id: z.string().uuid("Coworking inválido."),
  plan: z.enum(["free", "lite", "premium"]),
});

/** Platform-admin: manually move a coworking to a different plan. */
export async function changeOrgPlanAction(
  _prev: PlatformActionState,
  formData: FormData,
): Promise<PlatformActionState> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

  const parsed = changePlanSchema.safeParse({
    org_id: formData.get("org_id"),
    plan: formData.get("plan"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const { org_id, plan } = parsed.data;

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("organizations")
    .update({ plan })
    .eq("id", org_id);
  if (error) return { error: "No se pudo cambiar el plan." };

  // Keep any subscription row in sync so the org's settings page agrees.
  await supabase
    .from("subscriptions")
    .update({ plan_code: plan })
    .eq("org_id", org_id);

  revalidatePath(`/admin/orgs/${org_id}`);
  revalidatePath("/admin");
  return { ok: true, message: `Plan actualizado a ${PLAN_CATALOG[plan].name}.` };
}

const limitField = z.coerce
  .number()
  .int()
  .min(-1, "Usa -1 para ilimitado.")
  .max(1_000_000);

const updatePlanSchema = z.object({
  code: z.enum(["free", "lite", "premium"]),
  name: z.string().trim().min(1, "El nombre es obligatorio.").max(60),
  description: z.string().trim().max(200).optional().default(""),
  price_mxn: z.coerce.number().int().min(0).max(1_000_000),
  // Stored as basis points; the form sends a percentage (e.g. 5 = 5%).
  commission_pct: z.coerce.number().min(0).max(100),
  limit_locations: limitField,
  limit_resources: limitField,
  limit_members: limitField,
  limit_staff: limitField,
  limit_bookings_per_month: limitField,
});

const FEATURE_KEYS = [
  "online_payments",
  "public_portal",
  "qr_checkin",
  "email_notifications",
  "recurring_bookings",
  "advanced_analytics",
  "custom_branding",
  "multi_location",
  "api_access",
  "priority_support",
] as const;

/** Platform-admin: edit a plan's price, commission, limits and features. */
export async function updatePlanAction(
  _prev: PlatformActionState,
  formData: FormData,
): Promise<PlatformActionState> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

  const parsed = updatePlanSchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    price_mxn: formData.get("price_mxn"),
    commission_pct: formData.get("commission_pct"),
    limit_locations: formData.get("limit_locations"),
    limit_resources: formData.get("limit_resources"),
    limit_members: formData.get("limit_members"),
    limit_staff: formData.get("limit_staff"),
    limit_bookings_per_month: formData.get("limit_bookings_per_month"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const d = parsed.data;

  const features = FEATURE_KEYS.reduce(
    (acc, k) => {
      acc[k] = formData.get(`feature_${k}`) === "on";
      return acc;
    },
    {} as PlanFeatures,
  );

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("plans")
    .update({
      name: d.name,
      description: d.description || null,
      price_mxn: d.price_mxn,
      commission_bps: Math.round(d.commission_pct * 100),
      is_public: formData.get("is_public") === "true",
      limits: {
        locations: d.limit_locations,
        resources: d.limit_resources,
        members: d.limit_members,
        staff: d.limit_staff,
        bookings_per_month: d.limit_bookings_per_month,
      },
      features,
      updated_at: new Date().toISOString(),
    })
    .eq("code", d.code);
  if (error) return { error: "No se pudo guardar el plan." };

  revalidatePath("/admin/plans");
  revalidatePath("/"); // public pricing
  revalidatePath("/settings");
  return { ok: true, message: `Plan ${d.name} actualizado.` };
}

const suspendSchema = z.object({
  org_id: z.string().uuid("Coworking inválido."),
  suspend: z.enum(["true", "false"]),
});

/** Platform-admin: suspend or reactivate a coworking. */
export async function setOrgSuspendedAction(
  _prev: PlatformActionState,
  formData: FormData,
): Promise<PlatformActionState> {
  const denied = await requireAdmin();
  if (denied) return { error: denied };

  const parsed = suspendSchema.safeParse({
    org_id: formData.get("org_id"),
    suspend: formData.get("suspend"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const { org_id, suspend } = parsed.data;
  const suspending = suspend === "true";

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("organizations")
    .update({ suspended_at: suspending ? new Date().toISOString() : null })
    .eq("id", org_id);
  if (error) return { error: "No se pudo actualizar el estado." };

  revalidatePath(`/admin/orgs/${org_id}`);
  revalidatePath("/admin");
  return {
    ok: true,
    message: suspending ? "Coworking suspendido." : "Coworking reactivado.",
  };
}

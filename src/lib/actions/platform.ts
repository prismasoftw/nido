"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { isPlatformAdmin, requireUser } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { PLAN_CATALOG } from "@/lib/plans";

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

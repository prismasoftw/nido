"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireOrg } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getPlanCatalog } from "@/lib/plans-server";

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

const orgSchema = z.object({
  name: z.string().trim().min(2, "Escribe un nombre.").max(160),
  timezone: z.string().trim().min(1).default("America/Mexico_City"),
  brand_color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color inválido.")
    .optional()
    .or(z.literal("")),
});

export async function updateOrgSettingsAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { org, role } = await requireOrg();
  if (role !== "owner" && role !== "admin") {
    return { error: "No tienes permisos para editar la organización." };
  }

  const parsed = orgSchema.safeParse({
    name: formData.get("name"),
    timezone: formData.get("timezone") || "America/Mexico_City",
    brand_color: formData.get("brand_color"),
  });
  if (!parsed.success) return { fieldErrors: flatten(parsed.error) };

  // Gate: custom_branding is a paid-tier feature.
  const catalog = await getPlanCatalog();
  const canBrand = catalog[org.plan].features.custom_branding;

  const updateData: {
    name: string;
    timezone: string;
    brand_color?: string | null;
  } = {
    name: parsed.data.name,
    timezone: parsed.data.timezone,
  };

  if (canBrand) {
    updateData.brand_color = parsed.data.brand_color || null;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update(updateData)
    .eq("id", org.id);
  if (error) return { error: "No se pudo guardar la configuración." };

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireOrg } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PLAN_CATALOG } from "@/lib/plans";
import type { ResourceKind } from "@/lib/supabase/types";

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

function requireAdmin(role: string): FormState | null {
  if (role !== "owner" && role !== "admin") {
    return { error: "No tienes permisos para esta acción." };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Locations
// ---------------------------------------------------------------------------
const locationSchema = z.object({
  name: z.string().trim().min(2, "Escribe un nombre.").max(120),
  address: z.string().trim().max(240).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  timezone: z.string().trim().min(1).default("America/Mexico_City"),
});

export async function createLocationAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { org, role } = await requireOrg();
  const denied = requireAdmin(role);
  if (denied) return denied;

  const parsed = locationSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
    city: formData.get("city"),
    timezone: formData.get("timezone") || "America/Mexico_City",
  });
  if (!parsed.success) return { fieldErrors: flatten(parsed.error) };

  const supabase = await createClient();

  // Plan limit enforcement.
  const { count } = await supabase
    .from("locations")
    .select("id", { count: "exact", head: true })
    .eq("org_id", org.id);

  const limit = PLAN_CATALOG[org.plan].limits.locations;
  if (limit !== -1 && (count ?? 0) >= limit) {
    return {
      error: `Tu plan permite ${limit} sede(s). Mejora tu plan para agregar más.`,
    };
  }

  const { error } = await supabase.from("locations").insert({
    org_id: org.id,
    name: parsed.data.name,
    address: parsed.data.address || null,
    city: parsed.data.city || null,
    timezone: parsed.data.timezone,
  });
  if (error) return { error: "No se pudo crear la sede." };

  revalidatePath("/spaces");
  return { ok: true };
}

export async function updateLocationAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { org, role } = await requireOrg();
  const denied = requireAdmin(role);
  if (denied) return denied;

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Sede no encontrada." };

  const parsed = locationSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
    city: formData.get("city"),
    timezone: formData.get("timezone") || "America/Mexico_City",
  });
  if (!parsed.success) return { fieldErrors: flatten(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("locations")
    .update({
      name: parsed.data.name,
      address: parsed.data.address || null,
      city: parsed.data.city || null,
      timezone: parsed.data.timezone,
      is_active: formData.get("is_active") === "on",
    })
    .eq("id", id)
    .eq("org_id", org.id);
  if (error) return { error: "No se pudo actualizar la sede." };

  revalidatePath("/spaces");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------
const RESOURCE_KINDS: readonly ResourceKind[] = [
  "private_office",
  "dedicated_desk",
  "hot_desk",
  "meeting_room",
  "event_space",
  "locker",
];

const priceField = z.coerce.number().int().min(0).max(10_000_000).optional();

const resourceSchema = z
  .object({
    location_id: z.string().uuid("Selecciona una sede."),
    name: z.string().trim().min(2, "Escribe un nombre.").max(120),
    kind: z.enum(RESOURCE_KINDS as [ResourceKind, ...ResourceKind[]]),
    description: z.string().trim().max(500).optional().or(z.literal("")),
    capacity: z.coerce.number().int().min(1, "Mínimo 1.").max(10_000),
    price_hour: priceField,
    price_day: priceField,
    price_week: priceField,
    price_month: priceField,
    min_minutes: z.coerce.number().int().min(1).max(100_000).default(30),
    buffer_minutes: z.coerce.number().int().min(0).max(100_000).default(0),
    requires_approval: z.boolean().default(false),
  })
  .refine(
    (d) =>
      [d.price_hour, d.price_day, d.price_week, d.price_month].some(
        (p) => (p ?? 0) > 0,
      ),
    { message: "Define al menos una tarifa.", path: ["price_hour"] },
  );

function parseResource(formData: FormData) {
  const num = (k: string) => {
    const v = formData.get(k);
    return v === null || v === "" ? undefined : v;
  };
  return resourceSchema.safeParse({
    location_id: formData.get("location_id"),
    name: formData.get("name"),
    kind: formData.get("kind"),
    description: formData.get("description"),
    capacity: formData.get("capacity") || 1,
    price_hour: num("price_hour"),
    price_day: num("price_day"),
    price_week: num("price_week"),
    price_month: num("price_month"),
    min_minutes: formData.get("min_minutes") || 30,
    buffer_minutes: formData.get("buffer_minutes") || 0,
    requires_approval: formData.get("requires_approval") === "on",
  });
}

export async function createResourceAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { org, role } = await requireOrg();
  const denied = requireAdmin(role);
  if (denied) return denied;

  const parsed = parseResource(formData);
  if (!parsed.success) return { fieldErrors: flatten(parsed.error) };

  const supabase = await createClient();

  // Verify the location belongs to this org.
  const { data: loc } = await supabase
    .from("locations")
    .select("id")
    .eq("id", parsed.data.location_id)
    .eq("org_id", org.id)
    .maybeSingle();
  if (!loc) return { error: "Sede inválida." };

  // Plan limit enforcement.
  const { count } = await supabase
    .from("resources")
    .select("id", { count: "exact", head: true })
    .eq("org_id", org.id);

  const limit = PLAN_CATALOG[org.plan].limits.resources;
  if (limit !== -1 && (count ?? 0) >= limit) {
    return {
      error: `Tu plan permite ${limit} espacio(s). Mejora tu plan para agregar más.`,
    };
  }

  const d = parsed.data;
  const { error } = await supabase.from("resources").insert({
    org_id: org.id,
    location_id: d.location_id,
    name: d.name,
    kind: d.kind,
    description: d.description || null,
    capacity: d.capacity,
    price_hour: d.price_hour ?? null,
    price_day: d.price_day ?? null,
    price_week: d.price_week ?? null,
    price_month: d.price_month ?? null,
    min_minutes: d.min_minutes,
    buffer_minutes: d.buffer_minutes,
    requires_approval: d.requires_approval,
  });
  if (error) return { error: "No se pudo crear el espacio." };

  revalidatePath("/spaces");
  return { ok: true };
}

export async function updateResourceAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { org, role } = await requireOrg();
  const denied = requireAdmin(role);
  if (denied) return denied;

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Espacio no encontrado." };

  const parsed = parseResource(formData);
  if (!parsed.success) return { fieldErrors: flatten(parsed.error) };

  const supabase = await createClient();
  const d = parsed.data;
  const { error } = await supabase
    .from("resources")
    .update({
      location_id: d.location_id,
      name: d.name,
      kind: d.kind,
      description: d.description || null,
      capacity: d.capacity,
      price_hour: d.price_hour ?? null,
      price_day: d.price_day ?? null,
      price_week: d.price_week ?? null,
      price_month: d.price_month ?? null,
      min_minutes: d.min_minutes,
      buffer_minutes: d.buffer_minutes,
      requires_approval: d.requires_approval,
      is_active: formData.get("is_active") === "on",
    })
    .eq("id", id)
    .eq("org_id", org.id);
  if (error) return { error: "No se pudo actualizar el espacio." };

  revalidatePath("/spaces");
  return { ok: true };
}

export async function deleteResourceAction(formData: FormData): Promise<void> {
  const { org, role } = await requireOrg();
  if (role !== "owner" && role !== "admin") return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("resources").delete().eq("id", id).eq("org_id", org.id);
  revalidatePath("/spaces");
}

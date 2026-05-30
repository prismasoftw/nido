"use server";

import { fromZonedTime } from "date-fns-tz";
import { z } from "zod";

import { createServiceClient } from "@/lib/supabase/server";
import { PLAN_CATALOG } from "@/lib/plans";
import type { BookingStatus, PlanCode } from "@/lib/supabase/types";

export type PortalState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: boolean;
  message?: string;
} | null;

function flatten(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

const schema = z.object({
  slug: z.string().trim().min(1),
  resource_id: z.string().uuid(),
  guest_name: z.string().trim().min(2, "Escribe tu nombre.").max(120),
  guest_email: z.string().trim().email("Correo inválido."),
  guest_phone: z.string().trim().max(40).optional().or(z.literal("")),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida."),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida."),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida."),
});

export async function createPortalBookingAction(
  _prev: PortalState,
  formData: FormData,
): Promise<PortalState> {
  const parsed = schema.safeParse({
    slug: formData.get("slug"),
    resource_id: formData.get("resource_id"),
    guest_name: formData.get("guest_name"),
    guest_email: formData.get("guest_email"),
    guest_phone: formData.get("guest_phone"),
    date: formData.get("date"),
    start_time: formData.get("start_time"),
    end_time: formData.get("end_time"),
  });
  if (!parsed.success) return { fieldErrors: flatten(parsed.error) };
  const d = parsed.data;

  const supabase = createServiceClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, plan, currency, timezone")
    .eq("slug", d.slug)
    .maybeSingle();
  if (!org) return { error: "Coworking no encontrado." };
  const o = org as { id: string; plan: PlanCode; currency: string; timezone: string };

  const { data: resource } = await supabase
    .from("resources")
    .select("id, location_id, requires_approval, price_hour, locations(timezone)")
    .eq("id", d.resource_id)
    .eq("org_id", o.id)
    .eq("is_active", true)
    .maybeSingle();
  if (!resource) return { error: "Espacio no disponible." };
  const r = resource as unknown as {
    location_id: string;
    requires_approval: boolean;
    price_hour: number | null;
    locations: { timezone: string } | null;
  };

  const tz = r.locations?.timezone ?? o.timezone;
  const startsAt = fromZonedTime(`${d.date}T${d.start_time}:00`, tz);
  const endsAt = fromZonedTime(`${d.date}T${d.end_time}:00`, tz);
  if (endsAt <= startsAt) {
    return { fieldErrors: { end_time: "Debe terminar después de iniciar." } };
  }
  if (startsAt.getTime() < Date.now()) {
    return { error: "Elige un horario en el futuro." };
  }
  const startIso = startsAt.toISOString();
  const endIso = endsAt.toISOString();

  const limit = PLAN_CATALOG[o.plan].limits.bookings_per_month;
  if (limit !== -1) {
    const { data: usage } = await supabase.rpc("org_usage", { p_org: o.id });
    const used = Number(
      (usage as Record<string, unknown> | null)?.bookings_this_month ?? 0,
    );
    if (used >= limit) {
      return { error: "Este coworking alcanzó su límite de reservas del mes." };
    }
  }

  const { data: available } = await supabase.rpc("is_resource_available", {
    p_resource: d.resource_id,
    p_start: startIso,
    p_end: endIso,
  });
  if (available === false) {
    return { error: "Ese horario ya está ocupado. Prueba con otro." };
  }

  const hours = (endsAt.getTime() - startsAt.getTime()) / 3_600_000;
  const price = r.price_hour ? Math.round(r.price_hour * hours) : 0;
  const status: BookingStatus = r.requires_approval ? "pending" : "confirmed";

  const { error } = await supabase.from("bookings").insert({
    org_id: o.id,
    location_id: r.location_id,
    resource_id: d.resource_id,
    guest_name: d.guest_name,
    guest_email: d.guest_email,
    guest_phone: d.guest_phone || null,
    starts_at: startIso,
    ends_at: endIso,
    status,
    price,
    currency: o.currency,
    source: "portal",
  });
  if (error) {
    if (error.code === "23P01") {
      return { error: "Ese horario ya está ocupado. Prueba con otro." };
    }
    return { error: "No se pudo crear la reserva. Inténtalo de nuevo." };
  }

  return {
    ok: true,
    message: r.requires_approval
      ? "¡Listo! Tu solicitud quedó pendiente de confirmación. Te contactaremos por correo."
      : "¡Reserva confirmada! Te enviamos los detalles por correo.",
  };
}

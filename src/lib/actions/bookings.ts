"use server";

import { revalidatePath } from "next/cache";
import { fromZonedTime } from "date-fns-tz";
import { z } from "zod";

import { requireOrg } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notifyBookingCreated } from "@/lib/email";
import { getPlanCatalog } from "@/lib/plans-server";
import type { BookingStatus } from "@/lib/supabase/types";

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

const bookingSchema = z
  .object({
    resource_id: z.string().uuid("Selecciona un espacio."),
    member_id: z.string().uuid().optional().or(z.literal("")),
    guest_name: z.string().trim().max(120).optional().or(z.literal("")),
    guest_email: z
      .string()
      .trim()
      .email("Correo inválido.")
      .optional()
      .or(z.literal("")),
    guest_phone: z.string().trim().max(40).optional().or(z.literal("")),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida."),
    start_time: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida."),
    end_time: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida."),
    title: z.string().trim().max(160).optional().or(z.literal("")),
    notes: z.string().trim().max(1000).optional().or(z.literal("")),
    price: z.coerce.number().int().min(0).max(10_000_000).optional(),
  })
  .refine((d) => d.member_id || d.guest_name, {
    message: "Elige un miembro o escribe el nombre del invitado.",
    path: ["guest_name"],
  });

export async function createBookingAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { org } = await requireOrg();

  const parsed = bookingSchema.safeParse({
    resource_id: formData.get("resource_id"),
    member_id: formData.get("member_id"),
    guest_name: formData.get("guest_name"),
    guest_email: formData.get("guest_email"),
    guest_phone: formData.get("guest_phone"),
    date: formData.get("date"),
    start_time: formData.get("start_time"),
    end_time: formData.get("end_time"),
    title: formData.get("title"),
    notes: formData.get("notes"),
    price: formData.get("price") || undefined,
  });
  if (!parsed.success) return { fieldErrors: flatten(parsed.error) };
  const d = parsed.data;

  const supabase = await createClient();

  // Resource + its location (for timezone and org check).
  const { data: resource } = await supabase
    .from("resources")
    .select("id, name, org_id, location_id, requires_approval, price_hour, locations(timezone)")
    .eq("id", d.resource_id)
    .eq("org_id", org.id)
    .maybeSingle();
  if (!resource) return { error: "Espacio inválido." };

  const tz =
    (resource as unknown as { locations: { timezone: string } | null })
      .locations?.timezone ?? org.timezone;

  const startsAt = fromZonedTime(`${d.date}T${d.start_time}:00`, tz);
  const endsAt = fromZonedTime(`${d.date}T${d.end_time}:00`, tz);
  if (endsAt <= startsAt) {
    return { fieldErrors: { end_time: "Debe terminar después de iniciar." } };
  }
  const startIso = startsAt.toISOString();
  const endIso = endsAt.toISOString();

  // Monthly booking limit per plan.
  const catalog = await getPlanCatalog();
  const limit = catalog[org.plan].limits.bookings_per_month;
  if (limit !== -1) {
    const { data: usage } = await supabase.rpc("org_usage", { p_org: org.id });
    const used = Number(
      (usage as Record<string, unknown> | null)?.bookings_this_month ?? 0,
    );
    if (used >= limit) {
      return {
        error: `Tu plan permite ${limit} reservas al mes. Mejora tu plan para crear más.`,
      };
    }
  }

  // Availability pre-flight (GiST constraint is the hard backstop).
  const { data: available } = await supabase.rpc("is_resource_available", {
    p_resource: d.resource_id,
    p_start: startIso,
    p_end: endIso,
  });
  if (available === false) {
    return { error: "Ese horario ya está ocupado en este espacio." };
  }

  const hours = (endsAt.getTime() - startsAt.getTime()) / 3_600_000;
  const priceHour = (resource as unknown as { price_hour: number | null })
    .price_hour;
  const price =
    d.price ?? (priceHour ? Math.round(priceHour * hours) : 0);

  const status: BookingStatus = (
    resource as unknown as { requires_approval: boolean }
  ).requires_approval
    ? "pending"
    : "confirmed";

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("bookings").insert({
    org_id: org.id,
    location_id: (resource as unknown as { location_id: string }).location_id,
    resource_id: d.resource_id,
    member_id: d.member_id || null,
    guest_name: d.member_id ? null : d.guest_name || null,
    guest_email: d.member_id ? null : d.guest_email || null,
    guest_phone: d.member_id ? null : d.guest_phone || null,
    starts_at: startIso,
    ends_at: endIso,
    status,
    price,
    currency: org.currency,
    title: d.title || null,
    notes: d.notes || null,
    source: "admin",
    created_by: user?.id ?? null,
  });
  if (error) {
    if (error.code === "23P01") {
      return { error: "Ese horario ya está ocupado en este espacio." };
    }
    return { error: "No se pudo crear la reserva." };
  }

  // Best-effort guest notification (gated by plan feature).
  const guestEmail = d.member_id ? null : d.guest_email || null;
  if (guestEmail && catalog[org.plan].features.email_notifications) {
    await notifyBookingCreated({
      to: guestEmail,
      guestName: d.guest_name || "Invitado",
      orgName: org.name,
      resourceName: (resource as unknown as { name: string }).name,
      startsAt: startIso,
      endsAt: endIso,
      timezone: tz,
      status: status as "pending" | "confirmed",
    });
  }

  revalidatePath("/bookings");
  return { ok: true };
}

const TRANSITIONS: Record<string, BookingStatus> = {
  confirm: "confirmed",
  check_in: "checked_in",
  complete: "completed",
  cancel: "cancelled",
  no_show: "no_show",
};

export async function updateBookingStatusAction(
  formData: FormData,
): Promise<void> {
  const { org } = await requireOrg();
  const id = String(formData.get("id") ?? "");
  const op = String(formData.get("op") ?? "");
  const next = TRANSITIONS[op];
  if (!id || !next) return;

  const supabase = await createClient();
  const patch: { status: BookingStatus; cancelled_at?: string } = {
    status: next,
  };
  if (next === "cancelled") patch.cancelled_at = new Date().toISOString();

  await supabase
    .from("bookings")
    .update(patch)
    .eq("id", id)
    .eq("org_id", org.id);

  revalidatePath("/bookings");
}

"use server";

import { headers } from "next/headers";

import { fromZonedTime } from "date-fns-tz";
import { z } from "zod";

import { createServiceClient } from "@/lib/supabase/server";
import { notifyBookingCreated } from "@/lib/email";
import { PLAN_CATALOG } from "@/lib/plans";
import { createBookingPreference, mpConfigured } from "@/lib/mercadopago";
import type { BookingStatus, PlanCode } from "@/lib/supabase/types";

export type PortalState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: boolean;
  message?: string;
  redirectUrl?: string;
} | null;

/** Best-effort absolute origin for back/notification URLs. */
async function requestOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : "";
}

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
    .select("id, name, plan, currency, timezone")
    .eq("slug", d.slug)
    .maybeSingle();
  if (!org) return { error: "Coworking no encontrado." };
  const o = org as {
    id: string;
    name: string;
    plan: PlanCode;
    currency: string;
    timezone: string;
  };

  const { data: resource } = await supabase
    .from("resources")
    .select("id, name, location_id, requires_approval, price_hour, locations(timezone)")
    .eq("id", d.resource_id)
    .eq("org_id", o.id)
    .eq("is_active", true)
    .maybeSingle();
  if (!resource) return { error: "Espacio no disponible." };
  const r = resource as unknown as {
    name: string;
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

  const plan = PLAN_CATALOG[o.plan];
  // Online payment kicks in only when the plan allows it, MP is configured and
  // there's an actual amount to charge. Otherwise the booking is free / manual.
  const needsPayment = mpConfigured() && plan.features.online_payments && price > 0;
  // Paid bookings stay pending until the webhook confirms the payment.
  const status: BookingStatus =
    needsPayment || r.requires_approval ? "pending" : "confirmed";

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
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
    })
    .select("id")
    .single();
  if (error || !booking) {
    if (error?.code === "23P01") {
      return { error: "Ese horario ya está ocupado. Prueba con otro." };
    }
    return { error: "No se pudo crear la reserva. Inténtalo de nuevo." };
  }
  const bookingId = (booking as { id: string }).id;

  if (needsPayment) {
    const { data: payment, error: payErr } = await supabase
      .from("payments")
      .insert({
        org_id: o.id,
        booking_id: bookingId,
        kind: "booking",
        amount: price,
        currency: o.currency,
        status: "pending",
        provider: "mercadopago",
        metadata: {
          slug: d.slug,
          plan: o.plan,
          commission_bps: plan.commission_bps,
          guest_email: d.guest_email,
          resource_name: r.name,
          timezone: tz,
        },
      })
      .select("id")
      .single();
    if (payErr || !payment) {
      return { error: "No se pudo iniciar el pago. Inténtalo de nuevo." };
    }
    const paymentId = (payment as { id: string }).id;

    const origin = await requestOrigin();
    const back = (s: string) => `${origin}/p/${d.slug}/gracias?status=${s}`;
    try {
      const pref = await createBookingPreference({
        title: `${r.name} · ${o.name}`,
        amount: price,
        currency: o.currency,
        externalReference: paymentId,
        payerEmail: d.guest_email,
        successUrl: back("approved"),
        failureUrl: back("failure"),
        pendingUrl: back("pending"),
        notificationUrl: `${origin}/api/mp/webhook`,
      });
      if (!pref.initPoint) throw new Error("No init_point");
      await supabase
        .from("payments")
        .update({ provider_preference_id: pref.id })
        .eq("id", paymentId);
      return { ok: true, redirectUrl: pref.initPoint };
    } catch {
      return { error: "No se pudo conectar con Mercado Pago. Inténtalo de nuevo." };
    }
  }

  if (plan.features.email_notifications) {
    await notifyBookingCreated({
      to: d.guest_email,
      guestName: d.guest_name,
      orgName: o.name,
      resourceName: r.name,
      startsAt: startIso,
      endsAt: endIso,
      timezone: tz,
      status: status as "pending" | "confirmed",
    });
  }

  return {
    ok: true,
    message: r.requires_approval
      ? "¡Listo! Tu solicitud quedó pendiente de confirmación. Te contactaremos por correo."
      : "¡Reserva confirmada! Te enviamos los detalles por correo.",
  };
}

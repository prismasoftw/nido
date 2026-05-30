"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";

import {
  createPortalBookingAction,
  payBookingAction,
  type PortalPaymentIntent,
  type PortalState,
} from "@/lib/actions/portal";
import { formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CardBrick, type BrickCardData } from "@/components/payments/card-brick";

type PayPhase = "approved" | "in_process";

export function PortalBookingForm({
  slug,
  resourceId,
  today,
  accent,
}: {
  slug: string;
  resourceId: string;
  today: string;
  accent: string;
}) {
  const [state, action, pending] = useActionState<PortalState, FormData>(
    createPortalBookingAction,
    null,
  );
  const [payPhase, setPayPhase] = useState<PayPhase | null>(null);

  // Paid bookings: the action returns a payment intent and we collect the card
  // in-page with Mercado Pago's brick (no redirect).
  const intent: PortalPaymentIntent | undefined = state?.payment;

  if (payPhase) {
    const isApproved = payPhase === "approved";
    const Icon = isApproved ? CheckCircle2 : Clock;
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center">
        <Icon
          className="size-10"
          style={{ color: isApproved ? accent : "#d97706" }}
        />
        <p className="font-medium">
          {isApproved
            ? "¡Pago confirmado! Tu reserva quedó lista y te enviamos los detalles por correo."
            : "Estamos validando tu pago. En cuanto se acredite, confirmaremos tu reserva por correo."}
        </p>
      </div>
    );
  }

  if (intent) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-xl border p-4">
          <div>
            <p className="text-sm font-medium">{intent.description}</p>
            <p className="text-muted-foreground text-xs">Pago seguro con tarjeta</p>
          </div>
          <span className="font-heading text-xl font-semibold">
            {formatMoney(intent.amount)}
          </span>
        </div>
        <CardBrick
          amount={intent.amount}
          payerEmail={intent.payerEmail}
          onPay={async (data: BrickCardData) => {
            const res = await payBookingAction({
              paymentId: intent.paymentId,
              token: data.token,
              paymentMethodId: data.paymentMethodId,
              issuerId: data.issuerId,
              installments: data.installments,
              payerEmail: data.payerEmail,
            });
            if (res.status === "approved" || res.status === "in_process") {
              setPayPhase(res.status);
              return { ok: true };
            }
            return { ok: false, error: res.error };
          }}
        />
      </div>
    );
  }

  // Free / approval-only bookings finish straight away.
  if (state?.ok && state.message) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-8 text-center">
        <CheckCircle2 className="size-10" style={{ color: accent }} />
        <p className="font-medium">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="resource_id" value={resourceId} />

      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="p-date">Fecha</Label>
          <Input id="p-date" name="date" type="date" defaultValue={today} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-start">Desde</Label>
          <Input
            id="p-start"
            name="start_time"
            type="time"
            defaultValue="09:00"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-end">Hasta</Label>
          <Input
            id="p-end"
            name="end_time"
            type="time"
            defaultValue="10:00"
            required
          />
        </div>
      </div>
      {state?.fieldErrors?.end_time && (
        <p className="text-destructive text-xs">{state.fieldErrors.end_time}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="p-name">Nombre</Label>
          <Input
            id="p-name"
            name="guest_name"
            placeholder="Tu nombre"
            required
          />
          {state?.fieldErrors?.guest_name && (
            <p className="text-destructive text-xs">
              {state.fieldErrors.guest_name}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-email">Correo</Label>
          <Input
            id="p-email"
            name="guest_email"
            type="email"
            placeholder="tu@correo.com"
            required
          />
          {state?.fieldErrors?.guest_email && (
            <p className="text-destructive text-xs">
              {state.fieldErrors.guest_email}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="p-phone">Teléfono (opcional)</Label>
        <Input id="p-phone" name="guest_phone" placeholder="55 1234 5678" />
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="w-full text-white"
        style={{ backgroundColor: accent }}
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        Reservar
      </Button>
    </form>
  );
}

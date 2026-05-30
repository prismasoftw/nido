"use client";

import { useEffect, useState } from "react";
import { CardPayment, initMercadoPago } from "@mercadopago/sdk-react";
import { Loader2 } from "lucide-react";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;

let mpInitialized = false;

export type BrickCardData = {
  token: string;
  paymentMethodId: string;
  issuerId?: string;
  installments: number;
  payerEmail?: string;
};

/** Result the parent returns from onPay so the brick can surface MP's error UI
 *  when the charge is rejected. */
export type BrickPayResult = { ok: boolean; error?: string };

/**
 * Mercado Pago Card Payment Brick, embedded in-page. Card data is tokenized in
 * the browser by MP.js and never touches our server. `onPay` receives the token
 * and forwards it to a server action that creates the actual charge.
 */
export function CardBrick({
  amount,
  payerEmail,
  onPay,
}: {
  amount: number;
  payerEmail?: string;
  onPay: (data: BrickCardData) => Promise<BrickPayResult>;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (PUBLIC_KEY && !mpInitialized) {
      initMercadoPago(PUBLIC_KEY, { locale: "es-MX" });
      mpInitialized = true;
    }
  }, []);

  if (!PUBLIC_KEY) {
    return (
      <p className="text-destructive text-sm">
        Los pagos con tarjeta no están disponibles por el momento.
      </p>
    );
  }

  return (
    <div className="relative">
      {!ready && (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Cargando formulario de pago…
        </div>
      )}
      <CardPayment
        initialization={{
          amount,
          payer: payerEmail ? { email: payerEmail } : undefined,
        }}
        locale="es-MX"
        onReady={() => setReady(true)}
        onSubmit={async (formData) => {
          const res = await onPay({
            token: formData.token,
            paymentMethodId: formData.payment_method_id,
            issuerId: formData.issuer_id,
            installments: formData.installments,
            payerEmail: formData.payer?.email ?? payerEmail,
          });
          // Throwing keeps the brick mounted and shows its inline error state.
          if (!res.ok) throw new Error(res.error ?? "Pago rechazado");
        }}
      />
    </div>
  );
}

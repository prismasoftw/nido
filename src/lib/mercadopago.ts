import "server-only";

import { MercadoPagoConfig, Payment, PreApproval, Preference } from "mercadopago";

/** True when the platform Mercado Pago access token is configured. */
export function mpConfigured() {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);
}

function client() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) throw new Error("MERCADOPAGO_ACCESS_TOKEN is not set");
  return new MercadoPagoConfig({ accessToken });
}

export type BookingPreferenceInput = {
  title: string;
  amount: number; // whole pesos
  currency: string; // "MXN"
  externalReference: string; // our payment id
  payerEmail?: string;
  successUrl: string;
  failureUrl: string;
  pendingUrl: string;
  notificationUrl: string;
};

/** Creates a Checkout Pro preference and returns the redirect URL + id. */
export async function createBookingPreference(input: BookingPreferenceInput) {
  const preference = new Preference(client());
  const res = await preference.create({
    body: {
      items: [
        {
          id: input.externalReference,
          title: input.title,
          quantity: 1,
          unit_price: input.amount,
          currency_id: input.currency,
        },
      ],
      external_reference: input.externalReference,
      payer: input.payerEmail ? { email: input.payerEmail } : undefined,
      back_urls: {
        success: input.successUrl,
        failure: input.failureUrl,
        pending: input.pendingUrl,
      },
      auto_return: "approved",
      notification_url: input.notificationUrl,
    },
  });

  return {
    id: res.id ?? null,
    initPoint: res.init_point ?? res.sandbox_init_point ?? null,
  };
}

/** Fetches a payment from Mercado Pago by its id. */
export async function getMpPayment(id: string) {
  const payment = new Payment(client());
  return payment.get({ id });
}

export type PlanPreapprovalInput = {
  reason: string; // shown to the payer, e.g. "Espazio · Plan Lite"
  amount: number; // monthly price in whole pesos
  currency: string; // "MXN"
  payerEmail: string;
  externalReference: string; // `${orgId}:${planCode}`
  backUrl: string;
};

/** Creates a monthly subscription (preapproval) and returns its checkout URL. */
export async function createPlanPreapproval(input: PlanPreapprovalInput) {
  const preapproval = new PreApproval(client());
  const res = await preapproval.create({
    body: {
      reason: input.reason,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: input.amount,
        currency_id: input.currency,
      },
      payer_email: input.payerEmail,
      external_reference: input.externalReference,
      back_url: input.backUrl,
      status: "pending",
    },
  });

  return {
    id: res.id ?? null,
    initPoint: res.init_point ?? null,
    payerId: res.payer_id ?? null,
    status: res.status ?? null,
  };
}

/** Fetches a subscription (preapproval) from Mercado Pago by its id. */
export async function getMpPreapproval(id: string) {
  const preapproval = new PreApproval(client());
  return preapproval.get({ id });
}

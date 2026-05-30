import "server-only";

import { MercadoPagoConfig, Payment, PreApproval } from "mercadopago";

/** True when the platform Mercado Pago access token is configured. */
export function mpConfigured() {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);
}

function client() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) throw new Error("MERCADOPAGO_ACCESS_TOKEN is not set");
  return new MercadoPagoConfig({ accessToken });
}

export type CardPaymentInput = {
  amount: number; // whole pesos
  token: string; // card token created client-side by MP.js
  paymentMethodId: string; // e.g. "visa", "master"
  issuerId?: string; // card issuer id (string from the brick)
  installments: number;
  payerEmail: string;
  externalReference: string; // our payment id
  description: string;
  notificationUrl: string;
};

/** Charges a card on the platform account using a token tokenized in the
 *  browser (transparent checkout). The card data never touches our server. */
export async function createCardPayment(input: CardPaymentInput) {
  const payment = new Payment(client());
  const res = await payment.create({
    body: {
      transaction_amount: input.amount,
      token: input.token,
      payment_method_id: input.paymentMethodId,
      issuer_id: input.issuerId ? Number(input.issuerId) : undefined,
      installments: input.installments,
      description: input.description,
      external_reference: input.externalReference,
      notification_url: input.notificationUrl,
      payer: { email: input.payerEmail },
    },
  });

  return {
    id: res.id ?? null,
    status: res.status ?? null,
    statusDetail: res.status_detail ?? null,
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
  cardTokenId: string; // card token tokenized in the browser
};

/** Creates an authorized monthly subscription (preapproval) charged directly
 *  to a card token tokenized in the browser — no redirect to Mercado Pago. */
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
      card_token_id: input.cardTokenId,
      external_reference: input.externalReference,
      back_url: input.backUrl,
      status: "authorized",
    },
  });

  return {
    id: res.id ?? null,
    payerId: res.payer_id ?? null,
    status: res.status ?? null,
  };
}

/** Fetches a subscription (preapproval) from Mercado Pago by its id. */
export async function getMpPreapproval(id: string) {
  const preapproval = new PreApproval(client());
  return preapproval.get({ id });
}

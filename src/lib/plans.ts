import type { Plan, PlanCode, PlanFeatures, PlanLimits } from "@/lib/supabase/types";

export const PLAN_ORDER: PlanCode[] = ["free", "lite", "premium"];

/** Shape of a plan as the app consumes it (catalog entry). */
export type PlanInfo = Pick<
  Plan,
  | "code"
  | "name"
  | "description"
  | "price_mxn"
  | "limits"
  | "features"
  | "commission_bps"
>;

/** Static catalog mirroring the seed in 20260529000003_plans.sql. Used as the
 *  fallback/default; the live values come from the `plans` table via
 *  getPlanCatalog() so a platform admin can edit prices, limits and features. */
export const PLAN_CATALOG: Record<PlanCode, PlanInfo> = {
  free: {
    code: "free",
    name: "Básico",
    description: "Para empezar a operar tu coworking con lo esencial.",
    price_mxn: 199,
    commission_bps: 600,
    limits: { locations: 1, resources: 3, members: 25, staff: 2, bookings_per_month: 50 },
    features: {
      online_payments: false,
      public_portal: true,
      qr_checkin: false,
      email_notifications: false,
      recurring_bookings: false,
      advanced_analytics: false,
      custom_branding: false,
      multi_location: false,
      api_access: false,
      priority_support: false,
    },
  },
  lite: {
    code: "lite",
    name: "Lite",
    description: "Para coworkings en crecimiento que cobran en línea.",
    price_mxn: 599,
    commission_bps: 390,
    limits: { locations: 2, resources: 25, members: 250, staff: 8, bookings_per_month: -1 },
    features: {
      online_payments: true,
      public_portal: true,
      qr_checkin: true,
      email_notifications: true,
      recurring_bookings: false,
      advanced_analytics: false,
      custom_branding: false,
      multi_location: true,
      api_access: false,
      priority_support: false,
    },
  },
  premium: {
    code: "premium",
    name: "Premium",
    description: "Operación completa, multi-sede y analítica avanzada.",
    price_mxn: 1399,
    commission_bps: 290,
    limits: { locations: -1, resources: -1, members: -1, staff: -1, bookings_per_month: -1 },
    features: {
      online_payments: true,
      public_portal: true,
      qr_checkin: true,
      email_notifications: true,
      recurring_bookings: true,
      advanced_analytics: true,
      custom_branding: true,
      multi_location: true,
      api_access: true,
      priority_support: true,
    },
  },
};

export const FEATURE_LABELS: Record<keyof PlanFeatures, string> = {
  online_payments: "Pagos en línea (Mercado Pago)",
  public_portal: "Portal público de reservas",
  qr_checkin: "Check-in con QR",
  email_notifications: "Notificaciones por correo",
  recurring_bookings: "Reservas recurrentes",
  advanced_analytics: "Analítica avanzada",
  custom_branding: "Marca personalizada",
  multi_location: "Múltiples sedes",
  api_access: "Acceso a API",
  priority_support: "Soporte prioritario",
};

export const LIMIT_LABELS: Record<keyof PlanLimits, string> = {
  locations: "Sedes",
  resources: "Espacios",
  members: "Miembros",
  staff: "Usuarios del equipo",
  bookings_per_month: "Reservas por mes",
};

export function formatLimit(value: number) {
  return value === -1 ? "Ilimitado" : String(value);
}

export function hasFeature(plan: Pick<Plan, "features">, feature: keyof PlanFeatures) {
  return Boolean(plan.features[feature]);
}

/** Commission Espazio charges on an online booking payment, in whole pesos. */
export function commissionFor(
  plan: Pick<Plan, "commission_bps">,
  amount: number,
) {
  return Math.round((amount * plan.commission_bps) / 10000);
}

/** Returns true if `current` usage is still within the plan limit. */
export function withinLimit(
  plan: Pick<Plan, "limits">,
  key: keyof PlanLimits,
  current: number,
) {
  const max = plan.limits[key];
  return max === -1 || current < max;
}

import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { PLAN_CATALOG, PLAN_ORDER } from "@/lib/plans";
import type { Plan, PlanCode } from "@/lib/supabase/types";

export type PlatformOrg = {
  id: string;
  name: string;
  slug: string;
  plan: PlanCode;
  currency: string;
  created_at: string;
  suspended_at: string | null;
  locations: number;
  resources: number;
  members: number;
  bookings_this_month: number;
};

export type PlatformStats = {
  totalOrgs: number;
  byPlan: Record<PlanCode, number>;
  mrr: number;
  bookingsThisMonth: number;
  newOrgsThisMonth: number;
};

function monthStartIso(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export async function getPlatformOrgs(): Promise<PlatformOrg[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("organizations")
    .select("id, name, slug, plan, currency, created_at, suspended_at")
    .order("created_at", { ascending: false });

  const orgs = (data ?? []) as Pick<
    PlatformOrg,
    "id" | "name" | "slug" | "plan" | "currency" | "created_at" | "suspended_at"
  >[];

  const usages = await Promise.all(
    orgs.map(async (o) => {
      const { data: usage } = await supabase.rpc("org_usage", { p_org: o.id });
      const u = (usage as Record<string, unknown> | null) ?? {};
      return {
        ...o,
        locations: Number(u.locations ?? 0),
        resources: Number(u.resources ?? 0),
        members: Number(u.members ?? 0),
        bookings_this_month: Number(u.bookings_this_month ?? 0),
      } satisfies PlatformOrg;
    }),
  );

  return usages;
}

export type GrowthPoint = { month: string; label: string; nuevos: number; total: number };

/** Monthly new-org counts plus running total for the last `months` months. */
export function getPlatformGrowth(
  orgs: Pick<PlatformOrg, "created_at">[],
  months = 6,
): GrowthPoint[] {
  const now = new Date();
  const buckets: GrowthPoint[] = [];
  const fmt = new Intl.DateTimeFormat("es-MX", { month: "short" });

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: fmt.format(d),
      nuevos: 0,
      total: 0,
    });
  }

  // Orgs created before the window count toward the starting cumulative total.
  const windowStart = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  let priorTotal = 0;
  for (const o of orgs) {
    const created = new Date(o.created_at);
    if (created < windowStart) {
      priorTotal += 1;
      continue;
    }
    const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}`;
    const bucket = buckets.find((b) => b.month === key);
    if (bucket) bucket.nuevos += 1;
  }

  let running = priorTotal;
  for (const b of buckets) {
    running += b.nuevos;
    b.total = running;
  }
  return buckets;
}

export type OrgLocation = {
  id: string;
  name: string;
  city: string | null;
  is_active: boolean;
};

export type OrgBookingRow = {
  id: string;
  starts_at: string;
  status: string;
  price: number;
  resource_name: string;
  guest: string;
};

export type OrgPaymentRow = {
  id: string;
  created_at: string;
  kind: string;
  amount: number;
  status: string;
};

export type PlatformOrgDetail = {
  id: string;
  name: string;
  slug: string;
  plan: PlanCode;
  currency: string;
  country: string;
  created_at: string;
  suspended_at: string | null;
  brand_color: string | null;
  logo_url: string | null;
  usage: {
    locations: number;
    resources: number;
    members: number;
    bookings_this_month: number;
  };
  walletBalance: number;
  subscription: {
    status: string;
    plan_code: PlanCode;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
  } | null;
  locations: OrgLocation[];
  recentBookings: OrgBookingRow[];
  recentPayments: OrgPaymentRow[];
};

/** Full profile of a single coworking for the platform-admin detail view. */
export async function getPlatformOrgDetail(
  orgId: string,
): Promise<PlatformOrgDetail | null> {
  const supabase = createServiceClient();

  const { data: org } = await supabase
    .from("organizations")
    .select(
      "id, name, slug, plan, currency, country, created_at, suspended_at, brand_color, logo_url",
    )
    .eq("id", orgId)
    .maybeSingle();

  if (!org) return null;
  const o = org as Pick<
    PlatformOrgDetail,
    | "id"
    | "name"
    | "slug"
    | "plan"
    | "currency"
    | "country"
    | "created_at"
    | "suspended_at"
    | "brand_color"
    | "logo_url"
  >;

  const [usageRes, balanceRes, subRes, locsRes, bookingsRes, paymentsRes] =
    await Promise.all([
      supabase.rpc("org_usage", { p_org: orgId }),
      supabase.rpc("org_wallet_balance", { p_org: orgId }),
      supabase
        .from("subscriptions")
        .select("status, plan_code, current_period_end, cancel_at_period_end")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("locations")
        .select("id, name, city, is_active")
        .eq("org_id", orgId)
        .order("created_at", { ascending: true }),
      supabase
        .from("bookings")
        .select(
          "id, starts_at, status, price, guest_name, members(full_name), resources(name)",
        )
        .eq("org_id", orgId)
        .order("starts_at", { ascending: false })
        .limit(8),
      supabase
        .from("payments")
        .select("id, created_at, kind, amount, status")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

  const u = (usageRes.data as Record<string, unknown> | null) ?? {};
  const sub = subRes.data as PlatformOrgDetail["subscription"];

  const bookingRows = (bookingsRes.data ?? []) as unknown as {
    id: string;
    starts_at: string;
    status: string;
    price: number;
    guest_name: string | null;
    members: { full_name: string } | null;
    resources: { name: string } | null;
  }[];

  return {
    ...o,
    usage: {
      locations: Number(u.locations ?? 0),
      resources: Number(u.resources ?? 0),
      members: Number(u.members ?? 0),
      bookings_this_month: Number(u.bookings_this_month ?? 0),
    },
    walletBalance: Number(balanceRes.data ?? 0),
    subscription: sub ?? null,
    locations: (locsRes.data ?? []) as OrgLocation[],
    recentBookings: bookingRows.map((b) => ({
      id: b.id,
      starts_at: b.starts_at,
      status: b.status,
      price: b.price,
      resource_name: b.resources?.name ?? "—",
      guest: b.members?.full_name ?? b.guest_name ?? "Invitado",
    })),
    recentPayments: (paymentsRes.data ?? []) as OrgPaymentRow[],
  };
}

/** All plan rows (free→premium order), merged over the static fallback so the
 *  editor always shows a complete, well-typed row even on a fresh DB. */
export async function getPlatformPlans(): Promise<Plan[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("plans")
    .select(
      "code, name, description, price_mxn, sort_order, is_public, limits, features, commission_bps, created_at, updated_at",
    );

  const byCode = new Map(
    ((data ?? []) as unknown as Plan[]).map((p) => [p.code, p]),
  );

  return PLAN_ORDER.map((code, i) => {
    const base = PLAN_CATALOG[code];
    const row = byCode.get(code);
    return {
      code,
      name: row?.name ?? base.name,
      description: row?.description ?? base.description,
      price_mxn: row?.price_mxn ?? base.price_mxn,
      sort_order: row?.sort_order ?? i,
      is_public: row?.is_public ?? true,
      limits: { ...base.limits, ...(row?.limits ?? {}) },
      features: { ...base.features, ...(row?.features ?? {}) },
      commission_bps: row?.commission_bps ?? base.commission_bps,
      created_at: row?.created_at ?? new Date().toISOString(),
      updated_at: row?.updated_at ?? new Date().toISOString(),
    } satisfies Plan;
  });
}

export type PlatformPayment = {
  id: string;
  org_id: string;
  org_name: string;
  kind: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  paid_at: string | null;
};

/** Every payment across all coworkings, newest first. */
export async function getPlatformPayments(
  limit = 300,
): Promise<PlatformPayment[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("payments")
    .select(
      "id, org_id, kind, amount, currency, status, created_at, paid_at, organizations(name)",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  const rows = (data ?? []) as unknown as (Omit<
    PlatformPayment,
    "org_name"
  > & { organizations: { name: string } | null })[];

  return rows.map((r) => ({
    id: r.id,
    org_id: r.org_id,
    org_name: r.organizations?.name ?? "—",
    kind: r.kind,
    amount: r.amount,
    currency: r.currency,
    status: r.status,
    created_at: r.created_at,
    paid_at: r.paid_at,
  }));
}

export type PlatformStaff = {
  user_id: string;
  org_id: string;
  org_name: string;
  full_name: string;
  role: string;
  status: string;
  created_at: string;
};

export type PlatformMember = {
  id: string;
  org_id: string;
  org_name: string;
  full_name: string;
  email: string | null;
  company: string | null;
  status: string;
  created_at: string;
};

/** Team users (staff) across every coworking, with role and coworking name. */
export async function getPlatformStaff(): Promise<PlatformStaff[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("organization_members")
    .select(
      "user_id, org_id, role, status, created_at, organizations(name), profiles(full_name)",
    )
    .order("created_at", { ascending: false })
    .limit(500);

  const rows = (data ?? []) as unknown as {
    user_id: string;
    org_id: string;
    role: string;
    status: string;
    created_at: string;
    organizations: { name: string } | null;
    profiles: { full_name: string | null } | null;
  }[];

  return rows.map((r) => ({
    user_id: r.user_id,
    org_id: r.org_id,
    org_name: r.organizations?.name ?? "—",
    full_name: r.profiles?.full_name ?? "Sin nombre",
    role: r.role,
    status: r.status,
    created_at: r.created_at,
  }));
}

/** Client members across every coworking. */
export async function getPlatformMembers(
  limit = 500,
): Promise<PlatformMember[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("members")
    .select(
      "id, org_id, full_name, email, company, status, created_at, organizations(name)",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  const rows = (data ?? []) as unknown as (Omit<
    PlatformMember,
    "org_name"
  > & { organizations: { name: string } | null })[];

  return rows.map((r) => ({
    id: r.id,
    org_id: r.org_id,
    org_name: r.organizations?.name ?? "—",
    full_name: r.full_name,
    email: r.email,
    company: r.company,
    status: r.status,
    created_at: r.created_at,
  }));
}

export type PlatformPayout = {
  id: string;
  org_id: string;
  org_name: string;
  amount: number;
  status: "requested" | "paid" | "rejected";
  destination: string | null;
  note: string | null;
  created_at: string;
  processed_at: string | null;
};

/** All payout requests across orgs, newest first, with the org name resolved. */
export async function getPlatformPayouts(): Promise<PlatformPayout[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("payouts")
    .select(
      "id, org_id, amount, status, destination, note, created_at, processed_at, organizations(name)",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as unknown as (Omit<
    PlatformPayout,
    "org_name"
  > & { organizations: { name: string } | null })[];

  return rows.map((r) => ({
    id: r.id,
    org_id: r.org_id,
    org_name: r.organizations?.name ?? "—",
    amount: r.amount,
    status: r.status,
    destination: r.destination,
    note: r.note,
    created_at: r.created_at,
    processed_at: r.processed_at,
  }));
}

/** Total commission Espazio has earned from approved online booking payments. */
export async function getPlatformCommission(): Promise<number> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("payments")
    .select("amount, metadata")
    .eq("kind", "booking")
    .eq("status", "approved")
    .limit(5000);

  const rows = (data ?? []) as {
    amount: number;
    metadata: Record<string, unknown> | null;
  }[];

  return rows.reduce((sum, p) => {
    const bps = Number(p.metadata?.commission_bps ?? 0);
    return sum + Math.round((p.amount * bps) / 10000);
  }, 0);
}

export function getPlatformStats(orgs: PlatformOrg[]): PlatformStats {
  const byPlan: Record<PlanCode, number> = { free: 0, lite: 0, premium: 0 };
  let mrr = 0;
  let bookingsThisMonth = 0;
  const monthStart = monthStartIso();
  let newOrgsThisMonth = 0;

  for (const o of orgs) {
    byPlan[o.plan] += 1;
    mrr += PLAN_CATALOG[o.plan].price_mxn;
    bookingsThisMonth += o.bookings_this_month;
    if (o.created_at >= monthStart) newOrgsThisMonth += 1;
  }

  return {
    totalOrgs: orgs.length,
    byPlan,
    mrr,
    bookingsThisMonth,
    newOrgsThisMonth,
  };
}

"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { TRIAL_DAYS } from "@/lib/trial";
import { PLAN_ORDER } from "@/lib/plans";
import type { PlanCode } from "@/lib/supabase/types";

export type OrgState = { error?: string } | null;

const ACTIVE_ORG_COOKIE = "active_org";

const MX_TIMEZONES = [
  "America/Mexico_City",
  "America/Cancun",
  "America/Merida",
  "America/Monterrey",
  "America/Matamoros",
  "America/Mazatlan",
  "America/Chihuahua",
  "America/Hermosillo",
  "America/Tijuana",
];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/** Find an available slug, using the service client to bypass RLS for the check. */
async function uniqueSlug(base: string): Promise<string> {
  const admin = createServiceClient();
  const root = base || "coworking";
  let candidate = root;

  for (let attempt = 0; attempt < 6; attempt++) {
    const { data } = await admin
      .from("organizations")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (!data) return candidate;
    candidate = `${root}-${Math.random().toString(36).slice(2, 6)}`;
  }

  return `${root}-${Date.now().toString(36)}`;
}

export async function createOrganizationAction(
  _prev: OrgState,
  formData: FormData,
): Promise<OrgState> {
  const name = String(formData.get("name") ?? "").trim();
  const timezoneInput = String(formData.get("timezone") ?? "").trim();
  const timezone = MX_TIMEZONES.includes(timezoneInput)
    ? timezoneInput
    : "America/Mexico_City";

  const planInput = String(formData.get("plan") ?? "free");
  const plan: PlanCode = (PLAN_ORDER as string[]).includes(planInput)
    ? (planInput as PlanCode)
    : "free";

  if (name.length < 2) {
    return { error: "Escribe el nombre de tu coworking." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const slug = await uniqueSlug(slugify(name));

  // Start a free trial; the chosen plan is what we'll charge once it ends.
  const trialEndsAt = new Date(
    Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: org, error } = await supabase
    .from("organizations")
    .insert({
      name,
      slug,
      timezone,
      currency: "MXN",
      country: "MX",
      plan,
      trial_ends_at: trialEndsAt,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !org) {
    return {
      error:
        error?.code === "23505"
          ? "Ese nombre ya está en uso. Prueba con otro."
          : "No se pudo crear el espacio. Inténtalo de nuevo.",
    };
  }

  // Record the trial subscription (service role bypasses RLS). The webhook and
  // the in-app payment flow later reconcile this into an active subscription.
  const admin = createServiceClient();
  await admin.from("subscriptions").upsert(
    {
      org_id: org.id,
      plan_code: plan,
      status: "trialing",
      cancel_at_period_end: false,
    },
    { onConflict: "org_id" },
  );

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, org.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect("/dashboard");
}

export async function setActiveOrgAction(orgId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Verify the user actually belongs to this org before switching.
  const { data: membership } = await supabase
    .from("organization_members")
    .select("org_id")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!membership) return;

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, orgId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect("/dashboard");
}

export { MX_TIMEZONES };

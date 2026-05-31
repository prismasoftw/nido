import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import type { Organization } from "@/lib/supabase/types";

/** Length of the free trial granted at onboarding, in days. */
export const TRIAL_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

export type BillingState = {
  /** True when the org has an active paid subscription. */
  paid: boolean;
  /** True when still inside the free trial window (and not yet paid). */
  inTrial: boolean;
  /** True when the trial window has passed without an active subscription. */
  expired: boolean;
  /** Whole days remaining in the trial (0 when expired or not applicable). */
  daysLeft: number;
  trialEndsAt: string | null;
};

/**
 * Resolves the billing state of an org by combining its trial window with the
 * current subscription status. Orgs without a `trial_ends_at` (legacy or
 * platform-created) are never treated as expired, so existing accounts and the
 * super-admin are never locked out.
 */
export async function getBillingState(
  org: Pick<Organization, "id" | "trial_ends_at">,
): Promise<BillingState> {
  const supabase = createServiceClient();
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("org_id", org.id)
    .maybeSingle();

  const paid = sub?.status === "active";
  const end = org.trial_ends_at ? new Date(org.trial_ends_at).getTime() : null;
  const now = Date.now();

  const inTrial = !paid && end !== null && now < end;
  const expired = !paid && end !== null && now >= end;
  const daysLeft =
    end !== null ? Math.max(0, Math.ceil((end - now) / DAY_MS)) : 0;

  return { paid, inTrial, expired, daysLeft, trialEndsAt: org.trial_ends_at };
}

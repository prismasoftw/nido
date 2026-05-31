import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { requireUser, getUserOrgs } from "@/lib/auth";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { getPlanCatalog } from "@/lib/plans-server";
import { PLAN_ORDER } from "@/lib/plans";
import { TRIAL_DAYS } from "@/lib/trial";

export const metadata: Metadata = { title: "Configura tu espacio" };

export default async function OnboardingPage() {
  await requireUser();

  // Already part of an organization — skip onboarding.
  const orgs = await getUserOrgs();
  if (orgs.length > 0) redirect("/dashboard");

  const catalog = await getPlanCatalog();
  const plans = PLAN_ORDER.map((code) => ({
    code,
    name: catalog[code].name,
    description: catalog[code].description ?? "",
    price_mxn: catalog[code].price_mxn,
  }));

  return (
    <div className="bg-background relative flex min-h-svh items-center justify-center overflow-hidden px-4 py-12">
      <div
        aria-hidden
        className="bg-primary/20 absolute -top-24 -left-24 size-72 rounded-full blur-3xl"
      />
      <div
        aria-hidden
        className="bg-brand/20 absolute -right-24 -bottom-24 size-72 rounded-full blur-3xl"
      />

      <div className="glass relative w-full max-w-md rounded-2xl border p-8 shadow-xl">
        <div className="mb-6 space-y-2">
          <span className="text-primary text-sm font-medium">Paso 1 de 1</span>
          <h1 className="font-heading text-2xl font-semibold">
            Crea tu espacio de coworking
          </h1>
          <p className="text-muted-foreground text-sm">
            Configura lo esencial para empezar. Tienes {TRIAL_DAYS} días de
            prueba gratis, sin tarjeta.
          </p>
        </div>

        <OnboardingForm plans={plans} trialDays={TRIAL_DAYS} />
      </div>
    </div>
  );
}

import {
  requireUser,
  getUserOrgs,
  getActiveOrg,
  userDisplayName,
  isPlatformAdmin,
} from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { Clock, ShieldAlert } from "lucide-react";

import { getBillingState } from "@/lib/trial";
import { SUPPORT_EMAIL, SUPPORT_EMAIL_URL } from "@/lib/seo";
import { AppSidebar } from "@/components/app/app-sidebar";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const orgs = await getUserOrgs();

  if (orgs.length === 0) {
    // Platform super-admins don't own a coworking — send them to their panel
    // instead of forcing them through the coworking onboarding.
    if (await isPlatformAdmin()) redirect("/admin");
    redirect("/onboarding");
  }

  const active = (await getActiveOrg()) ?? { org: orgs[0].org, role: orgs[0].role };

  const platformAdmin = await isPlatformAdmin();

  // A platform admin can suspend a coworking; its staff lose panel access until
  // it's reactivated. Platform admins themselves are never blocked here.
  if (active.org.suspended_at && !platformAdmin) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
            <ShieldAlert className="size-7" />
          </div>
          <div className="space-y-1">
            <h1 className="font-heading text-xl font-semibold">
              Cuenta suspendida
            </h1>
            <p className="text-muted-foreground text-sm">
              El acceso a <span className="font-medium">{active.org.name}</span> está
              temporalmente suspendido. Escríbenos a{" "}
              <a href={SUPPORT_EMAIL_URL} className="underline">
                {SUPPORT_EMAIL}
              </a>{" "}
              para reactivar tu cuenta.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Free-trial gate: once the trial ends without an active subscription, block
  // the app and send admins to /settings to activate a plan. We let /settings
  // through so they can actually pay. Platform admins are never blocked.
  const billing = await getBillingState(active.org);
  const pathname = (await headers()).get("x-pathname") ?? "";
  const onSettings = pathname.startsWith("/settings");

  if (billing.expired && !platformAdmin && !onSettings) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <div className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-2xl">
            <Clock className="size-7" />
          </div>
          <div className="space-y-1">
            <h1 className="font-heading text-xl font-semibold">
              Tu prueba gratis terminó
            </h1>
            <p className="text-muted-foreground text-sm">
              Tu periodo de prueba de{" "}
              <span className="font-medium">{active.org.name}</span> finalizó.
              Activa tu plan para seguir usando Espazio. Tus datos están a salvo.
            </p>
          </div>
          <Button asChild>
            <Link href="/settings">Activar mi plan</Link>
          </Button>
          <p className="text-muted-foreground text-xs">
            ¿Dudas? Escríbenos a{" "}
            <a href={SUPPORT_EMAIL_URL} className="underline">
              {SUPPORT_EMAIL}
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar
        orgs={orgs.map((o) => ({
          id: o.org.id,
          name: o.org.name,
          plan: o.org.plan,
        }))}
        activeOrgId={active.org.id}
        role={active.role}
        user={{ name: userDisplayName(user), email: user.email ?? "" }}
      />
      <SidebarInset>
        <header className="bg-background/80 sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b backdrop-blur">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-1 h-4" />
            <span className="text-sm font-medium">{active.org.name}</span>
          </div>
        </header>
        {billing.inTrial && !platformAdmin && (
          <div className="bg-primary/5 text-primary border-primary/15 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-b px-4 py-2 text-center text-xs sm:text-sm">
            <Clock className="size-4 shrink-0" />
            <span>
              {billing.daysLeft === 1
                ? "Te queda 1 día de prueba gratis."
                : `Te quedan ${billing.daysLeft} días de prueba gratis.`}
            </span>
            <Link href="/settings" className="font-medium underline">
              Activar mi plan
            </Link>
          </div>
        )}
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

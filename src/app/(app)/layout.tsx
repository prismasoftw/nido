import {
  requireUser,
  getUserOrgs,
  getActiveOrg,
  userDisplayName,
  isPlatformAdmin,
} from "@/lib/auth";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";

import { AppSidebar } from "@/components/app/app-sidebar";
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

  // A platform admin can suspend a coworking; its staff lose panel access until
  // it's reactivated. Platform admins themselves are never blocked here.
  if (active.org.suspended_at && !(await isPlatformAdmin())) {
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
              <a href="mailto:hola@espazio.app" className="underline">
                hola@espazio.app
              </a>{" "}
              para reactivar tu cuenta.
            </p>
          </div>
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
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

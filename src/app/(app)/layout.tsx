import { requireUser, getUserOrgs, getActiveOrg, userDisplayName } from "@/lib/auth";
import { redirect } from "next/navigation";

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

  if (orgs.length === 0) redirect("/onboarding");

  const active = (await getActiveOrg()) ?? { org: orgs[0].org, role: orgs[0].role };

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

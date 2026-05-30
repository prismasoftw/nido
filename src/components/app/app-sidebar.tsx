"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ChevronsUpDown,
  LogOut,
  Check,
  Plus,
} from "lucide-react";

import { MAIN_NAV, SECONDARY_NAV, canSee } from "@/lib/nav";
import { setActiveOrgAction } from "@/lib/actions/org";
import { signOutAction } from "@/lib/actions/auth";
import { ROLE_LABELS } from "@/lib/constants";
import type { MemberRole } from "@/lib/supabase/types";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export type SidebarOrg = {
  id: string;
  name: string;
  plan: string;
};

export type SidebarUser = {
  name: string;
  email: string;
};

function initials(text: string): string {
  const parts = text.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AppSidebar({
  orgs,
  activeOrgId,
  role,
  user,
}: {
  orgs: SidebarOrg[];
  activeOrgId: string;
  role: MemberRole;
  user: SidebarUser;
}) {
  const pathname = usePathname();
  const activeOrg = orgs.find((o) => o.id === activeOrgId) ?? orgs[0];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent"
                >
                  <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <Building2 className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {activeOrg?.name ?? "Mi espacio"}
                    </span>
                    <span className="text-muted-foreground truncate text-xs capitalize">
                      Plan {activeOrg?.plan}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
                align="start"
              >
                <DropdownMenuLabel className="text-muted-foreground text-xs">
                  Tus espacios
                </DropdownMenuLabel>
                {orgs.map((org) => (
                  <form key={org.id} action={setActiveOrgAction.bind(null, org.id)}>
                    <DropdownMenuItem asChild>
                      <button type="submit" className="w-full">
                        <span className="truncate">{org.name}</span>
                        {org.id === activeOrgId && (
                          <Check className="ml-auto size-4" />
                        )}
                      </button>
                    </DropdownMenuItem>
                  </form>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/onboarding">
                    <Plus className="size-4" />
                    Crear nuevo espacio
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {MAIN_NAV.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {SECONDARY_NAV.filter((item) => canSee(item, role)).map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent"
                >
                  <Avatar className="size-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">
                      {initials(user.name || user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="text-muted-foreground truncate text-xs">
                      {ROLE_LABELS[role]}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
                align="end"
                side="top"
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="grid text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="text-muted-foreground truncate text-xs">
                      {user.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <form action={signOutAction}>
                  <DropdownMenuItem asChild>
                    <button type="submit" className="w-full">
                      <LogOut className="size-4" />
                      Cerrar sesión
                    </button>
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

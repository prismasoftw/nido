import {
  Building2,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { MemberRole } from "@/lib/supabase/types";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Minimum roles allowed to see this item. Omit = all staff. */
  roles?: MemberRole[];
};

export const MAIN_NAV: NavItem[] = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/bookings", label: "Reservas", icon: CalendarDays },
  { href: "/spaces", label: "Espacios", icon: Building2 },
  { href: "/members", label: "Miembros", icon: Users },
  { href: "/payments", label: "Pagos", icon: CreditCard },
];

export const SECONDARY_NAV: NavItem[] = [
  {
    href: "/settings",
    label: "Configuración",
    icon: Settings,
    roles: ["owner", "admin"],
  },
];

export function canSee(item: NavItem, role: MemberRole): boolean {
  return !item.roles || item.roles.includes(role);
}

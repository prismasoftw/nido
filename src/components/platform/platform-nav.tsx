"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Banknote,
  LayoutDashboard,
  Tag,
  Users,
  Wallet,
} from "lucide-react";

import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Panel", icon: LayoutDashboard, exact: true },
  { href: "/admin/plans", label: "Planes", icon: Tag },
  { href: "/admin/payments", label: "Pagos", icon: Banknote },
  { href: "/admin/users", label: "Usuarios", icon: Users },
  { href: "/admin/payouts", label: "Retiros", icon: Wallet },
];

export function PlatformNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 overflow-x-auto">
      {LINKS.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname.startsWith(link.href);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

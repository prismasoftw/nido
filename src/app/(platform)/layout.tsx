import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { requirePlatformAdmin } from "@/lib/auth";
import { PlatformNav } from "@/components/platform/platform-nav";

export default async function PlatformLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requirePlatformAdmin();

  return (
    <div className="bg-muted/20 min-h-svh">
      <header className="bg-background/80 sticky top-0 z-10 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="bg-foreground text-background flex size-7 items-center justify-center rounded-lg">
              <ShieldCheck className="size-4" />
            </div>
            <span className="font-heading text-sm font-semibold">
              Espazio · Plataforma
            </span>
          </div>
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
          >
            <ArrowLeft className="size-4" />
            Volver a mi sede
          </Link>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-2">
          <PlatformNav />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}

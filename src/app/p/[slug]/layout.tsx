import type { ReactNode } from "react";

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-muted/20 min-h-svh">
      {children}
      <footer className="border-t py-8 text-center">
        <p className="text-muted-foreground text-xs">
          Reservas con tecnología de{" "}
          <span className="text-gradient font-heading font-semibold">
            Workia
          </span>
        </p>
      </footer>
    </div>
  );
}

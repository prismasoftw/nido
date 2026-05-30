import Link from "next/link";
import { TriangleAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function atLimit(used: number, max: number) {
  return max !== -1 && used >= max;
}

export function PlanLimitAlert({
  used,
  max,
  noun,
}: {
  used: number;
  max: number;
  noun: string;
}) {
  if (!atLimit(used, max)) return null;
  return (
    <Alert variant="destructive">
      <TriangleAlert className="size-4" />
      <AlertTitle>Llegaste al límite de tu plan</AlertTitle>
      <AlertDescription>
        Tu plan incluye {max} {noun}. Para agregar más,{" "}
        <Link
          href="/settings"
          className="font-medium underline underline-offset-2"
        >
          mejora tu plan
        </Link>
        .
      </AlertDescription>
    </Alert>
  );
}

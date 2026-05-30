"use client";

import { useActionState } from "react";
import { Check, Loader2, X } from "lucide-react";

import { resolvePayoutAction, type PayoutState } from "@/lib/actions/payouts";
import { Button } from "@/components/ui/button";

export function PayoutActions({ payoutId }: { payoutId: string }) {
  const [, action, pending] = useActionState<PayoutState, FormData>(
    resolvePayoutAction,
    null,
  );

  return (
    <div className="flex justify-end gap-2">
      <form action={action}>
        <input type="hidden" name="payout_id" value={payoutId} />
        <input type="hidden" name="decision" value="paid" />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}
          Marcar pagado
        </Button>
      </form>
      <form action={action}>
        <input type="hidden" name="payout_id" value={payoutId} />
        <input type="hidden" name="decision" value="rejected" />
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          <X className="size-4" />
          Rechazar
        </Button>
      </form>
    </div>
  );
}

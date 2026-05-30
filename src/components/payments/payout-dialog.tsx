"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { requestPayoutAction, type PayoutState } from "@/lib/actions/payouts";
import { formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function PayoutDialog({
  balance,
  trigger,
}: {
  balance: number;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<PayoutState, FormData>(
    requestPayoutAction,
    null,
  );

  useEffect(() => {
    if (state?.ok) setOpen(false);
  }, [state?.ok]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form action={action} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Solicitar retiro</DialogTitle>
            <DialogDescription>
              Saldo disponible: {formatMoney(balance)}. El equipo de Espazio
              procesará tu retiro a la cuenta que indiques.
            </DialogDescription>
          </DialogHeader>

          {state?.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="po-amount">Monto a retirar (MXN)</Label>
            <Input
              id="po-amount"
              name="amount"
              type="number"
              min={1}
              max={balance}
              placeholder={String(balance)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="po-destination">CLABE o cuenta destino</Label>
            <Input
              id="po-destination"
              name="destination"
              placeholder="CLABE 18 dígitos o alias de Mercado Pago"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="po-note">Nota (opcional)</Label>
            <Textarea
              id="po-note"
              name="note"
              placeholder="Referencia o instrucciones"
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending || balance <= 0}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Solicitar retiro
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

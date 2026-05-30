"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

import {
  createBookingAction,
  type FormState,
} from "@/lib/actions/bookings";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ResourceOption = { id: string; name: string; locationName: string };
type MemberOption = { id: string; name: string };

const GUEST = "__guest__";

export function BookingDialog({
  resources,
  members,
  defaultDate,
  trigger,
}: {
  resources: ResourceOption[];
  members: MemberOption[];
  defaultDate: string;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [who, setWho] = useState<string>(members[0]?.id ?? GUEST);
  const [state, action, pending] = useActionState<FormState, FormData>(
    createBookingAction,
    null,
  );

  useEffect(() => {
    if (state?.ok) setOpen(false);
  }, [state?.ok]);

  const isGuest = who === GUEST;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <form action={action} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Nueva reserva</DialogTitle>
            <DialogDescription>
              Reserva un espacio para un miembro o invitado.
            </DialogDescription>
          </DialogHeader>

          {state?.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="bk-resource">Espacio</Label>
            <Select name="resource_id" defaultValue={resources[0]?.id}>
              <SelectTrigger id="bk-resource" className="w-full">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {resources.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name} · {r.locationName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state?.fieldErrors?.resource_id && (
              <p className="text-destructive text-xs">
                {state.fieldErrors.resource_id}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bk-who">Reserva para</Label>
            <Select value={who} onValueChange={setWho}>
              <SelectTrigger id="bk-who" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
                <SelectItem value={GUEST}>Invitado (sin cuenta)</SelectItem>
              </SelectContent>
            </Select>
            {!isGuest && <input type="hidden" name="member_id" value={who} />}
          </div>

          {isGuest && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="bk-gname">Nombre del invitado</Label>
                <Input id="bk-gname" name="guest_name" placeholder="Ana López" />
                {state?.fieldErrors?.guest_name && (
                  <p className="text-destructive text-xs">
                    {state.fieldErrors.guest_name}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="bk-gemail">Correo</Label>
                <Input
                  id="bk-gemail"
                  name="guest_email"
                  type="email"
                  placeholder="ana@correo.com"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="bk-date">Fecha</Label>
              <Input
                id="bk-date"
                name="date"
                type="date"
                defaultValue={defaultDate}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bk-start">Inicio</Label>
              <Input
                id="bk-start"
                name="start_time"
                type="time"
                defaultValue="09:00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bk-end">Fin</Label>
              <Input
                id="bk-end"
                name="end_time"
                type="time"
                defaultValue="10:00"
                required
              />
            </div>
          </div>
          {state?.fieldErrors?.end_time && (
            <p className="text-destructive text-xs">
              {state.fieldErrors.end_time}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="bk-title">Título (opcional)</Label>
              <Input
                id="bk-title"
                name="title"
                placeholder="Junta de equipo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bk-price">Precio (MXN, opcional)</Label>
              <Input
                id="bk-price"
                name="price"
                type="number"
                min={0}
                placeholder="Auto"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bk-notes">Notas</Label>
            <Textarea id="bk-notes" name="notes" rows={2} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending || resources.length === 0}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Crear reserva
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

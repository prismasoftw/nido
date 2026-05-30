"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

import {
  createMemberAction,
  updateMemberAction,
  type FormState,
} from "@/lib/actions/members";
import type { Member } from "@/lib/supabase/types";
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

const STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  inactive: "Inactivo",
  suspended: "Suspendido",
  invited: "Invitado",
};

export function MemberDialog({
  member,
  trigger,
}: {
  member?: Member;
  trigger: ReactNode;
}) {
  const editing = Boolean(member);
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(
    editing ? updateMemberAction : createMemberAction,
    null,
  );

  useEffect(() => {
    if (state?.ok) setOpen(false);
  }, [state?.ok]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <form action={action} className="space-y-4">
          {editing && <input type="hidden" name="id" value={member!.id} />}
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar miembro" : "Nuevo miembro"}
            </DialogTitle>
            <DialogDescription>
              Clientes de tu coworking: personas o empresas.
            </DialogDescription>
          </DialogHeader>

          {state?.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="m-name">Nombre completo</Label>
            <Input
              id="m-name"
              name="full_name"
              defaultValue={member?.full_name}
              placeholder="Ana López"
              required
            />
            {state?.fieldErrors?.full_name && (
              <p className="text-destructive text-xs">
                {state.fieldErrors.full_name}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="m-email">Correo</Label>
              <Input
                id="m-email"
                name="email"
                type="email"
                defaultValue={member?.email ?? ""}
                placeholder="ana@correo.com"
              />
              {state?.fieldErrors?.email && (
                <p className="text-destructive text-xs">
                  {state.fieldErrors.email}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-phone">Teléfono</Label>
              <Input
                id="m-phone"
                name="phone"
                defaultValue={member?.phone ?? ""}
                placeholder="55 1234 5678"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="m-company">Empresa</Label>
              <Input
                id="m-company"
                name="company"
                defaultValue={member?.company ?? ""}
                placeholder="Opcional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-status">Estado</Label>
              <Select name="status" defaultValue={member?.status ?? "active"}>
                <SelectTrigger id="m-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="m-notes">Notas</Label>
            <Textarea
              id="m-notes"
              name="notes"
              defaultValue={member?.notes ?? ""}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {editing ? "Guardar" : "Crear miembro"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

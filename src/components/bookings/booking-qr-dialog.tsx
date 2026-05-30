"use client";

import { useState, type ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function BookingQrDialog({
  bookingId,
  label,
  trigger,
}: {
  bookingId: string;
  label: string;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>Check-in con QR</DialogTitle>
          <DialogDescription>{label}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3">
          {open && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/checkin/${bookingId}/qr`}
              alt="Código QR de check-in"
              width={240}
              height={240}
              className="rounded-lg border"
            />
          )}
          <p className="text-muted-foreground text-center text-xs">
            Escanea este código en recepción para registrar la entrada.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

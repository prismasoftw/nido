import {
  Armchair,
  Box,
  Briefcase,
  CalendarClock,
  DoorClosed,
  PartyPopper,
  type LucideIcon,
} from "lucide-react";

import type {
  BookingStatus,
  MemberRole,
  PriceUnit,
  ResourceKind,
} from "@/lib/supabase/types";

export const RESOURCE_KINDS: {
  value: ResourceKind;
  label: string;
  icon: LucideIcon;
  description: string;
}[] = [
  {
    value: "private_office",
    label: "Oficina privada",
    icon: DoorClosed,
    description: "Espacio cerrado para un equipo o persona.",
  },
  {
    value: "dedicated_desk",
    label: "Escritorio dedicado",
    icon: Briefcase,
    description: "Escritorio fijo asignado a un miembro.",
  },
  {
    value: "hot_desk",
    label: "Hot desk",
    icon: Armchair,
    description: "Escritorio flexible por horas o días.",
  },
  {
    value: "meeting_room",
    label: "Sala de juntas",
    icon: CalendarClock,
    description: "Sala reservable por hora.",
  },
  {
    value: "event_space",
    label: "Espacio de eventos",
    icon: PartyPopper,
    description: "Área amplia para eventos.",
  },
  {
    value: "locker",
    label: "Locker",
    icon: Box,
    description: "Almacenamiento personal.",
  },
];

export const RESOURCE_KIND_LABELS = Object.fromEntries(
  RESOURCE_KINDS.map((r) => [r.value, r.label]),
) as Record<ResourceKind, string>;

export const ROLE_LABELS: Record<MemberRole, string> = {
  owner: "Propietario",
  admin: "Administrador",
  manager: "Gerente",
  reception: "Recepción",
};

export const BOOKING_STATUS_META: Record<
  BookingStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "Pendiente", variant: "outline" },
  confirmed: { label: "Confirmada", variant: "default" },
  checked_in: { label: "Check-in", variant: "secondary" },
  completed: { label: "Completada", variant: "secondary" },
  cancelled: { label: "Cancelada", variant: "destructive" },
  no_show: { label: "No asistió", variant: "destructive" },
};

export const PRICE_UNIT_LABELS: Record<PriceUnit, string> = {
  hour: "hora",
  day: "día",
  week: "semana",
  month: "mes",
};

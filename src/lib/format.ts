import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

/** Amounts are stored as whole pesos (integers). */
export function formatMoney(amount: number, currency = "MXN") {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(value: string | Date, pattern = "d 'de' MMM, yyyy") {
  return format(new Date(value), pattern, { locale: es });
}

export function formatTime(value: string | Date) {
  return format(new Date(value), "HH:mm", { locale: es });
}

export function formatDateTime(value: string | Date) {
  return format(new Date(value), "d MMM yyyy, HH:mm", { locale: es });
}

export function formatRange(start: string | Date, end: string | Date) {
  const s = new Date(start);
  const e = new Date(end);
  const sameDay = s.toDateString() === e.toDateString();
  if (sameDay) {
    return `${format(s, "d MMM, HH:mm", { locale: es })} – ${format(e, "HH:mm", { locale: es })}`;
  }
  return `${formatDateTime(s)} – ${formatDateTime(e)}`;
}

export function timeAgo(value: string | Date) {
  return formatDistanceToNow(new Date(value), { addSuffix: true, locale: es });
}

export function minutesToLabel(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

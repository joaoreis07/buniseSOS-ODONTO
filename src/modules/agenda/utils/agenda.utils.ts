import type { AppointmentStatus } from "@prisma/client";

export const STATUS_META: Record<
  AppointmentStatus,
  { label: string; tone: string; dot: string }
> = {
  SCHEDULED: {
    label: "Agendado",
    tone: "status-info",
    dot: "bg-primary",
  },
  CONFIRMED: {
    label: "Confirmado",
    tone: "status-success",
    dot: "bg-success",
  },
  WAITING: {
    label: "Na espera",
    tone: "status-warning",
    dot: "bg-warning",
  },
  IN_PROGRESS: {
    label: "Em atendimento",
    tone: "status-info",
    dot: "bg-primary",
  },
  COMPLETED: {
    label: "Finalizado",
    tone: "status-success",
    dot: "bg-success",
  },
  CANCELED: {
    label: "Cancelado",
    tone: "status-danger",
    dot: "bg-destructive",
  },
  NO_SHOW: {
    label: "Faltou",
    tone: "status-warning",
    dot: "bg-warning",
  },
};

export const CLINIC_START_HOUR = 7;
export const CLINIC_END_HOUR = 20;
export const SLOT_MINUTES = 15;
export const PX_PER_MINUTE = 1.2;

export function minutesSinceStart(date: Date, startHour = CLINIC_START_HOUR): number {
  return date.getHours() * 60 + date.getMinutes() - startHour * 60;
}

export function durationMinutes(startsAt: Date | string, endsAt: Date | string): number {
  return Math.max(
    SLOT_MINUTES,
    Math.round((new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60_000),
  );
}

export function formatTime(value: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatDayLabel(value: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(value);
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

export function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  return addDays(d, -day);
}

export function endOfWeek(date: Date): Date {
  return endOfDay(addDays(startOfWeek(date), 6));
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

export function eachDayOfInterval(from: Date, to: Date): Date[] {
  const days: Date[] = [];
  let cursor = startOfDay(from);
  const last = startOfDay(to);
  while (cursor <= last) {
    days.push(new Date(cursor));
    cursor = addDays(cursor, 1);
  }
  return days;
}

export function snapToSlot(date: Date, slotMinutes = SLOT_MINUTES): Date {
  const next = new Date(date);
  const minutes = next.getMinutes();
  const snapped = Math.round(minutes / slotMinutes) * slotMinutes;
  next.setMinutes(snapped, 0, 0);
  return next;
}

export function withTime(base: Date, hours: number, minutes: number): Date {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate(), hours, minutes, 0, 0);
}

export function rangeForView(view: "day" | "week" | "month" | "timeline" | "list", anchor: Date) {
  if (view === "day" || view === "timeline") {
    return { from: startOfDay(anchor), to: endOfDay(anchor) };
  }
  if (view === "week" || view === "list") {
    return { from: startOfWeek(anchor), to: endOfWeek(anchor) };
  }
  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);
  return { from: startOfWeek(monthStart), to: endOfWeek(monthEnd) };
}

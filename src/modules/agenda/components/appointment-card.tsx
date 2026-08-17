"use client";

import { cn } from "@/shared/lib/utils";
import type { AppointmentClientDTO } from "../dto/agenda.dto";
import { STATUS_META, durationMinutes, formatTime } from "../utils/agenda.utils";

export function AppointmentCard({
  appointment,
  compact = false,
  style,
  onClick,
  onDragStart,
  dimmed,
  titleMode = "patient",
}: {
  appointment: AppointmentClientDTO;
  compact?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
  onDragStart?: (event: React.PointerEvent) => void;
  dimmed?: boolean;
  titleMode?: "patient" | "procedure";
}) {
  const status = STATUS_META[appointment.status];
  const past = new Date(appointment.endsAt).getTime() < Date.now();
  const heading =
    titleMode === "procedure"
      ? appointment.procedure || appointment.title || "Consulta"
      : appointment.patientName;
  const subtitle =
    titleMode === "procedure"
      ? appointment.professionalName
      : appointment.procedure ?? appointment.professionalName;
  const showRange = durationMinutes(appointment.startsAt, appointment.endsAt) >= 30;

  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={onDragStart}
      style={{
        ...style,
        borderLeftColor: appointment.professionalColor,
        backgroundColor: `${appointment.professionalColor}1f`,
      }}
      className={cn(
        "group absolute left-0.5 right-0.5 z-10 overflow-hidden rounded-md border-l-[3px] px-1.5 py-1 text-left transition hover:brightness-110",
        (dimmed || past) && appointment.status !== "IN_PROGRESS" && "opacity-70",
        appointment.status === "CANCELED" && "line-through opacity-45",
        compact ? "min-h-[20px]" : "min-h-[32px]",
      )}
    >
      {compact ? (
        <p className="truncate text-[11px] font-semibold leading-4 text-foreground">{heading}</p>
      ) : (
        <>
          <p className="truncate text-[10px] font-medium leading-3 text-muted-foreground">
            {formatTime(appointment.startsAt)}
            {showRange ? ` – ${formatTime(appointment.endsAt)}` : ""}
          </p>
          <p className="truncate text-[12px] font-semibold leading-4 text-foreground">{heading}</p>
          {subtitle ? (
            <p className="truncate text-[11px] leading-4 text-muted-foreground">{subtitle}</p>
          ) : null}
          {appointment.status !== "SCHEDULED" &&
          durationMinutes(appointment.startsAt, appointment.endsAt) >= 45 ? (
            <span className={cn("status-pill mt-0.5", status.tone)}>{status.label}</span>
          ) : null}
        </>
      )}
    </button>
  );
}

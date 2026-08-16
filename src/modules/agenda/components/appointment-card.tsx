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

  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={onDragStart}
      style={{
        ...style,
        borderLeftColor: appointment.professionalColor,
        backgroundColor: `${appointment.professionalColor}14`,
      }}
      className={cn(
        "group absolute left-1 right-1 z-10 overflow-hidden rounded-lg border border-border border-l-[3px] px-2.5 py-1.5 text-left shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition hover:shadow-md",
        (dimmed || past) && appointment.status !== "IN_PROGRESS" && "opacity-70",
        appointment.status === "CANCELED" && "line-through opacity-45",
        compact ? "min-h-[22px]" : "min-h-[36px]",
      )}
    >
      <div className="flex items-start gap-1.5">
        <span className={cn("mt-[5px] size-1.5 shrink-0 rounded-full", status.dot)} />
        <div className="min-w-0 flex-1">
          {compact ? (
            <p className="truncate text-[12px] font-semibold leading-4 text-foreground">
              {heading}
            </p>
          ) : (
            <>
              <p className="truncate text-[11px] font-medium leading-4 text-muted-foreground">
                {formatTime(appointment.startsAt)}
                {durationMinutes(appointment.startsAt, appointment.endsAt) >= 30
                  ? ` – ${formatTime(appointment.endsAt)}`
                  : ""}
              </p>
              <p className="truncate text-[12px] font-semibold leading-4 text-foreground">
                {heading}
              </p>
              <p className="truncate text-[11px] leading-4 text-muted-foreground">
                {subtitle}
              </p>
            </>
          )}
        </div>
      </div>
    </button>
  );
}

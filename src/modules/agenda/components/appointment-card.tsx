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
}: {
  appointment: AppointmentClientDTO;
  compact?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
  onDragStart?: (event: React.PointerEvent) => void;
  dimmed?: boolean;
}) {
  const status = STATUS_META[appointment.status];
  const past = new Date(appointment.endsAt).getTime() < Date.now();

  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={onDragStart}
      style={{
        ...style,
        borderLeftColor: appointment.professionalColor,
        backgroundColor: `${appointment.professionalColor}18`,
      }}
      className={cn(
        "group absolute left-1 right-1 z-10 overflow-hidden rounded-md border border-black/5 border-l-[3px] px-2 py-1 text-left shadow-sm transition hover:shadow-md",
        (dimmed || past) && appointment.status !== "IN_PROGRESS" && "opacity-55",
        appointment.status === "CANCELED" && "line-through opacity-40",
        compact ? "min-h-[22px]" : "min-h-[36px]",
      )}
    >
      <div className="flex items-start gap-1.5">
        <span className={cn("mt-1 size-1.5 shrink-0 rounded-full", status.dot)} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold leading-4 text-foreground">
            {appointment.patientName}
          </p>
          {!compact && (
            <>
              <p className="truncate text-[11px] leading-4 text-muted-foreground">
                {formatTime(appointment.startsAt)}
                {durationMinutes(appointment.startsAt, appointment.endsAt) >= 30
                  ? `–${formatTime(appointment.endsAt)}`
                  : ""}
                {appointment.procedure ? ` · ${appointment.procedure}` : ""}
              </p>
              <p className="truncate text-[10px] text-muted-foreground">
                {appointment.professionalName}
              </p>
            </>
          )}
        </div>
      </div>
    </button>
  );
}

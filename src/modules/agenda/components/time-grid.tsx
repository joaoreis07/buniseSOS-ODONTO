"use client";

import { useMemo, useRef } from "react";
import { cn } from "@/shared/lib/utils";
import type { AppointmentClientDTO, ScheduleBlockClientDTO } from "../dto/agenda.dto";
import {
  CLINIC_END_HOUR,
  CLINIC_START_HOUR,
  PX_PER_MINUTE,
  SLOT_MINUTES,
  durationMinutes,
  formatTime,
  minutesSinceStart,
  snapToSlot,
  withTime,
} from "../utils/agenda.utils";
import { AppointmentCard } from "./appointment-card";

type DayColumn = {
  date: Date;
  key: string;
  label: string;
  count: number;
};

export function TimeGrid({
  days,
  appointments,
  blocks,
  onSelectAppointment,
  onCreateAt,
  onReschedule,
  dimPast = true,
  framed = true,
  cardTitleMode = "patient",
}: {
  days: DayColumn[];
  appointments: AppointmentClientDTO[];
  blocks: ScheduleBlockClientDTO[];
  onSelectAppointment: (appointment: AppointmentClientDTO) => void;
  onCreateAt: (startsAt: Date, endsAt: Date) => void;
  onReschedule: (id: string, startsAt: Date, endsAt: Date) => void;
  dimPast?: boolean;
  framed?: boolean;
  cardTitleMode?: "patient" | "procedure";
}) {
  const totalMinutes = (CLINIC_END_HOUR - CLINIC_START_HOUR) * 60;
  const height = totalMinutes * PX_PER_MINUTE;
  const hours = useMemo(
    () => Array.from({ length: CLINIC_END_HOUR - CLINIC_START_HOUR }, (_, i) => CLINIC_START_HOUR + i),
    [],
  );
  const dragRef = useRef<{
    id: string;
    mode: "move" | "resize";
    originY: number;
    originalStart: Date;
    originalEnd: Date;
    dayIndex: number;
  } | null>(null);

  function yToDate(day: Date, clientY: number, columnTop: number) {
    const offset = Math.max(0, Math.min(totalMinutes, (clientY - columnTop) / PX_PER_MINUTE));
    const raw = withTime(day, CLINIC_START_HOUR, 0);
    raw.setMinutes(raw.getMinutes() + offset);
    return snapToSlot(raw);
  }

  return (
    <div className={cn("flex min-h-0 flex-1 overflow-auto", framed && "surface-card")}>
      <div className="sticky left-0 z-20 w-16 shrink-0 border-r border-border bg-card">
        <div className="surface-subtle h-14 border-b border-border" />
        <div style={{ height }} className="relative">
          {hours.map((hour) => (
            <div
              key={hour}
              className="absolute right-2 -translate-y-1/2 text-[11px] font-medium text-muted-foreground"
              style={{ top: (hour - CLINIC_START_HOUR) * 60 * PX_PER_MINUTE }}
            >
              {`${String(hour).padStart(2, "0")}:00`}
            </div>
          ))}
        </div>
      </div>

      <div
        className="grid min-w-0 flex-1"
        style={{ gridTemplateColumns: `repeat(${days.length}, minmax(150px, 1fr))` }}
      >
        {days.map((day) => {
          const isToday = day.date.toDateString() === new Date().toDateString();
          return (
          <div key={day.key} className="min-w-[150px] border-r border-border last:border-r-0">
            <div
              className={cn(
                "surface-subtle sticky top-0 z-10 flex h-14 flex-col items-center justify-center border-b border-border px-3 text-center",
                isToday && "border-t-2 border-t-primary bg-brand-50/70",
              )}
            >
              <p className="text-[13px] font-semibold text-foreground first-letter:uppercase">
                {day.label}
              </p>
              <p className="text-[11px] text-muted-foreground">{day.count} consultas</p>
            </div>
            <div
              className={cn("relative", isToday && "bg-brand-50/25")}
              style={{ height }}
              onDoubleClick={(event) => {
                const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
                const start = yToDate(day.date, event.clientY, rect.top);
                const end = new Date(start.getTime() + 30 * 60_000);
                onCreateAt(start, end);
              }}
            >
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="absolute inset-x-0 border-t border-border/70"
                  style={{ top: (hour - CLINIC_START_HOUR) * 60 * PX_PER_MINUTE }}
                />
              ))}
              {Array.from({ length: totalMinutes / SLOT_MINUTES }).map((_, i) =>
                i % 4 === 0 ? null : (
                  <div
                    key={`slot-${i}`}
                    className="absolute inset-x-0 border-t border-dashed border-border/40"
                    style={{ top: i * SLOT_MINUTES * PX_PER_MINUTE }}
                  />
                ),
              )}

              {blocks
                .filter((block) => {
                  const start = new Date(block.startsAt);
                  return start.toDateString() === day.date.toDateString();
                })
                .map((block) => {
                  const top = minutesSinceStart(new Date(block.startsAt)) * PX_PER_MINUTE;
                  const h = durationMinutes(block.startsAt, block.endsAt) * PX_PER_MINUTE;
                  return (
                    <div
                      key={block.id}
                      className="pointer-events-none absolute inset-x-0 bg-[repeating-linear-gradient(135deg,#e2e8f0_0,#e2e8f0_6px,transparent_6px,transparent_12px)] opacity-70"
                      style={{ top, height: Math.max(h, 8) }}
                      title={block.title ?? block.type}
                    />
                  );
                })}

              {appointments
                .filter((appt) => new Date(appt.startsAt).toDateString() === day.date.toDateString())
                .map((appt) => {
                  const top = minutesSinceStart(new Date(appt.startsAt)) * PX_PER_MINUTE;
                  const h = durationMinutes(appt.startsAt, appt.endsAt) * PX_PER_MINUTE;
                  return (
                    <div key={appt.id} className="absolute inset-x-0" style={{ top, height: h }}>
                      <AppointmentCard
                        appointment={appt}
                        dimmed={dimPast}
                        titleMode={cardTitleMode}
                        style={{ position: "absolute", inset: 0 }}
                        onClick={() => onSelectAppointment(appt)}
                        onDragStart={(event) => {
                          event.preventDefault();
                          const target = event.currentTarget.parentElement?.parentElement;
                          if (!target) return;
                          const dayIndex = days.findIndex((d) => d.key === day.key);
                          dragRef.current = {
                            id: appt.id,
                            mode: event.shiftKey ? "resize" : "move",
                            originY: event.clientY,
                            originalStart: new Date(appt.startsAt),
                            originalEnd: new Date(appt.endsAt),
                            dayIndex,
                          };

                          const onMove = (ev: PointerEvent) => {
                            const drag = dragRef.current;
                            if (!drag) return;
                            const deltaMinutes =
                              Math.round(((ev.clientY - drag.originY) / PX_PER_MINUTE) / SLOT_MINUTES) *
                              SLOT_MINUTES;
                            // live preview via style would be nicer; we commit on up
                            void deltaMinutes;
                          };

                          const onUp = (ev: PointerEvent) => {
                            const drag = dragRef.current;
                            dragRef.current = null;
                            window.removeEventListener("pointermove", onMove);
                            window.removeEventListener("pointerup", onUp);
                            if (!drag) return;
                            const deltaMinutes =
                              Math.round(((ev.clientY - drag.originY) / PX_PER_MINUTE) / SLOT_MINUTES) *
                              SLOT_MINUTES;
                            if (deltaMinutes === 0 && drag.mode === "move") return;
                            if (drag.mode === "resize") {
                              const endsAt = new Date(
                                drag.originalEnd.getTime() + deltaMinutes * 60_000,
                              );
                              if (endsAt <= drag.originalStart) return;
                              onReschedule(drag.id, drag.originalStart, snapToSlot(endsAt));
                              return;
                            }
                            const startsAt = snapToSlot(
                              new Date(drag.originalStart.getTime() + deltaMinutes * 60_000),
                            );
                            const endsAt = new Date(
                              drag.originalEnd.getTime() + deltaMinutes * 60_000,
                            );
                            onReschedule(drag.id, startsAt, endsAt);
                          };

                          window.addEventListener("pointermove", onMove);
                          window.addEventListener("pointerup", onUp);
                        }}
                      />
                      <div
                        className="absolute inset-x-2 bottom-0 z-20 h-2 cursor-ns-resize rounded-b-md opacity-0 transition group-hover:opacity-100"
                        title="Redimensionar (ou arraste com Shift)"
                        onPointerDown={(event) => {
                          event.stopPropagation();
                          event.preventDefault();
                          dragRef.current = {
                            id: appt.id,
                            mode: "resize",
                            originY: event.clientY,
                            originalStart: new Date(appt.startsAt),
                            originalEnd: new Date(appt.endsAt),
                            dayIndex: days.findIndex((d) => d.key === day.key),
                          };
                          const onUp = (ev: PointerEvent) => {
                            const drag = dragRef.current;
                            dragRef.current = null;
                            window.removeEventListener("pointerup", onUp);
                            if (!drag) return;
                            const deltaMinutes =
                              Math.round(((ev.clientY - drag.originY) / PX_PER_MINUTE) / SLOT_MINUTES) *
                              SLOT_MINUTES;
                            const endsAt = snapToSlot(
                              new Date(drag.originalEnd.getTime() + deltaMinutes * 60_000),
                            );
                            if (endsAt <= drag.originalStart) return;
                            onReschedule(drag.id, drag.originalStart, endsAt);
                          };
                          window.addEventListener("pointerup", onUp);
                        }}
                      />
                    </div>
                  );
                })}

              {new Date().toDateString() === day.date.toDateString() && (
                <div
                  className="pointer-events-none absolute inset-x-0 z-30 border-t-2 border-rose-500"
                  style={{
                    top: minutesSinceStart(new Date()) * PX_PER_MINUTE,
                  }}
                >
                  <span className="absolute -left-1 -top-1.5 size-2.5 rounded-full bg-rose-500" />
                </div>
              )}
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}

export function buildDayColumns(dates: Date[], appointments: AppointmentClientDTO[]) {
  return dates.map((date) => {
    const key = date.toISOString().slice(0, 10);
    const count = appointments.filter(
      (a) => new Date(a.startsAt).toDateString() === date.toDateString() && a.status !== "CANCELED",
    ).length;
    return {
      date,
      key,
      label: `${new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
        .format(date)
        .replace(".", "")}, ${new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }).format(date)}`,
      count,
    };
  });
}

export function NowHint({ className }: { className?: string }) {
  return (
    <p className={cn("text-[11px] text-muted-foreground", className)}>
      Dica: duplo clique cria · arrastar move · Shift+arrastar ou alça redimensiona · {formatTime(new Date())}
    </p>
  );
}

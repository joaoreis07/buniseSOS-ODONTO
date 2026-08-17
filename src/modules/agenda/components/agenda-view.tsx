"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { CalendarDays } from "lucide-react";
import { EmptyState } from "@/shared/components/empty-state";
import { PageSkeleton } from "@/shared/components/page-skeleton";
import {
  getAgendaBootstrapAction,
  getAgendaRangeAction,
  rescheduleAppointmentAction,
} from "../actions/agenda.actions";
import type {
  AgendaBootstrapDTO,
  AgendaViewMode,
  AppointmentClientDTO,
  ScheduleBlockClientDTO,
} from "../dto/agenda.dto";
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  formatDayLabel,
  rangeForView,
  startOfMonth,
  startOfWeek,
} from "../utils/agenda.utils";
import { AgendaSidebar } from "./agenda-sidebar";
import { AgendaToolbar } from "./agenda-toolbar";
import { AppointmentFormDialog } from "./appointment-form-dialog";
import { AppointmentSheet } from "./appointment-sheet";
import { NowHint, TimeGrid, buildDayColumns } from "./time-grid";
import { STATUS_META, formatTime } from "../utils/agenda.utils";
import { cn } from "@/shared/lib/utils";

export function AgendaView({
  canManage,
  canViewFinance = false,
}: {
  canManage: boolean;
  canViewFinance?: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [bootstrap, setBootstrap] = useState<AgendaBootstrapDTO | null>(null);
  const [appointments, setAppointments] = useState<AppointmentClientDTO[]>([]);
  const [blocks, setBlocks] = useState<ScheduleBlockClientDTO[]>([]);
  const [view, setView] = useState<AgendaViewMode>("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const [search, setSearch] = useState("");
  const [includeCanceled, setIncludeCanceled] = useState(false);
  const [showWeekends, setShowWeekends] = useState(true);
  const [selectedProfessionalIds, setSelectedProfessionalIds] = useState<string[]>([]);
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [selectedChairIds, setSelectedChairIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<AppointmentClientDTO | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [draftStart, setDraftStart] = useState(() => new Date());
  const [draftEnd, setDraftEnd] = useState(() => new Date(Date.now() + 30 * 60_000));
  const [, startTransition] = useTransition();

  const loadRange = useCallback(async () => {
    const { from, to } = rangeForView(view, anchor);
    const result = await getAgendaRangeAction({
      from: from.toISOString(),
      to: to.toISOString(),
      professionalIds: selectedProfessionalIds,
      roomIds: selectedRoomIds.length > 0 ? selectedRoomIds : undefined,
      chairIds: selectedChairIds.length > 0 ? selectedChairIds : undefined,
      search: search.trim() || undefined,
      includeCanceled,
    });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setAppointments(result.data.appointments);
    setBlocks(result.data.blocks);
  }, [
    view,
    anchor,
    selectedProfessionalIds,
    selectedRoomIds,
    selectedChairIds,
    search,
    includeCanceled,
  ]);

  useEffect(() => {
    void (async () => {
      const boot = await getAgendaBootstrapAction();
      if (!boot.success) {
        toast.error(boot.error);
        setLoading(false);
        return;
      }
      setBootstrap(boot.data);
      setSelectedProfessionalIds(boot.data.professionals.map((p) => p.id));
      setSelectedRoomIds(boot.data.rooms.map((r) => r.id));
      setSelectedChairIds(boot.data.chairs.map((c) => c.id));
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!bootstrap) return;
    const handle = setTimeout(() => {
      void loadRange();
    }, 120);
    return () => clearTimeout(handle);
  }, [bootstrap, loadRange]);

  const visibleDays = useMemo(() => {
    const { from, to } = rangeForView(view === "month" ? "week" : view, anchor);
    if (view === "day" || view === "timeline") return [new Date(anchor)];
    if (view === "month") return eachDayOfInterval(startOfWeek(startOfMonth(anchor)), endOfMonth(anchor));
    let days = eachDayOfInterval(from, to);
    if (!showWeekends) days = days.filter((d) => d.getDay() !== 0 && d.getDay() !== 6);
    return days;
  }, [view, anchor, showWeekends]);

  const title = useMemo(() => {
    if (view === "day" || view === "timeline") {
      return new Intl.DateTimeFormat("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      }).format(anchor);
    }
    if (view === "month") {
      return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(anchor);
    }
    const start = startOfWeek(anchor);
    const end = addDays(start, 6);
    const monthYear = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
      anchor,
    );
    return `${start.getDate()} – ${end.getDate()} de ${monthYear}`;
  }, [view, anchor]);

  function toggle(list: string[], id: string, setter: (v: string[]) => void) {
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  function openCreate(startsAt: Date, endsAt: Date) {
    if (!canManage) return;
    setDraftStart(startsAt);
    setDraftEnd(endsAt);
    setFormOpen(true);
  }

  function onReschedule(id: string, startsAt: Date, endsAt: Date) {
    if (!canManage) return;
    startTransition(async () => {
      const result = await rescheduleAppointmentAction({
        id,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setAppointments((prev) => prev.map((a) => (a.id === id ? result.data : a)));
      if (selected?.id === id) setSelected(result.data);
      toast.success("Horário atualizado");
    });
  }

  if (loading || !bootstrap) return <PageSkeleton />;

  const dayColumns = buildDayColumns(
    view === "month" ? visibleDays.slice(0, 7) : visibleDays,
    appointments,
  );

  return (
    <div className="space-y-3">
      <header className="flex flex-col gap-3">
        <h2 className="text-[26px] font-semibold tracking-[-0.035em] text-foreground">Agenda</h2>
        <AgendaToolbar
          view={view}
          onViewChange={setView}
          anchor={anchor}
          onAnchorChange={setAnchor}
          search={search}
          onSearchChange={setSearch}
          includeCanceled={includeCanceled}
          onIncludeCanceledChange={setIncludeCanceled}
          showWeekends={showWeekends}
          onShowWeekendsChange={setShowWeekends}
          onCreate={() => openCreate(new Date(), new Date(Date.now() + 30 * 60_000))}
          title={title}
        />
      </header>

      <div className="flex flex-col gap-3 lg:h-[calc(100vh-11.5rem)] lg:min-h-[560px] lg:flex-row">
        <AgendaSidebar
        anchor={anchor}
        onAnchorChange={setAnchor}
        professionals={bootstrap.professionals}
        rooms={bootstrap.rooms}
        chairs={bootstrap.chairs}
        selectedProfessionalIds={selectedProfessionalIds}
        selectedRoomIds={selectedRoomIds}
        selectedChairIds={selectedChairIds}
        onToggleProfessional={(id) =>
          toggle(selectedProfessionalIds, id, setSelectedProfessionalIds)
        }
        onToggleRoom={(id) => toggle(selectedRoomIds, id, setSelectedRoomIds)}
        onToggleChair={(id) => toggle(selectedChairIds, id, setSelectedChairIds)}
        waitingList={bootstrap.waitingList}
        returnAlerts={bootstrap.returnAlerts}
        onReturnCompleted={(id) =>
          setBootstrap((prev) =>
            prev
              ? {
                  ...prev,
                  returnAlerts: prev.returnAlerts.filter((item) => item.id !== id),
                }
              : prev,
          )
        }
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
        {(view === "day" || view === "week" || view === "timeline") && <NowHint />}

        {(view === "day" || view === "week" || view === "timeline") && (
          <TimeGrid
            days={
              view === "timeline"
                ? buildDayColumns([anchor], appointments)
                : dayColumns
            }
            appointments={appointments}
            blocks={blocks}
            onSelectAppointment={(appt) => {
              setSelected(appt);
              setSheetOpen(true);
            }}
            onCreateAt={openCreate}
            onReschedule={onReschedule}
          />
        )}

        {view === "month" && (
          <MonthView
            anchor={anchor}
            appointments={appointments}
            showWeekends={showWeekends}
            onSelectDay={setAnchor}
            onSelectAppointment={(appt) => {
              setSelected(appt);
              setSheetOpen(true);
            }}
          />
        )}

        {view === "list" && (
          <ListView
            appointments={appointments}
            onSelect={(appt) => {
              setSelected(appt);
              setSheetOpen(true);
            }}
          />
        )}
        </div>
      </div>

      <AppointmentSheet
        appointment={selected}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        canManage={canManage}
        canViewFinance={canViewFinance}
        onUpdated={(appt) => {
          setSelected(appt);
          setAppointments((prev) => prev.map((a) => (a.id === appt.id ? appt : a)));
        }}
      />

      <AppointmentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        professionals={bootstrap.professionals}
        rooms={bootstrap.rooms}
        chairs={bootstrap.chairs}
        initialStart={draftStart}
        initialEnd={draftEnd}
        onCreated={(created) => {
          setAppointments((prev) => [...prev, ...created]);
          void loadRange();
        }}
      />
    </div>
  );
}

function MonthView({
  anchor,
  appointments,
  showWeekends,
  onSelectDay,
  onSelectAppointment,
}: {
  anchor: Date;
  appointments: AppointmentClientDTO[];
  showWeekends: boolean;
  onSelectDay: (date: Date) => void;
  onSelectAppointment: (appointment: AppointmentClientDTO) => void;
}) {
  const start = startOfWeek(startOfMonth(anchor));
  const end = endOfWeek(endOfMonth(anchor));
  const days = eachDayOfInterval(start, end).filter(
    (d) => showWeekends || (d.getDay() !== 0 && d.getDay() !== 6),
  );
  const cols = showWeekends ? 7 : 5;
  const headers = showWeekends
    ? ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]
    : ["Seg", "Ter", "Qua", "Qui", "Sex"];

  return (
    <div className="surface-card min-h-0 flex-1 overflow-auto">
      <div
        className="grid border-b border-border"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {headers.map((label) => (
          <div
            key={label}
            className="border-r border-border px-2 py-2 text-center text-[11px] font-medium text-muted-foreground last:border-r-0"
          >
            {label}
          </div>
        ))}
      </div>
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {days.map((day) => {
          const items = appointments.filter(
            (a) => new Date(a.startsAt).toDateString() === day.toDateString(),
          );
          const inMonth = day.getMonth() === anchor.getMonth();
          const isToday = day.toDateString() === new Date().toDateString();
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectDay(day)}
              className={cn(
                "min-h-[108px] border-b border-r border-border p-1.5 text-left last:border-r-0 hover:bg-muted/40",
                !inMonth && "opacity-40",
                isToday && "bg-brand-50/20",
              )}
            >
              <p
                className={cn(
                  "mb-1 grid size-6 place-items-center rounded-full text-[11px] font-medium",
                  isToday && "bg-primary text-white",
                )}
              >
                {day.getDate()}
              </p>
              <div className="space-y-0.5">
                {items.slice(0, 3).map((item) => (
                  <span
                    key={item.id}
                    role="presentation"
                    className="block w-full truncate rounded-sm px-1 py-0.5 text-left text-[10px] font-medium"
                    style={{
                      backgroundColor: `${item.professionalColor}22`,
                      borderLeft: `2px solid ${item.professionalColor}`,
                      color: "var(--foreground)",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAppointment(item);
                    }}
                  >
                    {formatTime(item.startsAt)} {item.patientName}
                  </span>
                ))}
                {items.length > 3 && (
                  <p className="text-[10px] text-muted-foreground">+{items.length - 3}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ListView({
  appointments,
  onSelect,
}: {
  appointments: AppointmentClientDTO[];
  onSelect: (appointment: AppointmentClientDTO) => void;
}) {
  const sorted = [...appointments].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );

  if (sorted.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="Nenhuma consulta neste período"
        description="Ajuste a data, os filtros ou crie uma nova consulta."
      />
    );
  }

  return (
    <div className="surface-card min-h-0 flex-1 overflow-auto">
      <div className="grid grid-cols-[1.2fr_1.1fr_1fr_110px] gap-3 border-b border-border px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        <span>Paciente</span>
        <span>Horário</span>
        <span>Profissional</span>
        <span>Status</span>
      </div>
      {sorted.map((item) => {
        const status = STATUS_META[item.status];
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item)}
            className="grid w-full grid-cols-[1.2fr_1.1fr_1fr_110px] gap-3 border-b border-border px-4 py-2.5 text-left text-sm last:border-b-0 hover:bg-muted/40"
          >
            <span className="min-w-0 truncate font-medium">
              {item.patientName}
              {item.procedure ? (
                <span className="block truncate text-xs text-muted-foreground">{item.procedure}</span>
              ) : null}
            </span>
            <span className="text-sm text-foreground">
              {formatDayLabel(new Date(item.startsAt))} · {formatTime(item.startsAt)}–
              {formatTime(item.endsAt)}
            </span>
            <span className="flex items-center gap-2 truncate">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: item.professionalColor }}
              />
              {item.professionalName}
            </span>
            <span className={cn("status-pill justify-self-start", status.tone)}>{status.label}</span>
          </button>
        );
      })}
    </div>
  );
}

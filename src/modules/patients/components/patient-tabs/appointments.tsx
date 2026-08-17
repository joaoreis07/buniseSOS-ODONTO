"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { Ban, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Plus, Star } from "lucide-react";
import { toast } from "sonner";
import {
  getAgendaBootstrapAction,
  getAgendaRangeAction,
  rescheduleAppointmentAction,
} from "@/modules/agenda/actions/agenda.actions";
import { AppointmentFormDialog } from "@/modules/agenda/components/appointment-form-dialog";
import { AppointmentSheet } from "@/modules/agenda/components/appointment-sheet";
import { TimeGrid, buildDayColumns } from "@/modules/agenda/components/time-grid";
import type {
  AgendaBootstrapDTO,
  AppointmentClientDTO,
} from "@/modules/agenda/dto/agenda.dto";
import {
  addDays,
  eachDayOfInterval,
  rangeForView,
  startOfWeek,
} from "@/modules/agenda/utils/agenda.utils";
import { EmptyState } from "@/shared/components/empty-state";
import { SectionCard } from "@/shared/components/section-card";
import { Button } from "@/shared/components/ui/button";
import type { PatientAppointmentHistoryDTO, PatientClientDTO } from "../../dto/patient.dto";

const STATUS_LABEL: Record<PatientAppointmentHistoryDTO["status"], { label: string; tone: string }> = {
  SCHEDULED: { label: "Agendada", tone: "status-info" },
  CONFIRMED: { label: "Confirmado", tone: "status-info" },
  WAITING: { label: "Aguardando", tone: "status-warning" },
  IN_PROGRESS: { label: "Em atendimento", tone: "status-info" },
  COMPLETED: { label: "Realizada", tone: "status-success" },
  CANCELED: { label: "Cancelada", tone: "status-danger" },
  NO_SHOW: { label: "Não compareceu", tone: "status-neutral" },
};

function formatDay(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit" }).format(new Date(iso));
}

function formatMonth(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(new Date(iso)).replace(".", "").toUpperCase();
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

export function PatientAppointmentsTab({
  patient,
  appointments,
  canManage,
}: {
  patient: PatientClientDTO;
  appointments?: PatientAppointmentHistoryDTO[];
  canManage?: boolean;
}) {
  const history = useMemo(() => appointments ?? [], [appointments]);
  const [view, setView] = useState<"day" | "week">("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const [bootstrap, setBootstrap] = useState<AgendaBootstrapDTO | null>(null);
  const [weekAppointments, setWeekAppointments] = useState<AppointmentClientDTO[]>([]);
  const [loading, setLoading] = useState(true);
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
      includeCanceled: true,
    });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setWeekAppointments(result.data.appointments.filter((item) => item.patientId === patient.id));
  }, [view, anchor, patient.id]);

  useEffect(() => {
    void (async () => {
      const boot = await getAgendaBootstrapAction();
      if (!boot.success) {
        toast.error(boot.error);
        setLoading(false);
        return;
      }
      setBootstrap(boot.data);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!bootstrap) return;
    void loadRange();
  }, [bootstrap, loadRange]);

  const visibleDays = useMemo(() => {
    const { from, to } = rangeForView(view, anchor);
    return view === "day" ? [new Date(anchor)] : eachDayOfInterval(from, to);
  }, [view, anchor]);

  const title = useMemo(() => {
    if (view === "day") {
      return new Intl.DateTimeFormat("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      }).format(anchor);
    }
    const start = startOfWeek(anchor);
    const end = addDays(start, 6);
    return `${start.getDate()} – ${end.getDate()} de ${new Intl.DateTimeFormat("pt-BR", {
      month: "long",
      year: "numeric",
    }).format(anchor)}`;
  }, [view, anchor]);

  const upcoming = useMemo(
    () =>
      history
        .filter((item) => new Date(item.startsAt).getTime() >= Date.now() && item.status !== "CANCELED")
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
        .slice(0, 5),
    [history],
  );

  const past = useMemo(
    () =>
      history
        .filter((item) => new Date(item.startsAt).getTime() < Date.now() || item.status === "COMPLETED")
        .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
        .slice(0, 6),
    [history],
  );

  const summary = useMemo(
    () => ({
      scheduled: history.filter((item) =>
        ["SCHEDULED", "CONFIRMED", "WAITING", "IN_PROGRESS"].includes(item.status),
      ).length,
      done: history.filter((item) => item.status === "COMPLETED").length,
      pending: history.filter((item) => item.status === "SCHEDULED" || item.status === "WAITING").length,
      canceled: history.filter((item) => item.status === "CANCELED" || item.status === "NO_SHOW").length,
    }),
    [history],
  );

  function shift(amount: number) {
    setAnchor(addDays(anchor, view === "day" ? amount : amount * 7));
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
      setWeekAppointments((prev) => prev.map((item) => (item.id === id ? result.data : item)));
      if (selected?.id === id) setSelected(result.data);
      toast.success("Horário atualizado");
    });
  }

  const dayColumns = buildDayColumns(visibleDays, weekAppointments);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.9fr)]">
      <section className="surface-card flex min-h-0 flex-col overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <p className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">
              Agenda do paciente
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Visualize e gerencie os compromissos deste paciente.
            </p>
          </div>
          {canManage ? (
            <Button
              type="button"
              size="sm"
              onClick={() => openCreate(new Date(), new Date(Date.now() + 30 * 60_000))}
            >
              <Plus className="size-3.5" />
              Novo agendamento
            </Button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setAnchor(new Date())}>
              Hoje
            </Button>
            <div className="flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label="Período anterior"
                onClick={() => shift(-1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label="Próximo período"
                onClick={() => shift(1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
            <p className="text-sm font-semibold capitalize text-foreground">{title}</p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-0.5">
            <Button
              type="button"
              size="sm"
              variant={view === "day" ? "default" : "ghost"}
              className="h-7 px-2.5"
              onClick={() => setView("day")}
            >
              Dia
            </Button>
            <Button
              type="button"
              size="sm"
              variant={view === "week" ? "default" : "ghost"}
              className="h-7 px-2.5"
              onClick={() => setView("week")}
            >
              Semana
            </Button>
          </div>
        </div>

        <div className="flex min-h-[520px] max-h-[680px] flex-1 flex-col overflow-hidden">
          {loading ? (
            <p className="p-6 text-sm text-muted-foreground">Carregando agenda...</p>
          ) : !bootstrap ? (
            <div className="p-6">
              <EmptyState
                icon={CalendarDays}
                title="Agenda indisponível"
                description="Não foi possível carregar a grade de horários deste paciente."
              />
            </div>
          ) : (
            <TimeGrid
              days={dayColumns}
              appointments={weekAppointments}
              blocks={[]}
              framed={false}
              cardTitleMode="procedure"
              onSelectAppointment={(appt) => {
                setSelected(appt);
                setSheetOpen(true);
              }}
              onCreateAt={openCreate}
              onReschedule={onReschedule}
            />
          )}
        </div>

        {canManage ? (
          <div className="flex justify-center border-t border-border px-5 py-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => openCreate(new Date(), new Date(Date.now() + 30 * 60_000))}
            >
              <Plus className="size-3.5" />
              Novo agendamento
            </Button>
          </div>
        ) : null}
      </section>

      <aside className="space-y-4">
        <SectionCard title="Próximos compromissos">
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum compromisso futuro.</p>
          ) : (
            <ul className="space-y-3">
              {upcoming.map((item) => (
                <li key={item.id} className="flex items-start gap-3">
                  <span className="grid size-12 shrink-0 place-items-center rounded-lg border border-border bg-muted/40 text-center">
                    <span className="text-base font-semibold leading-none">{formatDay(item.startsAt)}</span>
                    <span className="mt-0.5 text-[9px] font-semibold uppercase">{formatMonth(item.startsAt)}</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">
                        {item.procedure || item.title || "Consulta odontológica"}
                      </p>
                      <span className={`status-pill ${STATUS_LABEL[item.status].tone}`}>
                        {STATUS_LABEL[item.status].label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatTime(item.startsAt)} · {item.professionalName}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Consultas passadas">
          {past.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma consulta anterior.</p>
          ) : (
            <ul className="space-y-2.5">
              {past.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 border-b border-border pb-2.5 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {item.procedure || item.title || "Consulta odontológica"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat("pt-BR").format(new Date(item.startsAt))} · {formatTime(item.startsAt)} · {item.professionalName}
                    </p>
                  </div>
                  <span className={`status-pill ${STATUS_LABEL[item.status].tone}`}>
                    {STATUS_LABEL[item.status].label}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Resumo da agenda">
          <div className="grid grid-cols-2 gap-3">
            <MiniStat icon={CalendarDays} label="Consultas agendadas" value={summary.scheduled} tone="primary" />
            <MiniStat icon={CheckCircle2} label="Realizadas" value={summary.done} tone="success" />
            <MiniStat icon={Clock3} label="Pendentes" value={summary.pending} tone="warning" />
            <MiniStat icon={Ban} label="Canceladas" value={summary.canceled} tone="danger" />
          </div>
        </SectionCard>

        <SectionCard title="Observações importantes">
          {patient.allergies ? (
            <div className="flex gap-3 rounded-lg border border-[var(--warning-surface)] bg-[var(--warning-surface)]/60 p-3">
              <Star className="mt-0.5 size-4 shrink-0 text-[var(--warning-foreground)]" />
              <div>
                <p className="text-sm font-medium text-foreground">{patient.allergies}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Registrado em {new Intl.DateTimeFormat("pt-BR").format(new Date(patient.createdAt))}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma observação clínica destacada.</p>
          )}
        </SectionCard>
      </aside>

      <AppointmentSheet
        appointment={selected}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        canManage={Boolean(canManage)}
        onUpdated={(appt) => {
          setSelected(appt);
          setWeekAppointments((prev) => prev.map((item) => (item.id === appt.id ? appt : item)));
        }}
      />

      {bootstrap ? (
        <AppointmentFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          professionals={bootstrap.professionals}
          rooms={bootstrap.rooms}
          chairs={bootstrap.chairs}
          initialStart={draftStart}
          initialEnd={draftEnd}
          defaultPatient={{
            id: patient.id,
            name: patient.preferredName || patient.fullName,
            phone: patient.phone,
          }}
          onCreated={(created) => {
            setWeekAppointments((prev) => [
              ...prev,
              ...created.filter((item) => item.patientId === patient.id),
            ]);
            void loadRange();
          }}
        />
      ) : null}
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: number;
  tone: "primary" | "success" | "warning" | "danger";
}) {
  const toneClass = {
    primary: "bg-brand-50 text-primary",
    success: "bg-[var(--success-surface)] text-[var(--success-foreground)]",
    warning: "bg-[var(--warning-surface)] text-[var(--warning-foreground)]",
    danger: "bg-[var(--danger-surface)] text-[var(--danger-foreground)]",
  }[tone];

  return (
    <div className="rounded-lg border border-border p-3">
      <span className={`mb-2 grid size-8 place-items-center rounded-lg ${toneClass}`}>
        <Icon className="size-4" />
      </span>
      <p className="text-xl font-semibold tracking-[-0.03em]">{value}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

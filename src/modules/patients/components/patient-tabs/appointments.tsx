"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Clock3, MapPin, Stethoscope } from "lucide-react";
import { EmptyState } from "@/shared/components/empty-state";
import { listPatientAppointmentHistoryAction } from "../../actions/patient.actions";
import type { PatientAppointmentHistoryDTO, PatientClientDTO } from "../../dto/patient.dto";

const STATUS_LABEL: Record<PatientAppointmentHistoryDTO["status"], string> = {
  SCHEDULED: "Agendada",
  CONFIRMED: "Confirmada",
  WAITING: "Aguardando",
  IN_PROGRESS: "Em atendimento",
  COMPLETED: "Concluída",
  CANCELED: "Cancelada",
  NO_SHOW: "Não compareceu",
};

export function PatientAppointmentsTab({ patient }: { patient: PatientClientDTO }) {
  const [items, setItems] = useState<PatientAppointmentHistoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void listPatientAppointmentHistoryAction(patient.id).then((result) => {
      if (!active) return;
      if (!result.success) {
        setError(result.error);
        setLoading(false);
        return;
      }
      setItems(result.data);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [patient.id]);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-muted/30 p-3 text-sm">
        <p className="font-medium">Consultas futuras</p>
        <p className="mt-1 text-muted-foreground">
          {patient.upcomingAppointmentsCount > 0
            ? `${patient.upcomingAppointmentsCount} consulta(s) agendada(s) na Agenda.`
            : "Nenhuma consulta futura vinculada."}
        </p>
        {patient.hasReturnAlert && (
          <p className="mt-2 text-amber-700">Há alerta de retorno pendente.</p>
        )}
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="h-20 animate-pulse rounded-xl bg-muted" />
          <div className="h-20 animate-pulse rounded-xl bg-muted" />
        </div>
      ) : error ? (
        <EmptyState icon={CalendarDays} title="Não foi possível carregar o histórico" description={error} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Sem consultas registradas"
          description="As consultas agendadas ou concluídas para este paciente aparecerão aqui."
        />
      ) : (
        <div className="space-y-2">
          {items.map((appointment) => (
            <article key={appointment.id} className="rounded-xl border border-border bg-muted/30 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {appointment.procedure || appointment.title || "Consulta odontológica"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat("pt-BR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(appointment.startsAt))}
                  </p>
                </div>
                <span className="rounded-full bg-background px-2 py-1 text-[11px] font-medium">
                  {STATUS_LABEL[appointment.status]}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Stethoscope className="size-3" />
                  {appointment.professionalName}
                </span>
                {appointment.roomName && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3" />
                    {appointment.roomName}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="size-3" />
                  até{" "}
                  {new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" }).format(
                    new Date(appointment.endsAt),
                  )}
                </span>
              </div>
              {appointment.notes && (
                <p className="mt-3 whitespace-pre-wrap border-t border-border pt-3 text-sm text-muted-foreground">
                  {appointment.notes}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

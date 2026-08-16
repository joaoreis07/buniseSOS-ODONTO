"use client";

import { useEffect, useMemo, useState } from "react";
import { History } from "lucide-react";
import { EmptyState } from "@/shared/components/empty-state";
import { SectionCard } from "@/shared/components/section-card";
import { getClinicalRecordAction } from "@/modules/clinical-records/actions/clinical-record.actions";
import type { TimelineEntryDTO } from "@/modules/clinical-records/dto/clinical-record.dto";
import type { PatientAppointmentHistoryDTO, PatientClientDTO } from "../../dto/patient.dto";

const APPOINTMENT_LABEL: Record<PatientAppointmentHistoryDTO["status"], string> = {
  SCHEDULED: "Consulta agendada",
  CONFIRMED: "Consulta confirmada",
  WAITING: "Paciente em espera",
  IN_PROGRESS: "Em atendimento",
  COMPLETED: "Consulta realizada",
  CANCELED: "Consulta cancelada",
  NO_SHOW: "Não compareceu",
};

type HistoryItem = {
  id: string;
  at: string;
  title: string;
  subtitle: string | null;
};

export function PatientHistoryTab({
  patient,
  appointments,
}: {
  patient: PatientClientDTO;
  appointments: PatientAppointmentHistoryDTO[];
}) {
  const [clinical, setClinical] = useState<TimelineEntryDTO[]>([]);

  useEffect(() => {
    void getClinicalRecordAction({ patientId: patient.id }).then((result) => {
      if (result.success) setClinical(result.data.timeline);
    });
  }, [patient.id]);

  const items = useMemo(() => {
    const fromAppointments: HistoryItem[] = appointments.map((item) => ({
      id: `appt-${item.id}`,
      at: item.startsAt,
      title: item.procedure || item.title || APPOINTMENT_LABEL[item.status],
      subtitle: `${APPOINTMENT_LABEL[item.status]} · ${item.professionalName}`,
    }));
    const fromClinical: HistoryItem[] = clinical.map((entry) => ({
      id: `clin-${entry.kind}-${entry.id}`,
      at: entry.occurredAt,
      title: entry.title,
      subtitle: [entry.subtitle, entry.professionalName].filter(Boolean).join(" · ") || null,
    }));
    return [...fromAppointments, ...fromClinical].sort((a, b) => b.at.localeCompare(a.at));
  }, [appointments, clinical]);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="Sem histórico"
        description="Consultas e evoluções clínicas deste paciente aparecerão aqui."
      />
    );
  }

  return (
    <SectionCard title="Histórico" description="Consultas e eventos clínicos já registrados nesta ficha.">
      <ol className="space-y-4">
        {items.map((item, index) => (
          <li key={item.id} className="relative flex gap-3">
            {index < items.length - 1 ? (
              <span className="absolute left-[7px] top-5 bottom-[-16px] w-px bg-border" />
            ) : null}
            <span className="relative z-10 mt-1.5 size-2.5 shrink-0 rounded-full bg-primary" />
            <div className="min-w-0 pb-1">
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {new Intl.DateTimeFormat("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date(item.at))}
                {item.subtitle ? ` · ${item.subtitle}` : ""}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </SectionCard>
  );
}

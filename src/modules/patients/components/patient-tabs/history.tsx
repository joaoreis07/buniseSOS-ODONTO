"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { History } from "lucide-react";
import { EmptyState } from "@/shared/components/empty-state";
import { Button } from "@/shared/components/ui/button";
import { getPatientTimelineAction } from "../../actions/patient.actions";
import type { PatientTimelineEntryDTO, PatientTimelineKind } from "../../dto/patient.dto";
import type { PatientClientDTO } from "../../dto/patient.dto";
import { budgetEventLabel } from "@/modules/budgets/utils/budget-status";

const KIND_LABEL: Record<PatientTimelineKind, string> = {
  appointment: "Consulta",
  treatment: "Tratamento",
  procedure: "Procedimento",
  budget: "Orçamento",
  approval: "Aprovação",
  payment: "Pagamento",
  document: "Documento",
  note: "Anotação",
  clinical: "Alteração clínica",
  anamnesis: "Anamnese",
};

const APPOINTMENT_STATUS: Record<string, string> = {
  SCHEDULED: "Agendada",
  CONFIRMED: "Confirmada",
  WAITING: "Em espera",
  IN_PROGRESS: "Em atendimento",
  COMPLETED: "Realizada",
  CANCELED: "Cancelada",
  NO_SHOW: "Não compareceu",
};

const FILTERS: { id: "all" | "appointment" | "clinical" | "financial" | "document" | "note"; label: string; kinds?: PatientTimelineKind[] }[] = [
  { id: "all", label: "Todos" },
  { id: "appointment", label: "Consultas", kinds: ["appointment"] },
  { id: "clinical", label: "Clínico", kinds: ["treatment", "procedure", "clinical", "anamnesis"] },
  { id: "financial", label: "Financeiro", kinds: ["budget", "approval", "payment"] },
  { id: "document", label: "Documentos", kinds: ["document"] },
  { id: "note", label: "Anotações", kinds: ["note"] },
];

function kindTone(kind: PatientTimelineKind) {
  if (kind === "payment" || kind === "approval") return "bg-[var(--success-foreground)]";
  if (kind === "note" || kind === "anamnesis") return "bg-[var(--warning-foreground)]";
  if (kind === "document") return "bg-[var(--info-foreground)]";
  if (kind === "appointment") return "bg-primary";
  return "bg-primary";
}

function kindPill(kind: PatientTimelineKind) {
  if (kind === "payment" || kind === "approval") return "status-success";
  if (kind === "note" || kind === "anamnesis") return "status-warning";
  if (kind === "document") return "status-info";
  if (kind === "appointment") return "status-info";
  return "status-neutral";
}

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function descriptionOf(entry: PatientTimelineEntryDTO) {
  if (entry.kind === "appointment" && entry.description) {
    return APPOINTMENT_STATUS[entry.description] ?? entry.description;
  }
  if ((entry.kind === "budget" || entry.kind === "approval") && entry.description) {
    return budgetEventLabel(entry.description);
  }
  return entry.description;
}

export function PatientHistoryTab({ patient }: { patient: PatientClientDTO }) {
  const [items, setItems] = useState<PatientTimelineEntryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");

  const load = useCallback(() => {
    setLoading(true);
    void getPatientTimelineAction(patient.id).then((result) => {
      if (result.success) {
        setItems(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
      setLoading(false);
    });
  }, [patient.id]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const selected = FILTERS.find((item) => item.id === filter);
    if (!selected?.kinds) return items;
    return items.filter((item) => selected.kinds!.includes(item.kind));
  }, [filter, items]);

  if (loading) return <p className="text-sm text-muted-foreground">Carregando histórico...</p>;

  if (error && items.length === 0) {
    return (
      <div className="surface-card p-5">
        <p className="font-medium text-destructive">Não foi possível carregar o histórico</p>
        <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        <Button type="button" size="sm" className="mt-3" onClick={load}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">Histórico</p>
          <p className="text-sm text-muted-foreground">
            Linha do tempo deste paciente. Eventos anteriores não são apagados.
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                filter === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={History}
          title={items.length === 0 ? "Sem histórico" : "Nenhum evento neste filtro"}
          description="Consultas, tratamentos, orçamentos, pagamentos, documentos e anotações aparecem aqui."
        />
      ) : (
        <ol className="space-y-0">
          {visible.map((item, index) => (
            <li key={item.id} className="relative flex gap-3 py-1.5">
              {index < visible.length - 1 ? (
                <span className="absolute left-[7px] top-6 bottom-0 w-px bg-border" />
              ) : null}
              <span className={`relative z-10 mt-1.5 size-2 shrink-0 rounded-full ${kindTone(item.kind)}`} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <span className={`status-pill ${kindPill(item.kind)}`}>{KIND_LABEL[item.kind]}</span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatWhen(item.at)}
                  {item.actorName ? ` · ${item.actorName}` : ""}
                  {descriptionOf(item) ? ` · ${descriptionOf(item)}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

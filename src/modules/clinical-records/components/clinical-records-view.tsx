"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Calendar, FileText, NotebookPen, Plus, Stethoscope, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  createEvolutionAction,
  deleteEvolutionAction,
  getClinicalRecordAction,
  getClinicalRecordEditorDataAction,
  listClinicalRecordPatientsAction,
  updateEvolutionAction,
  upsertAnamnesisAction,
} from "../actions/clinical-record.actions";
import type {
  AnamnesisDTO,
  ClinicalEvolutionDTO,
  ClinicalRecordDTO,
  ClinicalRecordEditorDataDTO,
  TimelineEntryDTO,
} from "../dto/clinical-record.dto";
import { parseTeethInput } from "../schemas/clinical-record.schemas";

function displayName(name: string, preferredName: string | null) {
  return preferredName ? `${name} (${preferredName})` : name;
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function ClinicalRecordsView({
  initialPatientId,
  initialAppointmentId,
  initialPlanItemId,
  openEvolutionForm,
  canManageRecords,
  canDeleteRecords,
  canManageAnamnesis,
}: {
  initialPatientId?: string;
  initialAppointmentId?: string;
  initialPlanItemId?: string;
  openEvolutionForm?: boolean;
  canManageRecords: boolean;
  canDeleteRecords: boolean;
  canManageAnamnesis: boolean;
}) {
  const [patients, setPatients] = useState<{ id: string; name: string; preferredName: string | null }[]>([]);
  const [patientId, setPatientId] = useState(initialPatientId ?? "");
  const [record, setRecord] = useState<ClinicalRecordDTO | null>(null);
  const [editor, setEditor] = useState<ClinicalRecordEditorDataDTO | null>(null);
  const [selectedEvolution, setSelectedEvolution] = useState<ClinicalEvolutionDTO | null>(null);
  const [showEvolutionForm, setShowEvolutionForm] = useState(openEvolutionForm ?? false);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();

  const [anamnesisForm, setAnamnesisForm] = useState<Partial<AnamnesisDTO>>({});
  const [evolutionForm, setEvolutionForm] = useState({
    title: "",
    description: "",
    notes: "",
    teeth: "",
    professionalId: "",
    appointmentId: initialAppointmentId ?? "",
    treatmentPlanItemId: initialPlanItemId ?? "",
    procedureId: "",
  });

  const loadPatients = useCallback(async () => {
    const result = await listClinicalRecordPatientsAction();
    if (result.success) setPatients(result.data);
  }, []);

  const loadRecord = useCallback(async (id: string) => {
    if (!id) return;
    setLoading(true);
    const [recordResult, editorResult] = await Promise.all([
      getClinicalRecordAction({ patientId: id }),
      getClinicalRecordEditorDataAction({ patientId: id }),
    ]);
    setLoading(false);
    if (!recordResult.success) {
      toast.error(recordResult.error);
      return;
    }
    if (!editorResult.success) {
      toast.error(editorResult.error);
      return;
    }
    setRecord(recordResult.data);
    setEditor(editorResult.data);
    setAnamnesisForm(recordResult.data.anamnesis ?? {});
    if (openEvolutionForm) setShowEvolutionForm(true);
  }, [openEvolutionForm]);

  useEffect(() => {
    void loadPatients();
  }, [loadPatients]);

  useEffect(() => {
    if (initialPatientId) {
      setPatientId(initialPatientId);
      void loadRecord(initialPatientId);
    }
  }, [initialPatientId, loadRecord]);

  function handlePatientChange(id: string) {
    setPatientId(id);
    setSelectedEvolution(null);
    setShowEvolutionForm(false);
    void loadRecord(id);
  }

  function saveAnamnesis() {
    if (!patientId || !canManageAnamnesis) return;
    startTransition(async () => {
      const result = await upsertAnamnesisAction({
        patientId,
        expectedUpdatedAt: record?.anamnesis?.updatedAt,
        allergies: anamnesisForm.allergies ?? null,
        medications: anamnesisForm.medications ?? null,
        diseases: anamnesisForm.diseases ?? null,
        surgeries: anamnesisForm.surgeries ?? null,
        medicalHistory: anamnesisForm.medicalHistory ?? null,
        dentalHistory: anamnesisForm.dentalHistory ?? null,
        observations: anamnesisForm.observations ?? null,
        smoking: anamnesisForm.smoking ?? null,
        alcoholUse: anamnesisForm.alcoholUse ?? null,
        oralHygiene: anamnesisForm.oralHygiene ?? null,
        parafunctionalHabits: anamnesisForm.parafunctionalHabits ?? null,
        otherHabits: anamnesisForm.otherHabits ?? null,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      void loadRecord(patientId);
    });
  }

  function saveEvolution() {
    if (!patientId || !canManageRecords) return;
    startTransition(async () => {
      const payload = {
        patientId,
        title: evolutionForm.title,
        description: evolutionForm.description,
        notes: evolutionForm.notes || null,
        teeth: parseTeethInput(evolutionForm.teeth),
        professionalId: evolutionForm.professionalId || null,
        appointmentId: evolutionForm.appointmentId || null,
        treatmentPlanItemId: evolutionForm.treatmentPlanItemId || null,
        procedureId: evolutionForm.procedureId || null,
      };

      const result = selectedEvolution
        ? await updateEvolutionAction({
            ...payload,
            id: selectedEvolution.id,
            expectedUpdatedAt: selectedEvolution.updatedAt,
          })
        : await createEvolutionAction(payload);

      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      setShowEvolutionForm(false);
      setSelectedEvolution(null);
      setEvolutionForm({
        title: "",
        description: "",
        notes: "",
        teeth: "",
        professionalId: "",
        appointmentId: "",
        treatmentPlanItemId: "",
        procedureId: "",
      });
      void loadRecord(patientId);
    });
  }

  function openEvolution(entry?: ClinicalEvolutionDTO) {
    if (entry) {
      setSelectedEvolution(entry);
      setEvolutionForm({
        title: entry.title,
        description: entry.description,
        notes: entry.notes ?? "",
        teeth: entry.teeth.join(", "),
        professionalId: entry.professional?.id ?? "",
        appointmentId: entry.appointment?.id ?? "",
        treatmentPlanItemId: entry.treatmentPlanItem?.id ?? "",
        procedureId: entry.procedure?.id ?? "",
      });
    } else {
      setSelectedEvolution(null);
      setEvolutionForm({
        title: "",
        description: "",
        notes: "",
        teeth: "",
        professionalId: editor?.professionals[0]?.id ?? "",
        appointmentId: initialAppointmentId ?? "",
        treatmentPlanItemId: initialPlanItemId ?? "",
        procedureId: "",
      });
    }
    setShowEvolutionForm(true);
  }

  function removeEvolution(evolution: ClinicalEvolutionDTO) {
    if (!canDeleteRecords || !window.confirm("Remover esta evolução clínica? O registro será arquivado no histórico.")) {
      return;
    }
    startTransition(async () => {
      const result = await deleteEvolutionAction({
        id: evolution.id,
        expectedUpdatedAt: evolution.updatedAt,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(result.message);
      if (selectedEvolution?.id === evolution.id) {
        setSelectedEvolution(null);
        setShowEvolutionForm(false);
      }
      void loadRecord(patientId);
    });
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-4 p-4 lg:flex-row lg:p-6">
      <aside className="w-full shrink-0 space-y-3 lg:w-72">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Prontuário clínico
          </p>
          <h2 className="text-xl font-semibold tracking-[-0.03em]">Pacientes</h2>
        </div>
        <div className="max-h-[60vh] space-y-1 overflow-y-auto rounded-xl border p-2 lg:max-h-[calc(100vh-10rem)]">
          {patients.map((patient) => (
            <button
              key={patient.id}
              type="button"
              onClick={() => handlePatientChange(patient.id)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                patientId === patient.id ? "bg-primary/10 text-primary" : "hover:bg-muted/60"
              }`}
            >
              <UserRound className="size-4 shrink-0 opacity-60" />
              <span className="truncate">{displayName(patient.name, patient.preferredName)}</span>
            </button>
          ))}
        </div>
      </aside>

      <main className="min-h-0 flex-1 space-y-4 overflow-y-auto">
        {!patientId ? (
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center text-muted-foreground">
            <NotebookPen className="mb-3 size-10 opacity-40" />
            <p>Selecione um paciente para visualizar o prontuário.</p>
          </div>
        ) : loading && !record ? (
          <p className="text-sm text-muted-foreground">Carregando prontuário...</p>
        ) : record ? (
          <>
            <header className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold tracking-[-0.03em]">
                  {displayName(record.patient.name, record.patient.preferredName)}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Histórico clínico · {record.evolutions.length} evolução(ões)
                </p>
              </div>
              {canManageRecords && (
                <Button type="button" size="sm" className="rounded-xl" onClick={() => openEvolution()}>
                  <Plus className="mr-1 size-4" />
                  Nova evolução
                </Button>
              )}
            </header>

            <section className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Stethoscope className="size-4 text-primary" />
                  <h3 className="font-semibold">Anamnese</h3>
                </div>
                <div className="grid gap-3">
                  {[
                    ["allergies", "Alergias"],
                    ["medications", "Medicamentos em uso"],
                    ["diseases", "Doenças / condições"],
                    ["surgeries", "Cirurgias anteriores"],
                    ["medicalHistory", "Histórico médico"],
                    ["dentalHistory", "Histórico odontológico"],
                    ["smoking", "Tabagismo"],
                    ["alcoholUse", "Consumo de álcool"],
                    ["oralHygiene", "Higiene oral"],
                    ["parafunctionalHabits", "Hábitos parafuncionais"],
                    ["observations", "Observações"],
                  ].map(([key, label]) => (
                    <div key={key} className="space-y-1">
                      <Label htmlFor={key}>{label}</Label>
                      <Textarea
                        id={key}
                        rows={key.includes("History") || key === "observations" ? 2 : 1}
                        disabled={!canManageAnamnesis}
                        value={(anamnesisForm as Record<string, string | undefined>)[key] ?? ""}
                        onChange={(e) =>
                          setAnamnesisForm((current) => ({ ...current, [key]: e.target.value }))
                        }
                        className="rounded-lg"
                      />
                    </div>
                  ))}
                </div>
                {canManageAnamnesis && (
                  <Button
                    type="button"
                    size="sm"
                    className="mt-4 rounded-lg"
                    disabled={pending}
                    onClick={saveAnamnesis}
                  >
                    Salvar anamnese
                  </Button>
                )}
              </div>

              <div className="rounded-xl border p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Calendar className="size-4 text-primary" />
                  <h3 className="font-semibold">Timeline clínica</h3>
                </div>
                <TimelineList
                  entries={record.timeline}
                  onOpenEvolution={(id) => {
                    const evolution = record.evolutions.find((e) => e.id === id);
                    if (evolution && canManageRecords) openEvolution(evolution);
                  }}
                />
              </div>
            </section>

            {showEvolutionForm && canManageRecords && (
              <section className="rounded-xl border bg-muted/20 p-4">
                <h3 className="mb-3 font-semibold">
                  {selectedEvolution ? "Editar evolução" : "Nova evolução clínica"}
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1 md:col-span-2">
                    <Label>Título</Label>
                    <Input
                      value={evolutionForm.title}
                      onChange={(e) => setEvolutionForm((c) => ({ ...c, title: e.target.value }))}
                      placeholder="Ex.: Restauração — dente 36"
                      className="rounded-lg"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label>Evolução</Label>
                    <Textarea
                      rows={4}
                      value={evolutionForm.description}
                      onChange={(e) => setEvolutionForm((c) => ({ ...c, description: e.target.value }))}
                      placeholder="Descreva o procedimento realizado e observações clínicas."
                      className="rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Dentes FDI</Label>
                    <Input
                      value={evolutionForm.teeth}
                      onChange={(e) => setEvolutionForm((c) => ({ ...c, teeth: e.target.value }))}
                      placeholder="36, 16"
                      className="rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Profissional</Label>
                    <select
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                      value={evolutionForm.professionalId}
                      onChange={(e) => setEvolutionForm((c) => ({ ...c, professionalId: e.target.value }))}
                    >
                      <option value="">Selecione</option>
                      {editor?.professionals.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label>Consulta</Label>
                    <select
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                      value={evolutionForm.appointmentId}
                      onChange={(e) => setEvolutionForm((c) => ({ ...c, appointmentId: e.target.value }))}
                    >
                      <option value="">Nenhuma</option>
                      {editor?.appointments.map((a) => (
                        <option key={a.id} value={a.id}>
                          {formatDateTime(a.startsAt)} · {a.procedure ?? "Consulta"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label>Item do plano</Label>
                    <select
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                      value={evolutionForm.treatmentPlanItemId}
                      onChange={(e) =>
                        setEvolutionForm((c) => ({ ...c, treatmentPlanItemId: e.target.value }))
                      }
                    >
                      <option value="">Nenhum</option>
                      {editor?.planItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.planCode} · {item.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button type="button" size="sm" className="rounded-lg" disabled={pending} onClick={saveEvolution}>
                    {selectedEvolution ? "Atualizar" : "Registrar"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-lg"
                    onClick={() => {
                      setShowEvolutionForm(false);
                      setSelectedEvolution(null);
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </section>
            )}

            <section className="rounded-xl border p-4">
              <div className="mb-3 flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                <h3 className="font-semibold">Evoluções registradas</h3>
              </div>
              <div className="space-y-3">
                {record.evolutions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma evolução registrada.</p>
                ) : (
                  record.evolutions.map((evolution) => (
                    <article
                      key={evolution.id}
                      className="rounded-lg border bg-background p-3 text-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{evolution.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(evolution.occurredAt)}
                            {evolution.professional ? ` · ${evolution.professional.name}` : ""}
                          </p>
                        </div>
                        {canManageRecords && (
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 rounded-lg text-xs"
                              onClick={() => openEvolution(evolution)}
                            >
                              Editar
                            </Button>
                            {canDeleteRecords && (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-7 rounded-lg text-xs text-destructive hover:text-destructive"
                                onClick={() => removeEvolution(evolution)}
                                disabled={pending}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{evolution.description}</p>
                      {evolution.teeth.length > 0 && (
                        <p className="mt-2 text-xs font-medium">Dente(s): {evolution.teeth.join(", ")}</p>
                      )}
                      {evolution.treatmentPlanItem && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Plano: {evolution.treatmentPlanItem.planCode} · {evolution.treatmentPlanItem.title}
                        </p>
                      )}
                    </article>
                  ))
                )}
              </div>
            </section>

            {record.attachments.length > 0 && (
              <section className="rounded-xl border p-4">
                <h3 className="mb-3 font-semibold">Documentos e exames</h3>
                <ul className="space-y-2 text-sm">
                  {record.attachments.map((attachment) => (
                    <li key={attachment.id} className="rounded-lg bg-muted/40 px-3 py-2">
                      <p className="font-medium">{attachment.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {attachment.type}
                        {attachment.occurredAt ? ` · ${formatDate(attachment.occurredAt)}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        ) : null}
      </main>
    </div>
  );
}

function TimelineList({
  entries,
  onOpenEvolution,
}: {
  entries: TimelineEntryDTO[];
  onOpenEvolution: (id: string) => void;
}) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum evento na timeline.</p>;
  }

  return (
    <ol className="space-y-3">
      {entries.map((entry) => (
        <li key={`${entry.kind}-${entry.id}`}>
          <button
            type="button"
            className="w-full rounded-lg border px-3 py-2 text-left transition hover:bg-muted/40"
            onClick={() => entry.kind === "evolution" && onOpenEvolution(entry.id)}
            disabled={entry.kind !== "evolution"}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {formatDate(entry.occurredAt)}
            </p>
            <p className="font-medium">{entry.title}</p>
            {entry.subtitle && <p className="text-sm text-muted-foreground">{entry.subtitle}</p>}
            {entry.professionalName && (
              <p className="mt-1 text-xs text-muted-foreground">{entry.professionalName}</p>
            )}
          </button>
        </li>
      ))}
    </ol>
  );
}

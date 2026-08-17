"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import type { ToothSurface } from "@prisma/client";
import {
  Calendar,
  FileText,
  NotebookPen,
  Plus,
  Smile,
  Stethoscope,
  Trash2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Textarea } from "@/shared/components/ui/textarea";
import { EmptyState } from "@/shared/components/empty-state";
import { formatToothRefs, SURFACE_LABELS } from "@/modules/odontogram/utils/tooth-surfaces";
import { parseTeethInput } from "../schemas/clinical-record.schemas";
import {
  createEvolutionAction,
  deleteEvolutionAction,
  getClinicalRecordAction,
  getClinicalRecordEditorDataAction,
  listAnamnesisRevisionsAction,
  listClinicalRecordPatientsAction,
  updateEvolutionAction,
  upsertAnamnesisAction,
} from "../actions/clinical-record.actions";
import type {
  AnamnesisDTO,
  AnamnesisRevisionDTO,
  ClinicalEvolutionDTO,
  ClinicalRecordDTO,
  ClinicalRecordEditorDataDTO,
  ClinicalToothRefDTO,
  TimelineEntryDTO,
} from "../dto/clinical-record.dto";

type Section = "summary" | "anamnesis" | "history" | "procedures";

const SURFACE_CHIPS: ToothSurface[] = [
  "MESIAL",
  "DISTAL",
  "OCCLUSAL",
  "VESTIBULAR",
  "LINGUAL",
  "INCISAL",
  "CERVICAL",
  "WHOLE",
];

const ANAMNESIS_GROUPS: { title: string; fields: [keyof AnamnesisDTO, string][] }[] = [
  {
    title: "Saúde",
    fields: [
      ["allergies", "Alergias"],
      ["medications", "Medicamentos em uso"],
      ["diseases", "Doenças / condições"],
      ["surgeries", "Cirurgias anteriores"],
      ["medicalHistory", "Histórico médico"],
      ["dentalHistory", "Histórico odontológico"],
    ],
  },
  {
    title: "Hábitos",
    fields: [
      ["smoking", "Tabagismo"],
      ["alcoholUse", "Consumo de álcool"],
      ["oralHygiene", "Higiene oral"],
      ["parafunctionalHabits", "Hábitos parafuncionais"],
      ["otherHabits", "Outros hábitos"],
    ],
  },
  {
    title: "Observações",
    fields: [["observations", "Observações gerais"]],
  },
];

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

function toLocalInput(iso?: string) {
  const date = iso ? new Date(iso) : new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function emptyEvolutionForm(appointmentId = "", planItemId = "") {
  return {
    title: "",
    description: "",
    notes: "",
    teeth: "",
    surfaces: [] as ToothSurface[],
    professionalId: "",
    appointmentId,
    treatmentPlanItemId: planItemId,
    procedureId: "",
    occurredAt: toLocalInput(),
  };
}

function teethToForm(teeth: ClinicalToothRefDTO[]) {
  return {
    teeth: teeth.map((tooth) => tooth.toothNumber).join(", "),
    surfaces: [...new Set(teeth.flatMap((tooth) => tooth.surfaces))],
  };
}

function formToTeeth(teeth: string, surfaces: ToothSurface[]): ClinicalToothRefDTO[] {
  return [...new Set(parseTeethInput(teeth))].map((toothNumber) => ({ toothNumber, surfaces }));
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
  const [revisions, setRevisions] = useState<AnamnesisRevisionDTO[]>([]);
  const [section, setSection] = useState<Section>(openEvolutionForm ? "history" : "history");
  const [selectedEvolution, setSelectedEvolution] = useState<ClinicalEvolutionDTO | null>(null);
  const [showEvolutionForm, setShowEvolutionForm] = useState(openEvolutionForm ?? false);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();

  const [anamnesisForm, setAnamnesisForm] = useState<Partial<AnamnesisDTO>>({});
  const [evolutionForm, setEvolutionForm] = useState(() =>
    emptyEvolutionForm(initialAppointmentId ?? "", initialPlanItemId ?? ""),
  );

  const loadPatients = useCallback(async () => {
    const result = await listClinicalRecordPatientsAction();
    if (result.success) setPatients(result.data);
  }, []);

  const loadRecord = useCallback(
    async (id: string) => {
      if (!id) return;
      setLoading(true);
      const [recordResult, editorResult, revisionResult] = await Promise.all([
        getClinicalRecordAction({ patientId: id }),
        getClinicalRecordEditorDataAction({ patientId: id }),
        listAnamnesisRevisionsAction({ patientId: id }),
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
      setRevisions(revisionResult.success ? revisionResult.data : []);
      if (openEvolutionForm) {
        setSection("history");
        setShowEvolutionForm(true);
      }
    },
    [openEvolutionForm],
  );

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
    setSection("summary");
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
      const occurredAt = evolutionForm.occurredAt
        ? new Date(evolutionForm.occurredAt).toISOString()
        : undefined;
      const payload = {
        patientId,
        title: evolutionForm.title,
        description: evolutionForm.description,
        notes: evolutionForm.notes || null,
        teeth: formToTeeth(evolutionForm.teeth, evolutionForm.surfaces),
        professionalId: evolutionForm.professionalId || null,
        appointmentId: evolutionForm.appointmentId || null,
        treatmentPlanItemId: evolutionForm.treatmentPlanItemId || null,
        procedureId: evolutionForm.procedureId || null,
        occurredAt,
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
      setEvolutionForm(emptyEvolutionForm());
      void loadRecord(patientId);
    });
  }

  function openEvolution(entry?: ClinicalEvolutionDTO) {
    if (entry) {
      setSelectedEvolution(entry);
      const toothForm = teethToForm(entry.teeth);
      setEvolutionForm({
        title: entry.title,
        description: entry.description,
        notes: entry.notes ?? "",
        teeth: toothForm.teeth,
        surfaces: toothForm.surfaces,
        professionalId: entry.professional?.id ?? "",
        appointmentId: entry.appointment?.id ?? "",
        treatmentPlanItemId: entry.treatmentPlanItem?.id ?? "",
        procedureId: entry.procedure?.id ?? "",
        occurredAt: toLocalInput(entry.occurredAt),
      });
    } else {
      setSelectedEvolution(null);
      setEvolutionForm({
        ...emptyEvolutionForm(initialAppointmentId ?? "", initialPlanItemId ?? ""),
        professionalId: editor?.professionals[0]?.id ?? "",
      });
    }
    setSection("history");
    setShowEvolutionForm(true);
  }

  function removeEvolution(evolution: ClinicalEvolutionDTO) {
    if (
      !canDeleteRecords ||
      !window.confirm("Remover esta evolução clínica? O registro será arquivado no histórico.")
    ) {
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

  const lastEvolution = record?.evolutions[0] ?? null;
  const performedProcedures = useMemo(() => {
    if (!record) return [];
    return record.evolutions.filter((evolution) => evolution.procedure);
  }, [record]);

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-4 lg:flex-row">
      <aside className="w-full shrink-0 space-y-3 lg:w-72">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Prontuário clínico
          </p>
          <h2 className="text-xl font-semibold tracking-[-0.03em]">Pacientes</h2>
        </div>
        <div className="surface-card max-h-[60vh] space-y-1 overflow-y-auto p-2 lg:max-h-[calc(100vh-12rem)]">
          {patients.length === 0 ? (
            <p className="px-3 py-6 text-sm text-muted-foreground">Nenhum paciente ativo.</p>
          ) : (
            patients.map((patient) => (
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
            ))
          )}
        </div>
      </aside>

      <main className="min-h-0 flex-1 space-y-4 overflow-y-auto">
        {!patientId ? (
          <EmptyState
            icon={NotebookPen}
            title="Selecione um paciente"
            description="O prontuário reúne anamnese, evoluções e o histórico clínico sem duplicar odontograma, plano ou financeiro."
          />
        ) : loading && !record ? (
          <RecordSkeleton />
        ) : record ? (
          <>
            <header className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-[26px] font-semibold tracking-[-0.035em]">
                  {displayName(record.patient.name, record.patient.preferredName)}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Histórico clínico · {record.evolutions.length} evolução(ões)
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline" className="rounded-lg">
                  <Link href={`/app/odontogram?patientId=${patientId}`}>
                    <Smile className="mr-1 size-4" />
                    Odontograma
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="rounded-lg">
                  <Link href={`/app/treatment-plans?patientId=${patientId}`}>
                    <FileText className="mr-1 size-4" />
                    Plano
                  </Link>
                </Button>
                {canManageRecords && (
                  <Button type="button" size="sm" className="rounded-lg" onClick={() => openEvolution()}>
                    <Plus className="mr-1 size-4" />
                    Nova evolução
                  </Button>
                )}
              </div>
            </header>

            <nav className="flex flex-wrap gap-1">
              {(
                [
                  ["summary", "Resumo"],
                  ["anamnesis", "Anamnese"],
                  ["history", "Evoluções"],
                  ["procedures", "Procedimentos"],
                ] as const
              ).map(([id, label]) => (
                <Button
                  key={id}
                  type="button"
                  size="sm"
                  variant={section === id ? "secondary" : "ghost"}
                  className="rounded-lg"
                  onClick={() => setSection(id)}
                >
                  {label}
                </Button>
              ))}
            </nav>

            {section === "summary" && (
              <SummarySection
                record={record}
                lastEvolution={lastEvolution}
                onOpenHistory={() => setSection("history")}
                onOpenAnamnesis={() => setSection("anamnesis")}
                onOpenEvolution={(evolution) => openEvolution(evolution)}
                canManageRecords={canManageRecords}
              />
            )}

            {section === "anamnesis" && (
              <AnamnesisSection
                form={anamnesisForm}
                setForm={setAnamnesisForm}
                revisions={revisions}
                canManage={canManageAnamnesis}
                pending={pending}
                onSave={saveAnamnesis}
                hasCurrent={Boolean(record.anamnesis)}
              />
            )}

            {section === "history" && (
              <>
                {showEvolutionForm && canManageRecords && (
                  <EvolutionForm
                    form={evolutionForm}
                    setForm={setEvolutionForm}
                    editor={editor}
                    selected={selectedEvolution}
                    pending={pending}
                    onSave={saveEvolution}
                    onCancel={() => {
                      setShowEvolutionForm(false);
                      setSelectedEvolution(null);
                    }}
                  />
                )}
                <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                  <div className="rounded-lg border p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Calendar className="size-4 text-primary" />
                      <h3 className="font-semibold">Timeline clínica</h3>
                    </div>
                    <TimelineList
                      entries={record.timeline}
                      onOpenEvolution={(id) => {
                        const evolution = record.evolutions.find((item) => item.id === id);
                        if (evolution) openEvolution(evolution);
                      }}
                    />
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <FileText className="size-4 text-primary" />
                      <h3 className="font-semibold">Evoluções</h3>
                    </div>
                    {record.evolutions.length === 0 ? (
                      <EmptyState
                        icon={NotebookPen}
                        title="Nenhuma evolução"
                        description="Registre o atendimento clínico sem alterar o odontograma ou o plano."
                        actionLabel={canManageRecords ? "Nova evolução" : undefined}
                        onAction={canManageRecords ? () => openEvolution() : undefined}
                      />
                    ) : (
                      <div className="space-y-3">
                        {record.evolutions.map((evolution) => (
                          <EvolutionCard
                            key={evolution.id}
                            evolution={evolution}
                            canManage={canManageRecords}
                            canDelete={canDeleteRecords}
                            pending={pending}
                            onEdit={() => openEvolution(evolution)}
                            onDelete={() => removeEvolution(evolution)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              </>
            )}

            {section === "procedures" && (
              <section className="rounded-lg border p-4">
                <h3 className="mb-3 font-semibold">Procedimentos realizados</h3>
                {performedProcedures.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum procedimento do catálogo vinculado às evoluções.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {performedProcedures.map((evolution) => (
                      <li key={evolution.id} className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
                        <p className="font-medium">
                          {evolution.procedure?.name}
                          {evolution.teeth.length ? ` · ${formatToothRefs(evolution.teeth)}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(evolution.occurredAt)}
                          {evolution.professional ? ` · ${evolution.professional.name}` : ""}
                          {evolution.procedure?.code ? ` · ${evolution.procedure.code}` : ""}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
                {record.attachments.length > 0 && (
                  <div className="mt-6">
                    <h4 className="mb-2 text-sm font-semibold">Documentos e exames</h4>
                    <ul className="space-y-2 text-sm">
                      {record.attachments.map((attachment) => (
                        <li key={attachment.id} className="rounded-lg bg-muted/40 px-3 py-2">
                          <p className="font-medium">{attachment.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {attachment.type === "EXAM" ? "Exame" : "Documento"}
                            {attachment.occurredAt ? ` · ${formatDate(attachment.occurredAt)}` : ""}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}
          </>
        ) : null}
      </main>
    </div>
  );
}

function RecordSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-40" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    </div>
  );
}

function SummarySection({
  record,
  lastEvolution,
  onOpenHistory,
  onOpenAnamnesis,
  onOpenEvolution,
  canManageRecords,
}: {
  record: ClinicalRecordDTO;
  lastEvolution: ClinicalEvolutionDTO | null;
  onOpenHistory: () => void;
  onOpenAnamnesis: () => void;
  onOpenEvolution: (evolution: ClinicalEvolutionDTO) => void;
  canManageRecords: boolean;
}) {
  const alerts = [
    record.anamnesis?.allergies ? `Alergias: ${record.anamnesis.allergies}` : null,
    record.anamnesis?.medications ? `Medicamentos: ${record.anamnesis.medications}` : null,
    record.anamnesis?.diseases ? `Condições: ${record.anamnesis.diseases}` : null,
  ].filter(Boolean);

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Resumo clínico</h3>
          <Button type="button" size="sm" variant="ghost" className="rounded-lg" onClick={onOpenAnamnesis}>
            Anamnese
          </Button>
        </div>
        {alerts.length > 0 ? (
          <ul className="space-y-1 text-sm">{alerts.map((item) => <li key={item}>{item}</li>)}</ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            {record.anamnesis
              ? "Anamnese registrada. Nenhum alerta clínico em destaque."
              : "Anamnese ainda não preenchida. O registro é opcional."}
          </p>
        )}
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Última evolução</h3>
          <Button type="button" size="sm" variant="ghost" className="rounded-lg" onClick={onOpenHistory}>
            Ver histórico
          </Button>
        </div>
        {lastEvolution ? (
          <button
            type="button"
            className="w-full rounded-lg text-left"
            onClick={() => canManageRecords && onOpenEvolution(lastEvolution)}
          >
            <p className="font-medium">{lastEvolution.title}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(lastEvolution.occurredAt)}
              {lastEvolution.professional ? ` · ${lastEvolution.professional.name}` : ""}
              {lastEvolution.teeth.length ? ` · ${formatToothRefs(lastEvolution.teeth)}` : ""}
            </p>
          </button>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma evolução registrada.</p>
        )}
      </div>
    </section>
  );
}

function AnamnesisSection({
  form,
  setForm,
  revisions,
  canManage,
  pending,
  onSave,
  hasCurrent,
}: {
  form: Partial<AnamnesisDTO>;
  setForm: React.Dispatch<React.SetStateAction<Partial<AnamnesisDTO>>>;
  revisions: AnamnesisRevisionDTO[];
  canManage: boolean;
  pending: boolean;
  onSave: () => void;
  hasCurrent: boolean;
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
      <div className="space-y-6 rounded-lg border p-4">
        <div className="flex items-center gap-2">
          <Stethoscope className="size-4 text-primary" />
          <h3 className="font-semibold">Anamnese odontológica</h3>
        </div>
        {ANAMNESIS_GROUPS.map((group) => (
          <div key={group.title} className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{group.title}</p>
            {group.fields.map(([key, label]) => (
              <div key={key} className="space-y-1">
                <Label htmlFor={key}>{label}</Label>
                <Textarea
                  id={key}
                  rows={key.toLowerCase().includes("history") || key === "observations" ? 2 : 1}
                  disabled={!canManage}
                  value={(form[key] as string | undefined) ?? ""}
                  onChange={(e) => setForm((current) => ({ ...current, [key]: e.target.value }))}
                  className="rounded-lg"
                />
              </div>
            ))}
          </div>
        ))}
        {canManage && (
          <Button type="button" size="sm" className="rounded-lg" disabled={pending} onClick={onSave}>
            {hasCurrent ? "Atualizar anamnese" : "Registrar anamnese"}
          </Button>
        )}
      </div>
      <div className="rounded-lg border p-4">
        <h3 className="mb-3 font-semibold">Histórico de alterações</h3>
        {revisions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {hasCurrent
              ? "A versão atual é a primeira. Alterações futuras ficam registradas aqui."
              : "Ainda não há anamnese para versionar."}
          </p>
        ) : (
          <ol className="space-y-2">
            {revisions.map((revision) => (
              <li key={revision.id} className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
                <p className="font-medium">Versão anterior</p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(revision.createdAt)}
                  {revision.actorName ? ` · ${revision.actorName}` : ""}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

function EvolutionForm({
  form,
  setForm,
  editor,
  selected,
  pending,
  onSave,
  onCancel,
}: {
  form: ReturnType<typeof emptyEvolutionForm>;
  setForm: React.Dispatch<React.SetStateAction<ReturnType<typeof emptyEvolutionForm>>>;
  editor: ClinicalRecordEditorDataDTO | null;
  selected: ClinicalEvolutionDTO | null;
  pending: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  function toggleSurface(surface: ToothSurface) {
    setForm((current) => {
      if (surface === "WHOLE") {
        return { ...current, surfaces: current.surfaces.includes("WHOLE") ? [] : ["WHOLE"] };
      }
      const withoutWhole = current.surfaces.filter((item) => item !== "WHOLE");
      const next = withoutWhole.includes(surface)
        ? withoutWhole.filter((item) => item !== surface)
        : [...withoutWhole, surface];
      return { ...current, surfaces: next };
    });
  }

  return (
    <section className="rounded-lg border bg-muted/20 p-4">
      <h3 className="mb-3 font-semibold">{selected ? "Editar evolução" : "Nova evolução clínica"}</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1 md:col-span-2">
          <Label>Título</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
            placeholder="Ex.: Restauração — dente 36"
            className="rounded-lg"
          />
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label>Evolução</Label>
          <Textarea
            rows={4}
            value={form.description}
            onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
            placeholder="Descreva o procedimento realizado e observações clínicas."
            className="rounded-lg"
          />
        </div>
        <div className="space-y-1">
          <Label>Data e hora</Label>
          <Input
            type="datetime-local"
            value={form.occurredAt}
            onChange={(e) => setForm((current) => ({ ...current, occurredAt: e.target.value }))}
            className="rounded-lg"
          />
        </div>
        <div className="space-y-1">
          <Label>Profissional</Label>
          <select
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            value={form.professionalId}
            onChange={(e) => setForm((current) => ({ ...current, professionalId: e.target.value }))}
          >
            <option value="">Selecione</option>
            {editor?.professionals.map((professional) => (
              <option key={professional.id} value={professional.id}>
                {professional.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label>Dentes FDI</Label>
          <Input
            value={form.teeth}
            onChange={(e) => setForm((current) => ({ ...current, teeth: e.target.value }))}
            placeholder="36, 16"
            className="rounded-lg"
          />
        </div>
        <div className="space-y-1">
          <Label>Faces</Label>
          <div className="flex flex-wrap gap-1.5">
            {SURFACE_CHIPS.map((surface) => (
              <Button
                key={surface}
                type="button"
                size="sm"
                variant={form.surfaces.includes(surface) ? "secondary" : "outline"}
                className="h-8 rounded-lg px-2 text-xs"
                onClick={() => toggleSurface(surface)}
              >
                {SURFACE_LABELS[surface]}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <Label>Procedimento</Label>
          <select
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            value={form.procedureId}
            onChange={(e) => {
              const procedureId = e.target.value;
              const procedure = editor?.procedures.find((item) => item.id === procedureId);
              setForm((current) => ({
                ...current,
                procedureId,
                title: current.title || (procedure ? procedure.name : current.title),
              }));
            }}
          >
            <option value="">Nenhum</option>
            {editor?.procedures.map((procedure) => (
              <option key={procedure.id} value={procedure.id}>
                {procedure.code} · {procedure.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label>Consulta</Label>
          <select
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            value={form.appointmentId}
            onChange={(e) => setForm((current) => ({ ...current, appointmentId: e.target.value }))}
          >
            <option value="">Nenhuma</option>
            {editor?.appointments.map((appointment) => (
              <option key={appointment.id} value={appointment.id}>
                {formatDateTime(appointment.startsAt)} · {appointment.procedure ?? "Consulta"}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label>Item do plano</Label>
          <select
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            value={form.treatmentPlanItemId}
            onChange={(e) => {
              const treatmentPlanItemId = e.target.value;
              const item = editor?.planItems.find((planItem) => planItem.id === treatmentPlanItemId);
              setForm((current) => {
                if (!item || current.teeth.trim()) {
                  return { ...current, treatmentPlanItemId };
                }
                const toothForm = teethToForm(item.teeth);
                return {
                  ...current,
                  treatmentPlanItemId,
                  teeth: toothForm.teeth,
                  surfaces: toothForm.surfaces,
                  title: current.title || item.title,
                };
              });
            }}
          >
            <option value="">Nenhum</option>
            {editor?.planItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.planCode} · {item.title}
                {item.teeth.length ? ` · ${formatToothRefs(item.teeth)}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label>Observações</Label>
          <Textarea
            rows={2}
            value={form.notes}
            onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))}
            className="rounded-lg"
          />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Button type="button" size="sm" className="rounded-lg" disabled={pending} onClick={onSave}>
          {selected ? "Atualizar" : "Registrar"}
        </Button>
        <Button type="button" size="sm" variant="outline" className="rounded-lg" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </section>
  );
}

function EvolutionCard({
  evolution,
  canManage,
  canDelete,
  pending,
  onEdit,
  onDelete,
}: {
  evolution: ClinicalEvolutionDTO;
  canManage: boolean;
  canDelete: boolean;
  pending: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="rounded-lg border bg-background p-3 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">{evolution.title}</p>
          <p className="text-xs text-muted-foreground">
            {formatDateTime(evolution.occurredAt)}
            {evolution.professional ? ` · ${evolution.professional.name}` : ""}
            {evolution.authorName ? ` · ${evolution.authorName}` : ""}
          </p>
        </div>
        {canManage && (
          <div className="flex gap-1">
            <Button type="button" size="sm" variant="ghost" className="h-7 rounded-lg text-xs" onClick={onEdit}>
              Editar
            </Button>
            {canDelete && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 rounded-lg text-xs text-destructive hover:text-destructive"
                onClick={onDelete}
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
        <p className="mt-2 text-xs font-medium">{formatToothRefs(evolution.teeth)}</p>
      )}
      {evolution.procedure && (
        <p className="mt-1 text-xs text-muted-foreground">
          Procedimento: {evolution.procedure.code} · {evolution.procedure.name}
        </p>
      )}
      {evolution.treatmentPlanItem && (
        <p className="mt-1 text-xs text-muted-foreground">
          Plano: {evolution.treatmentPlanItem.planCode} · {evolution.treatmentPlanItem.title}
        </p>
      )}
      {evolution.appointment && (
        <p className="mt-1 text-xs text-muted-foreground">
          Consulta: {formatDateTime(evolution.appointment.startsAt)}
        </p>
      )}
    </article>
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
            className="w-full rounded-lg border px-3 py-2 text-left transition hover:bg-muted/40 disabled:cursor-default"
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

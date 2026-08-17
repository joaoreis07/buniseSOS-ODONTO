"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  getClinicalRecordAction,
  listAnamnesisRevisionsAction,
  upsertAnamnesisAction,
} from "@/modules/clinical-records/actions/clinical-record.actions";
import type {
  AnamnesisDTO,
  AnamnesisRevisionDTO,
} from "@/modules/clinical-records/dto/clinical-record.dto";
import type { PatientClientDTO } from "../../dto/patient.dto";

const ANAMNESIS_GROUPS: { title: string; fields: [keyof AnamnesisDTO, string, "short" | "long"][] }[] = [
  {
    title: "Saúde",
    fields: [
      ["allergies", "Alergias", "short"],
      ["medications", "Medicamentos em uso", "short"],
      ["diseases", "Doenças / condições", "short"],
      ["surgeries", "Cirurgias anteriores", "short"],
      ["medicalHistory", "Histórico médico", "long"],
      ["dentalHistory", "Histórico odontológico", "long"],
    ],
  },
  {
    title: "Hábitos",
    fields: [
      ["smoking", "Tabagismo", "short"],
      ["alcoholUse", "Consumo de álcool", "short"],
      ["oralHygiene", "Higiene oral", "short"],
      ["parafunctionalHabits", "Hábitos parafuncionais", "short"],
      ["otherHabits", "Outros hábitos", "short"],
    ],
  },
  {
    title: "Observações",
    fields: [["observations", "Observações gerais", "long"]],
  },
];

const EMPTY_FORM: Partial<AnamnesisDTO> = {
  allergies: "",
  medications: "",
  diseases: "",
  surgeries: "",
  medicalHistory: "",
  dentalHistory: "",
  observations: "",
  smoking: "",
  alcoholUse: "",
  oralHygiene: "",
  parafunctionalHabits: "",
  otherHabits: "",
};

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function PatientAnamnesisTab({
  patient,
  canManage,
}: {
  patient: PatientClientDTO;
  canManage: boolean;
}) {
  const [current, setCurrent] = useState<AnamnesisDTO | null>(null);
  const [form, setForm] = useState<Partial<AnamnesisDTO>>(EMPTY_FORM);
  const [revisions, setRevisions] = useState<AnamnesisRevisionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    setLoading(true);
    void Promise.all([
      getClinicalRecordAction({ patientId: patient.id }),
      listAnamnesisRevisionsAction({ patientId: patient.id }),
    ]).then(([record, history]) => {
      if (record.success) {
        setCurrent(record.data.anamnesis);
        setForm(record.data.anamnesis ?? EMPTY_FORM);
        setError(null);
      } else {
        setError(record.error);
      }
      if (history.success) setRevisions(history.data);
      setLoading(false);
    });
  }, [patient.id]);

  function save() {
    start(async () => {
      const result = await upsertAnamnesisAction({
        patientId: patient.id,
        expectedUpdatedAt: current?.updatedAt,
        allergies: form.allergies || null,
        medications: form.medications || null,
        diseases: form.diseases || null,
        surgeries: form.surgeries || null,
        medicalHistory: form.medicalHistory || null,
        dentalHistory: form.dentalHistory || null,
        observations: form.observations || null,
        smoking: form.smoking || null,
        alcoholUse: form.alcoholUse || null,
        oralHygiene: form.oralHygiene || null,
        parafunctionalHabits: form.parafunctionalHabits || null,
        otherHabits: form.otherHabits || null,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setCurrent(result.data);
      setForm(result.data);
      toast.success(result.message);
      const history = await listAnamnesisRevisionsAction({ patientId: patient.id });
      if (history.success) setRevisions(history.data);
    });
  }

  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.8fr)]">
        <Skeleton className="h-72 rounded-lg" />
        <Skeleton className="h-40 rounded-lg" />
      </div>
    );
  }

  if (error && !current) {
    return (
      <div className="surface-card p-5">
        <p className="font-medium text-destructive">Não foi possível carregar a anamnese</p>
        <p className="mt-1 text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.8fr)]">
      <section className="surface-card p-4">
        <div className="mb-3">
          <p className="font-medium text-foreground">Anamnese</p>
          <p className="text-sm text-muted-foreground">
            Formulário clínico deste paciente. Observações do cadastro permanecem no Resumo.
          </p>
        </div>
        {ANAMNESIS_GROUPS.map((group) => {
          const shortFields = group.fields.filter((field) => field[2] === "short");
          const longFields = group.fields.filter((field) => field[2] === "long");
          return (
            <div key={group.title} className="mb-4 last:mb-0">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {group.title}
              </p>
              {shortFields.length > 0 ? (
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {shortFields.map(([key, label]) => (
                    <Field
                      key={key}
                      id={`anam-${key}`}
                      label={label}
                      rows={2}
                      disabled={!canManage}
                      value={(form[key] as string | undefined) ?? ""}
                      onChange={(value) => setForm((currentForm) => ({ ...currentForm, [key]: value }))}
                    />
                  ))}
                </div>
              ) : null}
              {longFields.length > 0 ? (
                <div className={`${shortFields.length ? "mt-2.5" : ""} space-y-2.5`}>
                  {longFields.map(([key, label]) => (
                    <Field
                      key={key}
                      id={`anam-${key}`}
                      label={label}
                      rows={3}
                      disabled={!canManage}
                      value={(form[key] as string | undefined) ?? ""}
                      onChange={(value) => setForm((currentForm) => ({ ...currentForm, [key]: value }))}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
        {canManage ? (
          <div className="mt-3 flex justify-end">
            <Button type="button" size="sm" disabled={pending} onClick={save}>
              {pending ? "Salvando..." : current ? "Salvar anamnese" : "Registrar anamnese"}
            </Button>
          </div>
        ) : null}
      </section>

      <aside className="space-y-3">
        <div className="surface-card p-3.5 text-sm">
          <p className="font-medium">Última atualização</p>
          {current ? (
            <>
              <p className="mt-1.5 text-muted-foreground">{formatWhen(current.updatedAt)}</p>
              <p className="mt-0.5 text-muted-foreground">
                {current.updatedByName ? `Responsável: ${current.updatedByName}` : "Responsável não informado"}
              </p>
            </>
          ) : (
            <p className="mt-1.5 text-muted-foreground">Ainda não preenchida.</p>
          )}
        </div>
        <div className="surface-card p-3.5">
          <p className="font-medium">Histórico de alterações</p>
          {revisions.length === 0 ? (
            <p className="mt-1.5 text-sm text-muted-foreground">
              {current
                ? "A versão atual é a primeira. Alterações futuras ficam registradas aqui."
                : "Ainda não há anamnese para versionar."}
            </p>
          ) : (
            <ol className="mt-2 space-y-0">
              {revisions.map((revision, index) => (
                <li key={revision.id} className="relative flex gap-2.5 py-1.5 pl-1">
                  {index < revisions.length - 1 ? (
                    <span className="absolute left-[7px] top-6 bottom-0 w-px bg-border" />
                  ) : null}
                  <span className="relative z-10 mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground">Versão anterior</p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatWhen(revision.createdAt)}
                      {revision.actorName ? ` · ${revision.actorName}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </aside>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  rows,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  rows: number;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <Textarea
        id={id}
        rows={rows}
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-0"
      />
    </div>
  );
}

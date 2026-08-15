"use client";

import type { PatientClientDTO } from "../../dto/patient.dto";
import {
  BLOOD_LABELS,
  GENDER_LABELS,
  MARITAL_LABELS,
  formatCep,
  formatCpf,
  formatPhone,
} from "../../utils/patient.utils";

export function PatientOverviewTab({ patient }: { patient: PatientClientDTO }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <MiniCard
          label="Última consulta"
          value={
            patient.lastAppointmentAt
              ? new Intl.DateTimeFormat("pt-BR").format(new Date(patient.lastAppointmentAt))
              : "—"
          }
        />
        <MiniCard
          label="Próximas consultas"
          value={
            patient.upcomingAppointmentsCount > 0
              ? String(patient.upcomingAppointmentsCount)
              : "Nenhuma"
          }
        />
        <MiniCard label="Convênio" value={patient.insurance || "Particular"} />
      </div>

      <Card title="Dados pessoais">
        <Row label="Nome" value={patient.fullName} />
        <Row label="Apelido" value={patient.preferredName} />
        <Row
          label="Nascimento"
          value={
            patient.birthDate
              ? `${new Intl.DateTimeFormat("pt-BR").format(new Date(patient.birthDate))}${
                  patient.age != null ? ` (${patient.age} anos)` : ""
                }`
              : null
          }
        />
        <Row label="Sexo" value={GENDER_LABELS[patient.gender]} />
        <Row
          label="Estado civil"
          value={patient.maritalStatus ? MARITAL_LABELS[patient.maritalStatus] : null}
        />
        <Row label="CPF" value={formatCpf(patient.cpf)} />
        <Row label="RG" value={patient.rg} />
        <Row label="Profissão" value={patient.profession} />
      </Card>

      <Card title="Contatos">
        <Row label="Telefone" value={formatPhone(patient.phone)} />
        <Row label="WhatsApp" value={formatPhone(patient.whatsapp)} />
        <Row label="E-mail" value={patient.email} />
      </Card>

      <Card title="Endereço">
        <Row label="CEP" value={formatCep(patient.zipCode)} />
        <Row
          label="Endereço"
          value={[patient.address, patient.number].filter(Boolean).join(", ")}
        />
        <Row label="Bairro" value={patient.district} />
        <Row
          label="Cidade"
          value={[patient.city, patient.state].filter(Boolean).join(" / ")}
        />
      </Card>

      <Card title="Responsável">
        <Row label="Nome" value={patient.responsibleName} />
        <Row label="Telefone" value={formatPhone(patient.responsiblePhone)} />
      </Card>

      <Card title="Convênio">
        <Row label="Plano" value={patient.insurance || "Particular"} />
        <Row label="Número" value={patient.insuranceNumber} />
      </Card>

      <Card title="Dados médicos">
        <Row label="Tipo sanguíneo" value={BLOOD_LABELS[patient.bloodType]} />
        <Row label="Alergias" value={patient.allergies} />
        <Row label="Notas médicas" value={patient.medicalNotes} />
        <Row label="Observações" value={patient.observations} />
      </Card>
    </div>
  );
}

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[60%] text-right">{value || "—"}</span>
    </div>
  );
}
